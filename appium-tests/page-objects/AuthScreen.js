/**
 * ============================================================================
 * SAMN Platform - Mobile Page Object: AuthScreen
 * File: page-objects/AuthScreen.js
 * ============================================================================
 */

class AuthScreen {
  constructor(driver) {
    this.driver = driver;
  }

  // Locators (Supports Android accessibility-id & XPath fallback)
  get emailInput() {
    return this.driver.$('~Email or Phone input');
  }

  get passwordInput() {
    return this.driver.$('~Password input');
  }

  get submitButton() {
    return this.driver.$('~Sign In button');
  }

  get registerLink() {
    return this.driver.$('~Create Account link');
  }

  get forgotPasswordLink() {
    return this.driver.$('~Forgot Password link');
  }

  get errorAlertBanner() {
    return this.driver.$('//android.widget.TextView[contains(@text, "failed") or contains(@text, "Invalid") or contains(@text, "Error")]');
  }

  get fillCustomerBtn() {
    return this.driver.$('//android.widget.TextView[contains(@text, "Customer")]');
  }

  get fillHelperBtn() {
    return this.driver.$('//android.widget.TextView[contains(@text, "Helper")]');
  }

  get otpInputContainer() {
    return this.driver.$('~One-time password');
  }

  // Actions
  async enterCredentials(emailOrPhone, password) {
    const emailField = await this.emailInput;
    if (await emailField.isExisting()) {
      await emailField.clearValue();
      await emailField.setValue(emailOrPhone);
    }

    const passField = await this.passwordInput;
    if (await passField.isExisting()) {
      await passField.clearValue();
      await passField.setValue(password);
    }
  }

  async tapSignIn() {
    const btn = await this.submitButton;
    await btn.click();
  }

  async tapRegister() {
    const link = await this.registerLink;
    await link.click();
  }

  async tapForgotPassword() {
    const link = await this.forgotPasswordLink;
    await link.click();
  }

  async isErrorAlertVisible() {
    try {
      const banner = await this.errorAlertBanner;
      return await banner.isDisplayed();
    } catch (e) {
      return false;
    }
  }

  async getErrorMessage() {
    try {
      const banner = await this.errorAlertBanner;
      return await banner.getText();
    } catch (e) {
      return '';
    }
  }
}

module.exports = AuthScreen;

