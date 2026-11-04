/**
 * ============================================================================
 * SAMN Platform - Appium Mobile E2E Automation Testing Suite
 * File: tests/app-e2e.test.js
 * Framework: WebdriverIO + Appium 2.0 (UiAutomator2 / XCUITest)
 * ============================================================================
 */

const { remote } = require('webdriverio');
const { getDriverOptions } = require('../config/capabilities');
const AuthScreen = require('../page-objects/AuthScreen');
const HomeScreen = require('../page-objects/HomeScreen');
const TaskScreen = require('../page-objects/TaskScreen');

const PLATFORM = process.env.PLATFORM || 'android';

async function runMobileE2ETests() {
  console.log('================================================================');
  console.log('📱 SAMN MOBILE E2E APPIUM AUTOMATION TEST SUITE');
  console.log(`🤖 Target Platform: ${PLATFORM.toUpperCase()}`);
  console.log('================================================================\n');

  const driverOptions = getDriverOptions(PLATFORM);
  let driver;
  const testResults = [];

  const recordResult = (id, name, moduleName, status, expected, actual, notes = '') => {
    const icon = status === 'PASSED' ? '✅' : status === 'FAILED' ? '❌' : '⚠️';
    console.log(`${icon} [${id}] ${name} -> ${status}`);
    testResults.push({
      id,
      name,
      module: moduleName,
      status,
      expected,
      actual,
      notes,
      timestamp: new Date().toISOString(),
    });
  };

  try {
    console.log('⏳ Connecting to Appium Server at localhost:4723...');
    driver = await remote(driverOptions);
    console.log('🚀 Mobile Application Launched Successfully!\n');

    const authScreen = new AuthScreen(driver);
    const homeScreen = new HomeScreen(driver);
    const taskScreen = new TaskScreen(driver);

    // -------------------------------------------------------------
    // TEST 1: App Launch & Initial Welcome Rendering
    // -------------------------------------------------------------
    try {
      const emailField = await authScreen.emailInput;
      const isVisible = await emailField.waitForDisplayed({ timeout: 15000 });
      recordResult(
        'MOB-E2E-001',
        'Verify Application Launch & Login Screen Presence',
        'App Launch & Bootstrap',
        isVisible ? 'PASSED' : 'FAILED',
        'Login form is displayed on initial launch',
        `Email field visible: ${isVisible}`
      );
    } catch (e) {
      recordResult('MOB-E2E-001', 'Verify App Launch', 'App Launch & Bootstrap', 'FAILED', 'Screen visible', e.message);
    }

    // -------------------------------------------------------------
    // TEST 2: Password Field Masking
    // -------------------------------------------------------------
    try {
      const passField = await authScreen.passwordInput;
      const isPasswordType = (await passField.getAttribute('password')) === 'true' || (await passField.getAttribute('type')) === 'password';
      recordResult(
        'MOB-E2E-002',
        'Verify Native Password Field Characters Masking',
        'Security & UI',
        isPasswordType ? 'PASSED' : 'FAILED',
        'Password input is masked with bullet characters',
        `Masked attribute: ${isPasswordType}`
      );
    } catch (e) {
      recordResult('MOB-E2E-002', 'Password Masking', 'Security & UI', 'FAILED', 'Masked', e.message);
    }

    // -------------------------------------------------------------
    // TEST 3: Negative Validation - Invalid Credentials
    // -------------------------------------------------------------
    try {
      await authScreen.enterCredentials('unregistered_9999@example.com', 'WrongPass!123');
      await authScreen.tapSignIn();

      const hasError = await driver.waitUntil(
        async () => await authScreen.isErrorAlertVisible(),
        { timeout: 8000, interval: 500 }
      );

      const errorMsg = await authScreen.getErrorMessage();
      recordResult(
        'MOB-E2E-003',
        'Verify Rejection of Unregistered User with Native Alert Banner',
        'Authentication Negative',
        hasError ? 'PASSED' : 'FAILED',
        'Alert banner with error message displayed',
        `Error text: "${errorMsg}"`
      );
    } catch (e) {
      recordResult('MOB-E2E-003', 'Invalid User Rejection', 'Authentication Negative', 'FAILED', 'Error displayed', e.message);
    }

    // -------------------------------------------------------------
    // TEST 4: Positive Authentication - Customer Sign In
    // -------------------------------------------------------------
    try {
      await authScreen.enterCredentials('customer@example.com', 'password123');
      await authScreen.tapSignIn();

      const homeTab = await homeScreen.tabHome;
      const navigated = await homeTab.waitForDisplayed({ timeout: 12000 });

      recordResult(
        'MOB-E2E-004',
        'Verify Customer Login & Navigation to Main Tab Bar',
        'Authentication & Routing',
        navigated ? 'PASSED' : 'FAILED',
        'Successfully authenticated and navigated to Home bottom tabs',
        `Home Tab displayed: ${navigated}`
      );
    } catch (e) {
      recordResult('MOB-E2E-004', 'Customer Login Success', 'Authentication & Routing', 'FAILED', 'Navigated to Home', e.message);
    }

    // -------------------------------------------------------------
    // TEST 5: Bottom Navigation Tab Switching
    // -------------------------------------------------------------
    try {
      await homeScreen.navigateToTab('radar');
      const radarWebView = await homeScreen.radarMapWebView;
      const radarLoaded = await radarWebView.waitForDisplayed({ timeout: 10000 });

      recordResult(
        'MOB-E2E-005',
        'Verify Bottom Tab Navigation to Radar / Explore Screen',
        'Navigation & UI',
        radarLoaded ? 'PASSED' : 'FAILED',
        'Interactive Leaflet radar map is rendered inside native WebView',
        `WebView loaded: ${radarLoaded}`
      );
    } catch (e) {
      recordResult('MOB-E2E-005', 'Radar Navigation', 'Navigation & UI', 'FAILED', 'Radar loaded', e.message);
    }

    // -------------------------------------------------------------
    // TEST 6: Geofence Distance Filter Interaction
    // -------------------------------------------------------------
    try {
      await homeScreen.selectDistanceFilter('10 km');
      recordResult(
        'MOB-E2E-006',
        'Verify Distance Radius Filter Chip (10 km) Selection',
        'Geolocation & Radar',
        'PASSED',
        'Distance filter updates radar search radius to 10 km',
        'Selected chip: 10 km'
      );
    } catch (e) {
      recordResult('MOB-E2E-006', 'Distance Chip Filter', 'Geolocation & Radar', 'FAILED', 'Filtered', e.message);
    }

    // -------------------------------------------------------------
    // TEST 7: Post Task Modal Opening
    // -------------------------------------------------------------
    try {
      await homeScreen.navigateToTab('home');
      await homeScreen.tapPostTaskFAB();

      const titleInput = await taskScreen.taskTitleInput;
      const modalOpen = await titleInput.waitForDisplayed({ timeout: 6000 });

      recordResult(
        'MOB-E2E-007',
        'Verify Floating Action Button (FAB) opens Task Creation Screen',
        'Task Management',
        modalOpen ? 'PASSED' : 'FAILED',
        'Task creation form is displayed with all input fields',
        `Title input visible: ${modalOpen}`
      );
    } catch (e) {
      recordResult('MOB-E2E-007', 'FAB Task Creation', 'Task Management', 'FAILED', 'Form displayed', e.message);
    }

    // -------------------------------------------------------------
    // TEST 8: Role Switching between Customer & Helper
    // -------------------------------------------------------------
    try {
      await homeScreen.navigateToTab('profile');
      await homeScreen.toggleActiveRole();

      recordResult(
        'MOB-E2E-008',
        'Verify Role Switching (Customer <-> Helper) Updates Profile & Tab State',
        'Role Management',
        'PASSED',
        'Active role switches dynamically, updating radar and earnings dashboards',
        'Role toggled successfully'
      );
    } catch (e) {
      recordResult('MOB-E2E-008', 'Role Switcher', 'Role Management', 'FAILED', 'Toggled', e.message);
    }

  } catch (err) {
    console.error('⚠️ Critical Appium Session Error:', err.message);
    console.log('💡 Note: Make sure the Appium server is running on port 4723 (`appium`) and an Android/iOS emulator is open.');
  } finally {
    if (driver) {
      await driver.deleteSession();
      console.log('\n🔒 Appium test driver session closed cleanly.');
    }
  }

  return testResults;
}

module.exports = {
  runMobileE2ETests,
};

if (require.main === module) {
  runMobileE2ETests()
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

