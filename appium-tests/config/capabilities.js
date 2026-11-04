/**
 * ============================================================================
 * SAMN Platform - Appium Capabilities Configuration
 * File: config/capabilities.js
 * Platform Support: Android (UiAutomator2) & iOS (XCUITest)
 * ============================================================================
 */

const path = require('path');

const APPIUM_HOST = process.env.APPIUM_HOST || '127.0.0.1';
const APPIUM_PORT = parseInt(process.env.APPIUM_PORT || '4723', 10);

const androidCapabilities = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:deviceName': process.env.ANDROID_DEVICE_NAME || 'Android_Emulator',
  'appium:appPackage': process.env.APP_PACKAGE || 'com.samn.taskmanager',
  'appium:appActivity': process.env.APP_ACTIVITY || 'com.samn.taskmanager.MainActivity',
  'appium:noReset': true,
  'appium:newCommandTimeout': 240,
  'appium:autoGrantPermissions': true,
  'appium:ensureWebviewsHavePages': true,
  'appium:nativeWebScreenshot': true,
};

const iosCapabilities = {
  platformName: 'iOS',
  'appium:automationName': 'XCUITest',
  'appium:deviceName': process.env.IOS_DEVICE_NAME || 'iPhone 15',
  'appium:platformVersion': process.env.IOS_PLATFORM_VERSION || '17.0',
  'appium:bundleId': process.env.IOS_BUNDLE_ID || 'com.samn.taskmanager',
  'appium:noReset': true,
  'appium:newCommandTimeout': 240,
  'appium:autoAcceptAlerts': true,
};

const getDriverOptions = (platform = 'android') => {
  return {
    hostname: APPIUM_HOST,
    port: APPIUM_PORT,
    path: '/',
    logLevel: 'info',
    capabilities: platform.toLowerCase() === 'ios' ? iosCapabilities : androidCapabilities,
  };
};

module.exports = {
  APPIUM_HOST,
  APPIUM_PORT,
  androidCapabilities,
  iosCapabilities,
  getDriverOptions,
};

