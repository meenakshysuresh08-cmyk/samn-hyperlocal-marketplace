/**
 * ============================================================================
 * SAMN Platform - Mobile Page Object: HomeScreen
 * File: page-objects/HomeScreen.js
 * ============================================================================
 */

class HomeScreen {
  constructor(driver) {
    this.driver = driver;
  }

  // Bottom Tab Bar Items
  get tabHome() {
    return this.driver.$('~Home');
  }

  get tabRadar() {
    return this.driver.$('//android.widget.TextView[@text="Radar" or @text="Explore"]');
  }

  get tabChat() {
    return this.driver.$('~Chat');
  }

  get tabProfile() {
    return this.driver.$('~Profile');
  }

  get fabPostTask() {
    return this.driver.$('~Post Task');
  }

  get activeRolePill() {
    return this.driver.$('//android.widget.TextView[contains(@text, "Active Role")]');
  }

  get radarMapWebView() {
    return this.driver.$('//android.webkit.WebView');
  }

  get distanceFilterChips() {
    return this.driver.$$('//android.widget.TextView[contains(@text, "km")]');
  }

  get taskCards() {
    return this.driver.$$('//android.view.ViewGroup[contains(@content-desc, "task-card") or contains(@resource-id, "task-card")]');
  }

  // Actions
  async navigateToTab(tabName) {
    switch (tabName.toLowerCase()) {
      case 'home':
        await (await this.tabHome).click();
        break;
      case 'radar':
      case 'explore':
        await (await this.tabRadar).click();
        break;
      case 'chat':
        await (await this.tabChat).click();
        break;
      case 'profile':
        await (await this.tabProfile).click();
        break;
    }
  }

  async tapPostTaskFAB() {
    const fab = await this.fabPostTask;
    await fab.click();
  }

  async toggleActiveRole() {
    const pill = await this.activeRolePill;
    await pill.click();
  }

  async selectDistanceFilter(kmText) {
    const chip = await this.driver.$(`//android.widget.TextView[@text="${kmText}"]`);
    if (await chip.isExisting()) {
      await chip.click();
    }
  }
}

module.exports = HomeScreen;

