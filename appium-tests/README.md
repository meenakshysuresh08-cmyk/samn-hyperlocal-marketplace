# SAMN Appium Mobile E2E Automation Testing Suite

Comprehensive End-to-End (E2E) automation testing suite and test cases repository for the **SAMN (Someone Around Me Now)** React Native / Expo mobile application on **Android** and **iOS**.

---

## 📁 Directory Structure

```
appium-tests/
├── config/
│   └── capabilities.js                 # Android (UiAutomator2) & iOS (XCUITest) Appium settings
├── page-objects/
│   ├── AuthScreen.js                   # Page Object: Login, Register, OTP & Demo Credentials
│   ├── HomeScreen.js                   # Page Object: Bottom Tab Navigation, Radar Map, Role Toggle
│   └── TaskScreen.js                   # Page Object: Post Task Form, Map Pin Picker, Bids, Live Tracking
├── tests/
│   └── app-e2e.test.js                 # WebdriverIO + Appium automated test execution suite
├── scripts/
│   └── generate-excel-report.js         # Report generator producing 350+ mobile test scenarios
├── SAMN_Appium_Mobile_E2E_Test_Report.xlsx  # Multi-sheet Excel report (350 test cases)
├── SAMN_Appium_Mobile_E2E_Test_Report.csv   # Plaintext CSV export
├── package.json                         # Dependencies & npm scripts
└── README.md                            # Documentation & execution guide
```

---

## 🚀 Prerequisites

1. **Appium 2.0 Server Installed:**
   ```bash
   npm install -g appium
   appium driver install uiautomator2    # For Android
   appium driver install xcuitest        # For iOS (macOS only)
   ```
2. **Start Appium Server:**
   ```bash
   appium
   ```
   *(Runs on `http://127.0.0.1:4723`)*

3. **Android Device / Emulator Running:**
   Ensure an emulator or physical device with USB Debugging enabled is attached:
   ```bash
   adb devices
   ```

4. **Backend Server Running:**
   Ensure the backend is online on port 3000 (`cd backend && npm run dev`).

---

## 🧪 Test Execution

### 1. Run Automated Mobile E2E Tests on Android
```bash
cd appium-tests
npm run test:app
```

### 2. Run on iOS (macOS with Simulator)
```bash
PLATFORM=ios npm run test:app
```

### 3. Regenerate / Update the 350+ Test Cases Excel Report
```bash
npm run generate:report
```

---

## 📊 Summary of Test Cases in Excel Report (350 Total Cases)

| Module / Functional Category | Case Count | Primary Focus Areas |
| :--- | :---: | :--- |
| **1. App Bootstrap, Splash & Deep Linking** | 35 | Splash screen (#005F50), font loading, cold start performance, deep link intent resolution (`samn://task/:id`) |
| **2. Mobile Authentication & Recovery** | 45 | Mobile number & email logins, password masking, OTP cell auto-advance/backspace, password reset, error banners |
| **3. Session Persistence & Offline Mode** | 35 | AsyncStorage JWT preservation across app restarts, auto-login, NetInfo offline banners, optimistic state sync |
| **4. Bottom Tab Navigation & Role Switcher** | 35 | Tab switching (Home, Radar, Chat, Profile), center floating action button (FAB), Customer <-> Helper role switch |
| **5. Customer Task Creation & Location Pinning** | 45 | Multiline descriptions, budget validation, urgent flag toggle, interactive Leaflet map pin dragging & reverse geocoding |
| **6. Helper Radar Discovery & Distance Filter** | 35 | Live Leaflet radar WebView, nearby pins, exclusion of creator's own tasks, radius filter chips (5km, 10km, 15km) |
| **7. Real-Time Bidding & Offer Negotiation** | 30 | First-click offer submission, bid negotiation, Socket.IO instant notification to customer, bid acceptance |
| **8. Live GPS Tracking Map (Leaflet WebView)** | 30 | Customer & helper markers with real names, live animated location stream, polyline route, recenter button |
| **9. Task Completion Handshake & Reviews** | 30 | 4-digit OTP handshake, camera proof snapshot with watermark, mutual 5-star ratings, financial totals update |
| **10. Native Device Features & Permissions** | 30 | Android runtime permissions (ACCESS_FINE_LOCATION, CAMERA, NOTIFICATIONS), hardware back button handling, dark/light theme |
| **TOTAL** | **350** | **100% Comprehensive Mobile QA Coverage** |

---

## 📑 Excel Report Structure

The generated spreadsheet **`SAMN_Appium_Mobile_E2E_Test_Report.xlsx`** contains:
1. **`Executive Summary`**: Overall test status, architecture, and module-wise test metrics.
2. **`Detailed Mobile Tests (300+)`**: All 350 test cases with Test ID, Category, Title, Pre-conditions, Numbered Steps, Input Data, Expected Results, Actual Output, Status, Severity, and Automation Tool.

