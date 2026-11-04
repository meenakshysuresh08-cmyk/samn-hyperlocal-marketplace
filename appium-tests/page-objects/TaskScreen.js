/**
 * ============================================================================
 * SAMN Platform - Mobile Page Object: TaskScreen
 * File: page-objects/TaskScreen.js
 * ============================================================================
 */

class TaskScreen {
  constructor(driver) {
    this.driver = driver;
  }

  // Task Creation Form
  get taskTitleInput() {
    return this.driver.$('~Task Title input');
  }

  get taskDescriptionInput() {
    return this.driver.$('~Task Description input');
  }

  get taskBudgetInput() {
    return this.driver.$('~Budget Amount input');
  }

  get urgentSwitch() {
    return this.driver.$('~Urgent Task switch');
  }

  get chooseLocationBtn() {
    return this.driver.$('~Choose on Map button');
  }

  get submitTaskBtn() {
    return this.driver.$('~Post Task button');
  }

  // Interactive Location Picker Modal
  get mapPickerConfirmBtn() {
    return this.driver.$('//android.widget.TextView[contains(@text, "Confirm Location")]');
  }

  get mapPickerCloseBtn() {
    return this.driver.$('~Close location picker');
  }

  // Bidding & Live Tracking
  get makeOfferBtn() {
    return this.driver.$('//android.widget.TextView[contains(@text, "Make an Offer")]');
  }

  get offerAmountInput() {
    return this.driver.$('~Offer Amount input');
  }

  get submitOfferBtn() {
    return this.driver.$('~Submit Offer button');
  }

  get liveTrackingModalBtn() {
    return this.driver.$('//android.widget.TextView[contains(@text, "Track Live")]');
  }

  get recenterGpsBtn() {
    return this.driver.$('//android.widget.TextView[contains(@text, "Recenter")]');
  }

  // Actions
  async fillTaskForm({ title, description, budget, isUrgent = false }) {
    if (title) {
      const titleEl = await this.taskTitleInput;
      await titleEl.setValue(title);
    }
    if (description) {
      const descEl = await this.taskDescriptionInput;
      await descEl.setValue(description);
    }
    if (budget) {
      const budgetEl = await this.taskBudgetInput;
      await budgetEl.setValue(String(budget));
    }
    if (isUrgent) {
      const switchEl = await this.urgentSwitch;
      await switchEl.click();
    }
  }

  async tapSubmitTask() {
    const btn = await this.submitTaskBtn;
    await btn.click();
  }

  async submitBid(amount, message = '') {
    const makeOffer = await this.makeOfferBtn;
    await makeOffer.click();

    const amountInput = await this.offerAmountInput;
    await amountInput.setValue(String(amount));

    const submitBtn = await this.submitOfferBtn;
    await submitBtn.click();
  }
}

module.exports = TaskScreen;

