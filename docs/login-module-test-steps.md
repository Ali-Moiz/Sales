# Login Module — Test Steps

## How to Run

```bash
npm run test:uat:login
npx playwright test tests/e2e/login-module.spec.js --grep "TC-LOGIN-003"
npm run report
```

---

### TC-LOGIN-001 | Verify that HO/FO/Sales Manager/Director/Coordinator/Supervisor is able to login
**Preconditions:** Valid credentials for 6 roles in `.env.uat`: HO, FO, SM, Director, Supervisor, Coordinator.
> **Note:** Sales Person (SP) excluded — the SP account authenticates via Auth0 but the app returns `?loginError=access_denied`. Re-add once SP is granted web-portal access.
**Steps:**
1. Navigate to the login page
2. Enter HO email and password, click "Log In", wait for dashboard
3. Log out, navigate back to login page
4. Enter FO email and password, click "Log In", wait for dashboard
5. Log out, navigate back to login page
6. Enter SM email and password, click "Log In", wait for dashboard
7. Log out, navigate back to login page
8. Enter SP email and password, click "Log In", wait for dashboard
9. Log out, navigate back to login page
10. Enter Director email and password, click "Log In", wait for dashboard
11. Log out, navigate back to login page
12. Enter Supervisor email and password, click "Log In", wait for dashboard
13. Log out, navigate back to login page
14. Enter Coordinator email and password, click "Log In", wait for dashboard
**Expected results / Assertion points:**
- After step 2: URL contains `/app/sales/` and dashboard content is visible (HO)
- After step 4: URL contains `/app/sales/` and dashboard content is visible (FO)
- After step 6: URL contains `/app/sales/` and dashboard content is visible (SM)
- After step 8: URL contains `/app/sales/` and dashboard content is visible (SP)
- After step 10: URL contains `/app/sales/` and dashboard content is visible (Director)
- After step 12: URL contains `/app/sales/` and dashboard content is visible (Supervisor)
- After step 14: URL contains `/app/sales/` and dashboard content is visible (Coordinator)

---

### TC-LOGIN-002 | Verify that HO/FO/Supervisor/Director is able to perform "Forget Password?"
**Preconditions:** None — Forgot Password is Auth0-managed, same link for all roles. Full flow requires email inbox access (not automatable end-to-end).
**Steps:**
1. Navigate to the login page
2. Observe the "Forgot Password?" link href
3. Click the "Forgot Password?" link
4. Wait for navigation to forgot-password page
5. Verify the forgot-password page loads
**Expected results / Assertion points:**
- After step 2: Link href contains "forgot-password"
- After step 4: URL contains "forgot-password"
- After step 5: Page loads without errors

---

### TC-LOGIN-003 | Verify that the user can log in successfully with valid credentials
**Preconditions:** Valid HO credentials in `.env.uat`
**Steps:**
1. Navigate to the login page
2. Enter valid HO email
3. Enter valid HO password
4. Click "Log In"
5. Wait for dashboard to load
**Expected results / Assertion points:**
- After step 5: URL contains `/app/sales/dashboard`
- After step 5: "Sales Insights" text is visible on dashboard

---

### TC-LOGIN-004 | Verify that the system redirects to the correct dashboard/home page after successful login
**Preconditions:** Valid HO credentials in `.env.uat`
**Steps:**
1. Navigate to the login page
2. Enter valid credentials and click "Log In"
3. Wait for redirect
**Expected results / Assertion points:**
- After step 3: URL contains `/app/sales/dashboard`
- After step 3: "Sales Insights" heading is visible
- After step 3: Dashboard breadcrumb or navigation element is visible

---

### TC-LOGIN-005 | Verify that the system remembers the user when the "Remember Me" option is selected
**Preconditions:** None
**Note:** No "Remember Me" checkbox exists on the Auth0 login form. This test verifies the absence of the feature.
**Steps:**
1. Navigate to the login page
2. Inspect the login form for a "Remember Me" checkbox or toggle
**Expected results / Assertion points:**
- After step 2: No "Remember Me" element is present on the form

---

### TC-LOGIN-006 | Verify that the password field hides the entered characters
**Preconditions:** None
**Steps:**
1. Navigate to the login page
2. Enter a password in the password field
3. Observe the password field type attribute
4. Click the eye icon to reveal the password
**Expected results / Assertion points:**
- After step 2: Password field type is "password" (characters hidden)
- After step 4: Password field type is "text" (characters revealed)
- After step 4: Password value matches what was entered ("Admin@123")

---

### TC-LOGIN-007 | Verify that pressing the Enter key submits the login form successfully
**Preconditions:** Valid HO credentials
**Steps:**
1. Navigate to the login page
2. Enter valid email
3. Enter valid password
4. Press Enter key on the password field
5. Wait for dashboard to load
**Expected results / Assertion points:**
- After step 5: URL contains `/app/sales/dashboard`

---

### TC-LOGIN-008 | Verify that the login page loads properly with all required UI elements
**Preconditions:** None — fresh browser session
**Steps:**
1. Navigate to the Signal landing page
2. Click the "Login" button to open Auth0 login form
3. Observe all UI elements
**Expected results / Assertion points:**
- After step 2: Signal logo is visible
- After step 2: "Welcome!" heading is visible
- After step 2: Tagline text is visible
- After step 2: Email input field is visible
- After step 2: Password input field is visible
- After step 2: "Log In" button is visible
- After step 2: "Forgot Password?" link is visible
- After step 2: "Login with Microsoft" button is visible
- After step 2: Copyright text is visible

---

### TC-LOGIN-009 | Verify that the user can log out and is redirected to the login page
**Preconditions:** Valid HO credentials (user must be logged in)
**Steps:**
1. Log in with valid credentials using performLogin()
2. Navigate to dashboard
3. Open user menu (avatar/profile icon)
4. Click "Logout"
5. Wait for redirect to login/landing page
**Expected results / Assertion points:**
- After step 5: "Welcome!" heading is visible
- After step 5: Either the landing-page "Login" button is visible or the login form is visible

---

### TC-LOGIN-010 | Verify that an error message is displayed when an incorrect password is entered
**Preconditions:** Valid HO email, wrong password
**Steps:**
1. Navigate to the login page
2. Enter valid email
3. Enter wrong password
4. Click "Log In"
**Expected results / Assertion points:**
- After step 4: Error message "Wrong email or password" is displayed
- After step 4: Email input retains the entered value
- After step 4: URL does NOT contain `/app/sales/dashboard`

---

### TC-LOGIN-011 | Verify that an error message is displayed when a non-registered username is used
**Preconditions:** Non-existent email address
**Steps:**
1. Navigate to the login page
2. Enter non-existent email
3. Enter any password
4. Click "Log In"
**Expected results / Assertion points:**
- After step 4: Error message "Wrong email or password" is displayed

---

### TC-LOGIN-012 | Verify that an error message is shown when both fields are left blank
**Preconditions:** None
**Steps:**
1. Navigate to the login page
2. Leave email and password fields empty
3. Click "Log In"
**Expected results / Assertion points:**
- After step 3: Error message "Both email and password are required fields" is displayed
- After step 3: Email input has error styling (error-field class)
- After step 3: URL does NOT contain `/app/sales/dashboard`

---

### TC-LOGIN-013 | Verify that login fails when only one field (username or password) is filled
**Preconditions:** Valid HO email, valid password
**Steps:**
1. Navigate to the login page
2. Enter only email (leave password empty), click "Log In"
3. Observe that login is blocked
4. Reload login page
5. Enter only password (leave email empty), click "Log In"
6. Observe that login is blocked
**Expected results / Assertion points:**
- After step 3: Login form remains visible
- After step 3: Email input retains the entered value
- After step 3: Password input remains empty
- After step 3: URL does NOT contain `/app/`
- After step 6: Login form remains visible
- After step 6: Email input remains empty
- After step 6: Password input retains the entered value
- After step 6: URL does NOT contain `/app/`

---

### TC-LOGIN-014 | Verify that the login functionality works across different browsers
**Preconditions:** None
**Note:** Cross-browser testing is a configuration concern handled by `playwright.config.js` projects (Chromium, Firefox, WebKit). This test verifies core login works in the current browser project.
**Steps:**
1. Navigate to the login page
2. Enter valid credentials
3. Click "Log In"
4. Wait for dashboard
**Expected results / Assertion points:**
- After step 4: URL contains `/app/sales/dashboard`
- After step 4: Dashboard content is visible

---

### TC-LOGIN-015 | Verify that the login page is responsive on multiple devices
**Preconditions:** None
**Steps:**
1. Set viewport to mobile size (375x667 — iPhone SE)
2. Navigate to the login page
3. Observe all critical UI elements
4. Set viewport to tablet size (768x1024 — iPad)
5. Navigate to the login page
6. Observe all critical UI elements
**Expected results / Assertion points:**
- After step 3: Email input, password input, "Log In" button, and "Forgot Password?" link are all visible at mobile viewport
- After step 6: Email input, password input, "Log In" button, and "Forgot Password?" link are all visible at tablet viewport

---

### TC-LOGIN-016 | Verify that the "Forgot Password" link navigates to the correct page
**Preconditions:** None
**Steps:**
1. Navigate to the login page
2. Observe the "Forgot Password?" link href
3. Click the "Forgot Password?" link
4. Wait for navigation
**Expected results / Assertion points:**
- After step 2: Link href contains "forgot-password"
- After step 4: URL contains "forgot-password"
