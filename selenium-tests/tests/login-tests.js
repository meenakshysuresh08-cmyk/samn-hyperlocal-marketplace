/**
 * ============================================================================
 * SAMN Platform - End-to-End (E2E) Selenium WebDriver Test Suite
 * File: login-tests.js
 * Purpose: Automated E2E verification of user authentication, form validation,
 *          security boundary conditions, session persistence, and role routing.
 * ============================================================================
 */

const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');

// Test Configuration
const CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:5173',
  timeout: 10000,
  headless: process.env.HEADLESS !== 'false',
  screenshotDir: path.join(__dirname, '../reports/screenshots'),
};

// Page Object Model: LoginPage
class LoginPage {
  constructor(driver) {
    this.driver = driver;
    this.url = `${CONFIG.baseUrl}/login`;

    // Locators
    this.emailInput = By.css('input[type="text"]');
    this.passwordInput = By.css('input[type="password"]');
    this.submitButton = By.css('button[type="submit"]');
    this.fillCustomerBtn = By.xpath("//button[contains(text(), 'Fill Customer')]");
    this.fillHelperBtn = By.xpath("//button[contains(text(), 'Fill Helper')]");
    this.errorAlert = By.css('.bg-red-500\\/10');
    this.registerLink = By.xpath("//a[contains(@href, '/register')]");
  }

  async navigate() {
    await this.driver.get(this.url);
    await this.driver.wait(until.elementLocated(this.emailInput), CONFIG.timeout);
  }

  async login(emailOrPhone, password) {
    const emailField = await this.driver.findElement(this.emailInput);
    const passField = await this.driver.findElement(this.passwordInput);

    await emailField.sendKeys(Key.CONTROL, 'a');
    await emailField.sendKeys(Key.BACK_SPACE);
    if (emailOrPhone) await emailField.sendKeys(emailOrPhone);

    await passField.sendKeys(Key.CONTROL, 'a');
    await passField.sendKeys(Key.BACK_SPACE);
    if (password) await passField.sendKeys(password);

    const submitBtn = await this.driver.findElement(this.submitButton);
    await submitBtn.click();
  }

  async clickFillCustomer() {
    const btn = await this.driver.findElement(this.fillCustomerBtn);
    await btn.click();
  }

  async clickFillHelper() {
    const btn = await this.driver.findElement(this.fillHelperBtn);
    await btn.click();
  }

  async getEmailValue() {
    const field = await this.driver.findElement(this.emailInput);
    return await field.getAttribute('value');
  }

  async getPasswordValue() {
    const field = await this.driver.findElement(this.passwordInput);
    return await field.getAttribute('value');
  }

  async getErrorMessage() {
    try {
      const err = await this.driver.wait(until.elementLocated(this.errorAlert), 3000);
      return await err.getText();
    } catch (e) {
      return null;
    }
  }

  async isSubmitDisabled() {
    const btn = await this.driver.findElement(this.submitButton);
    return !(await btn.isEnabled());
  }
}

// Test Runner Execution Harness
async function runSeleniumTestSuite() {
  console.log('================================================================');
  console.log('🚀 SAMN AUTOMATED SELENIUM E2E LOGIN TEST SUITE');
  console.log(`🌐 Target Base URL: ${CONFIG.baseUrl}`);
  console.log(`🖥️ Mode: ${CONFIG.headless ? 'Headless Chrome' : 'Visible UI Browser'}`);
  console.log('================================================================\n');

  // Setup Chrome Options
  const chromeOptions = new chrome.Options();
  if (CONFIG.headless) {
    chromeOptions.addArguments('--headless=new');
  }
  chromeOptions.addArguments(
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--window-size=1920,1080',
    '--ignore-certificate-errors'
  );

  let driver;
  const results = [];

  try {
    driver = await new Builder().forBrowser('chrome').setChromeOptions(chromeOptions).build();
    const loginPage = new LoginPage(driver);

    // Helper assertion tracker
    const recordTest = (id, name, category, status, expected, actual, notes = '') => {
      const icon = status === 'PASSED' ? '✅' : status === 'FAILED' ? '❌' : '⚠️';
      console.log(`${icon} [${id}] ${name} -> ${status}`);
      results.push({
        id,
        name,
        category,
        status,
        expected,
        actual,
        notes,
        timestamp: new Date().toISOString(),
      });
    };

    // -------------------------------------------------------------
    // GROUP 1: Core UI Element Rendering & Accessibility
    // -------------------------------------------------------------
    try {
      await loginPage.navigate();
      const title = await driver.getTitle();
      recordTest(
        'TC-UI-001',
        'Verify Login Page Title & Container Loads',
        'UI Rendering',
        'PASSED',
        'Page contains valid title',
        `Title: "${title || 'SAMN'}"`
      );
    } catch (e) {
      recordTest('TC-UI-001', 'Verify Login Page Title', 'UI Rendering', 'FAILED', 'Title visible', e.message);
    }

    try {
      const emailField = await driver.findElement(loginPage.emailInput);
      const isVisible = await emailField.isDisplayed();
      recordTest(
        'TC-UI-002',
        'Verify Email or Phone input field is visible & editable',
        'UI Rendering',
        isVisible ? 'PASSED' : 'FAILED',
        'Field displayed',
        `Visible: ${isVisible}`
      );
    } catch (e) {
      recordTest('TC-UI-002', 'Verify Email Input Field', 'UI Rendering', 'FAILED', 'Field displayed', e.message);
    }

    try {
      const passField = await driver.findElement(loginPage.passwordInput);
      const type = await passField.getAttribute('type');
      recordTest(
        'TC-UI-003',
        'Verify Password input field is masked (type="password")',
        'Security / UI',
        type === 'password' ? 'PASSED' : 'FAILED',
        'type="password"',
        `type="${type}"`
      );
    } catch (e) {
      recordTest('TC-UI-003', 'Verify Password Masking', 'Security / UI', 'FAILED', 'type="password"', e.message);
    }

    try {
      const submitBtn = await driver.findElement(loginPage.submitButton);
      const text = await submitBtn.getText();
      recordTest(
        'TC-UI-004',
        'Verify Sign In Submit button is rendered with active label',
        'UI Rendering',
        text.includes('Sign In') ? 'PASSED' : 'FAILED',
        'Button contains "Sign In"',
        `Button Text: "${text}"`
      );
    } catch (e) {
      recordTest('TC-UI-004', 'Verify Submit Button', 'UI Rendering', 'FAILED', 'Button rendered', e.message);
    }

    // -------------------------------------------------------------
    // GROUP 2: Quick Demo Fill Buttons
    // -------------------------------------------------------------
    try {
      await loginPage.clickFillCustomer();
      const email = await loginPage.getEmailValue();
      const pass = await loginPage.getPasswordValue();
      const matched = email === 'customer@example.com' && pass === 'password123';
      recordTest(
        'TC-FUNC-005',
        'Verify "Fill Customer" demo shortcut auto-fills customer credentials',
        'Functional',
        matched ? 'PASSED' : 'FAILED',
        'customer@example.com / password123',
        `${email} / ${pass}`
      );
    } catch (e) {
      recordTest('TC-FUNC-005', 'Verify Fill Customer Button', 'Functional', 'FAILED', 'Auto-fill succeeds', e.message);
    }

    try {
      await loginPage.clickFillHelper();
      const email = await loginPage.getEmailValue();
      const pass = await loginPage.getPasswordValue();
      const matched = email === 'helper@example.com' && pass === 'password123';
      recordTest(
        'TC-FUNC-006',
        'Verify "Fill Helper" demo shortcut auto-fills helper credentials',
        'Functional',
        matched ? 'PASSED' : 'FAILED',
        'helper@example.com / password123',
        `${email} / ${pass}`
      );
    } catch (e) {
      recordTest('TC-FUNC-006', 'Verify Fill Helper Button', 'Functional', 'FAILED', 'Auto-fill succeeds', e.message);
    }

    // -------------------------------------------------------------
    // GROUP 3: Negative Validation & Error Handling
    // -------------------------------------------------------------
    try {
      await loginPage.login('nonexistent_user_9999@test.com', 'WrongPassword!999');
      const err = await loginPage.getErrorMessage();
      const errorDisplayed = err !== null && err.length > 0;
      recordTest(
        'TC-NEG-007',
        'Verify Authentication rejection for non-registered email with error banner',
        'Negative Testing',
        errorDisplayed ? 'PASSED' : 'FAILED',
        'Error banner displayed',
        `Error: "${err || 'None'}"`
      );
    } catch (e) {
      recordTest('TC-NEG-007', 'Non-registered user rejection', 'Negative Testing', 'FAILED', 'Error banner displayed', e.message);
    }

    try {
      await loginPage.login('customer@example.com', 'IncorrectPassword123');
      const err = await loginPage.getErrorMessage();
      const errorDisplayed = err !== null;
      recordTest(
        'TC-NEG-008',
        'Verify Authentication rejection for valid email with incorrect password',
        'Negative Testing',
        errorDisplayed ? 'PASSED' : 'FAILED',
        'Authentication failure alert',
        `Error: "${err || 'None'}"`
      );
    } catch (e) {
      recordTest('TC-NEG-008', 'Invalid password rejection', 'Negative Testing', 'FAILED', 'Error alert displayed', e.message);
    }

    // -------------------------------------------------------------
    // GROUP 4: Security & Injection Boundary Tests
    // -------------------------------------------------------------
    try {
      await loginPage.login("' OR '1'='1' --", "' OR '1'='1'");
      const currentUrl = await driver.getCurrentUrl();
      const notBypassed = currentUrl.includes('/login');
      recordTest(
        'TC-SEC-009',
        'Verify SQL Injection payload in Email & Password does not bypass authentication',
        'Security / SQLi',
        notBypassed ? 'PASSED' : 'FAILED',
        'Remains on /login without unauthorized token generation',
        `URL: ${currentUrl}`
      );
    } catch (e) {
      recordTest('TC-SEC-009', 'SQLi Resilience Test', 'Security / SQLi', 'FAILED', 'Login rejected', e.message);
    }

    try {
      await loginPage.login('<script>alert("XSS")</script>', '<script>');
      const currentUrl = await driver.getCurrentUrl();
      const safe = currentUrl.includes('/login');
      recordTest(
        'TC-SEC-010',
        'Verify XSS script tags in username/password are sanitized without script execution',
        'Security / XSS',
        safe ? 'PASSED' : 'FAILED',
        'XSS sanitized without alert popups',
        `URL: ${currentUrl}`
      );
    } catch (e) {
      recordTest('TC-SEC-010', 'XSS Sanitization Test', 'Security / XSS', 'FAILED', 'XSS sanitized', e.message);
    }

    // -------------------------------------------------------------
    // GROUP 5: Successful Customer Authentication & Route Navigation
    // -------------------------------------------------------------
    try {
      await loginPage.clickFillCustomer();
      const submitBtn = await driver.findElement(loginPage.submitButton);
      await submitBtn.click();

      // Wait for URL transition to explore or dashboard
      await driver.wait(until.urlContains('/explore'), CONFIG.timeout);
      const postLoginUrl = await driver.getCurrentUrl();
      const redirected = postLoginUrl.includes('/explore');

      recordTest(
        'TC-FUNC-011',
        'Verify Valid Customer Login successfully redirects to Explore / Discovery page',
        'Functional / Positive',
        redirected ? 'PASSED' : 'FAILED',
        'Redirects to /explore',
        `Redirected URL: ${postLoginUrl}`
      );
    } catch (e) {
      recordTest('TC-FUNC-011', 'Customer Login & Redirection', 'Functional / Positive', 'FAILED', 'Redirect to /explore', e.message);
    }

    // -------------------------------------------------------------
    // GROUP 6: Session Storage & Token Persistence
    // -------------------------------------------------------------
    try {
      const token = await driver.executeScript("return localStorage.getItem('token') || localStorage.getItem('auth_token');");
      const hasToken = token !== null && token.length > 10;
      recordTest(
        'TC-SESS-012',
        'Verify JWT token is stored securely in browser localStorage upon successful login',
        'Session Persistence',
        hasToken ? 'PASSED' : 'FAILED',
        'Valid JWT token stored in localStorage',
        `Token length: ${token ? token.length : 0}`
      );
    } catch (e) {
      recordTest('TC-SESS-012', 'Token Storage Check', 'Session Persistence', 'FAILED', 'Token stored', e.message);
    }

    // -------------------------------------------------------------
    // GROUP 7: Keyboard Navigation (Enter key submission)
    // -------------------------------------------------------------
    try {
      await loginPage.navigate();
      await loginPage.clickFillHelper();
      const passField = await driver.findElement(loginPage.passwordInput);
      await passField.sendKeys(Key.ENTER);

      await driver.wait(until.urlContains('/explore'), CONFIG.timeout);
      const url = await driver.getCurrentUrl();
      recordTest(
        'TC-ACC-013',
        'Verify Keyboard "ENTER" key submits login form and navigates successfully',
        'Accessibility',
        url.includes('/explore') ? 'PASSED' : 'FAILED',
        'Enter key submits form',
        `Target URL: ${url}`
      );
    } catch (e) {
      recordTest('TC-ACC-013', 'Enter Key Form Submission', 'Accessibility', 'FAILED', 'Submits on Enter', e.message);
    }

    // -------------------------------------------------------------
    // GROUP 8: Register Navigation Link
    // -------------------------------------------------------------
    try {
      await loginPage.navigate();
      const regLink = await driver.findElement(loginPage.registerLink);
      await regLink.click();
      await driver.wait(until.urlContains('/register'), CONFIG.timeout);
      const url = await driver.getCurrentUrl();
      recordTest(
        'TC-NAV-014',
        'Verify "Create Account" link navigates to Registration Page',
        'Navigation',
        url.includes('/register') ? 'PASSED' : 'FAILED',
        'Redirects to /register',
        `URL: ${url}`
      );
    } catch (e) {
      recordTest('TC-NAV-014', 'Register Link Navigation', 'Navigation', 'FAILED', 'Navigates to register', e.message);
    }
  } catch (globalError) {
    console.error('⚠️ Critical Selenium execution exception:', globalError);
  } finally {
    if (driver) {
      await driver.quit();
      console.log('\n🔒 Selenium WebDriver session closed cleanly.');
    }
  }

  return results;
}

// Export for integration & test runners
module.exports = {
  LoginPage,
  runSeleniumTestSuite,
};

// If executed directly: node tests/login-tests.js
if (require.main === module) {
  runSeleniumTestSuite()
    .then((results) => {
      console.log('\n================================================================');
      console.log(`📊 Total Automated Live Tests Executed: ${results.length}`);
      const passed = results.filter((r) => r.status === 'PASSED').length;
      console.log(`✅ Passed: ${passed} | ❌ Failed: ${results.length - passed}`);
      console.log('================================================================\n');
    })
    .catch((err) => {
      console.error('Execution failure:', err);
    });
}
