# SAMN Selenium WebDriver E2E Automation Testing Suite

Comprehensive End-to-End (E2E) automation testing suite and test cases repository for the SAMN Hyperlocal Peer-to-Peer Help Platform web application.

---

## 📁 Directory Structure

```
selenium-tests/
├── tests/
│   └── login-tests.js                # Selenium WebDriver E2E test suite for Web Login
├── scripts/
│   └── generate-excel-report.js      # Excel report generator script
├── SAMN_Selenium_Login_Test_Report.xlsx  # Multi-sheet Excel report with 345 test cases
├── SAMN_Selenium_Login_Test_Report.csv   # Plaintext CSV export
├── package.json                      # Selenium & XLSX dependencies
└── README.md                         # Documentation & Execution Guide
```

---

## 🧪 Test Execution

### 1. Prerequisites
Ensure your web frontend is running (default `http://localhost:5173`) and backend is active (default `http://localhost:5000`).

### 2. Run Selenium Automated Login Tests
To run the automated Selenium test suite in headless mode:
```bash
npm run test:login
```

To run with a visible browser window:
```bash
HEADLESS=false npm run test:login
```

### 3. Generate / Update Excel Test Report (345+ Test Cases)
```bash
npm run generate:report
```

---

## 📊 Summary of Test Cases in Excel Report (345 Total Cases)

| Module / Category | Test Case Range | Case Count | Focus Areas |
| :--- | :--- | :--- | :--- |
| **1. Functional & Positive Login** | `TC-POS-001` - `TC-POS-040` | 40 | Valid Customer & Helper logins, email normalization, phone logins (+91), quick demo autofill, JWT generation, navbar profile sync. |
| **2. Authentication Failure & Negative Tests** | `TC-NEG-001` - `TC-NEG-045` | 45 | Unregistered emails/phones, invalid passwords, casing mismatches, expired accounts, 401 Unauthorized handling, error alerts. |
| **3. Input Validation, Formats & Boundaries** | `TC-VAL-001` - `TC-VAL-050` | 50 | Missing `@` symbols, invalid domains, spaces, short passwords, 256-char limits, Unicode, required field triggers. |
| **4. Security, Injection & Penetration Tests** | `TC-SEC-001` - `TC-SEC-045` | 45 | SQLi payloads (`' OR '1'='1`), NoSQL injection (`{"$gt": ""}`), XSS script tags, password masking, brute force lockout simulation. |
| **5. Session Management & Storage Security** | `TC-SESS-001` - `TC-SESS-035` | 35 | LocalStorage token persistence, multi-tab sync, hard refresh survival, logout token deletion, back-button security. |
| **6. Role Routing & Protected Route Guards** | `TC-ROLE-001` - `TC-ROLE-035` | 35 | Customer vs Helper dashboard isolation, route redirection for unauthenticated visitors, deep-link redirect preservation. |
| **7. UI/UX, Aesthetics & WCAG Accessibility** | `TC-UI-001` - `TC-UI-040` | 40 | Glassmorphism rendering, dark mode contrast compliance, tab navigation sequence, loading spinners, responsive layouts (Mobile/Tablet/Desktop). |
| **8. Performance, Latency & Network Resilience** | `TC-PERF-001` - `TC-PERF-030` | 30 | Page load times (<1.5s), API latency (<800ms), 3G throttling simulation, offline detection, button debounce. |
| **9. Cross-Browser & Device Compatibility** | `TC-XBR-001` - `TC-XBR-025` | 25 | Chrome, Firefox, Microsoft Edge, Safari/WebKit, Chrome Mobile, iOS viewport emulation. |
| **TOTAL** | | **345** | **Comprehensive Quality Assurance** |

---

## 📑 Excel Sheets Included
1. **`Executive Summary`**: High-level execution metrics, pass/fail status, and category-level breakdown.
2. **`Detailed Test Cases (300+)`**: Complete table containing **Test Case ID**, **Category**, **Scenario Title**, **Pre-conditions**, **Test Steps**, **Input Data**, **Expected Result**, **Actual Output**, **Status**, **Severity**, and **Automation Tool**.
