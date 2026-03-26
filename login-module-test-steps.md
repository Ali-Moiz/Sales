# Login Module Review

Reviewed files:
- `tests/e2e/login-module.spec.js`
- `pages/login-module.js`

## Login cases ko kaise execute karein

Requirements:
- `npm install`
- `data/credentials.js` mein valid `baseUrl`, `email`, aur `password`

Commands:
- Run only login suite: `npm run test:login`
- Run login suite in headed mode: `npm run test:login:headed`
- Run a single test by title: `npx playwright test tests/e2e/login-module.spec.js --project=chrome --grep "TC-002"`
- Run Playwright UI mode: `npm run test:ui`
- Show last report: `npm run report`

## Overall flow

`beforeEach` mein har test ke start par:
1. `loginPage = new LoginModule(page)` banta hai.
2. `loginPage.goto()` call hota hai.
3. `goto()`:
   - `credentials.baseUrl` open karta hai.
   - page par `Login` CTA wait karta hai.
   - `Login` button click karta hai.
   - email input visible hone ka wait karta hai.
   - auth scripts settle karne ke liye `networkidle` wait karta hai.

## Page object review

`pages/login-module.js` ye locators aur helper methods provide karta hai:
- `emailInput`: email field
- `passwordInput`: password field
- `loginButton`: `Log In` submit button
- `forgotPasswordLink`: forgot password link
- `microsoftLoginBtn`: Microsoft login button
- `passwordEye`: password show/hide icon
- `errorBanner`: login error text
- `signalLogo`, `welcomeHeading`, `tagline`, `copyright`: UI assertions ke liye
- `waitForDashboard()`: `/app/sales/dashboard` URL aur `Sales Insights` text ka wait
- `login(email, password)`: email fill + password fill + login click
- `getError()`: error banner visible hone ke baad uska text return karta hai
- `getPasswordFieldType()`: password input ka `type` attribute return karta hai

## Test cases

### TC-001 | Login page renders all required UI elements
Steps:
1. Login page open hota hai via `beforeEach`.
2. Ye elements visible assert hote hain:
   - logo
   - welcome heading
   - tagline
   - email input
   - password input
   - login button
   - forgot password link
   - Microsoft login button
   - copyright

Expected:
- Login page ke tamam core UI elements visible hon.

### TC-002 | Valid credentials navigate to dashboard
Steps:
1. `loginPage.login(VALID_EMAIL, VALID_PASS)` call hota hai.
2. Valid email fill hoti hai.
3. Valid password fill hota hai.
4. `Log In` click hota hai.
5. `waitForDashboard()` call hota hai.
6. Dashboard URL aur `Sales Insights` text assert hota hai.

Expected:
- User `/app/sales/dashboard` par navigate kare.
- Dashboard content visible ho.

### TC-003 | Empty form submission shows required fields error
Steps:
1. `Log In` click hota hai bina email/password fill kiye.
2. `getError()` banner text read karta hai.
3. Email input par error class check hoti hai.
4. Dashboard URL par na jana assert hota hai.

Expected:
- Error message: `Both email and password are required fields`
- Email field error state mein ho.
- Login success na ho.

### TC-004 | Email only with empty password shows server error
Steps:
1. Valid email fill hoti hai.
2. Password empty rehta hai.
3. `Log In` click hota hai.
4. `getError()` error text read karta hai.
5. Dashboard par redirect na hona assert hota hai.

Expected:
- Error message: `Wrong email or password`
- User dashboard par na jaye.

### TC-005 | Wrong password shows invalid credentials error
Steps:
1. Valid email fill hoti hai.
2. Wrong password fill hota hai.
3. `Log In` click hota hai.
4. Error text read hota hai.
5. Email field ki value same rehna assert hota hai.
6. Dashboard par redirect na hona assert hota hai.

Expected:
- Error message: `Wrong email or password`
- Entered email preserved rahe.
- Login fail ho.

### TC-006 | Non-existent email shows invalid credentials error
Steps:
1. Unknown email fill hoti hai.
2. Valid password fill hota hai.
3. `Log In` click hota hai.
4. Error text read hota hai.

Expected:
- Error message: `Wrong email or password`
- Login fail ho.

### TC-007 | Malformed email blocked by HTML5 validation
Steps:
1. Email field mein `notanemail` fill hota hai.
2. Valid password fill hota hai.
3. `Log In` click hota hai.
4. Browser validity API se email field ki validity check hoti hai.
5. Error banner visible na hona assert hota hai.

Expected:
- Email field invalid ho.
- Server-side error banner show na ho.
- Form HTML5 validation ki wajah se block ho.

### TC-008 | Eye icon reveals password (type changes to text)
Steps:
1. Password field mein sample password fill hota hai.
2. Initial field type `password` assert hota hai.
3. Eye icon click hota hai.
4. 300 ms wait hota hai.
5. Field type `text` assert hota hai.
6. Password value same rehna assert hota hai.

Expected:
- Password visible mode mein aa jaye.
- Entered password lose na ho.

### TC-009 | Eye icon hides password on second click
Steps:
1. Password field fill hota hai.
2. Eye icon click karke visible mode laya jata hai.
3. Type `text` assert hota hai.
4. Eye icon dobara click hota hai.
5. Type `password` assert hota hai.

Expected:
- Second click par password hidden mode mein wapas aa jaye.

### TC-010 | Pressing Enter on password field submits the form
Steps:
1. Valid email fill hoti hai.
2. Valid password fill hota hai.
3. Password field par `Enter` press hota hai.
4. `waitForDashboard()` call hota hai.
5. Dashboard URL assert hota hai.

Expected:
- Enter key form submit kare.
- Successful login ke baad dashboard open ho.

### TC-011 | Forgot Password link navigates to forgot-password page
Steps:
1. Forgot Password link ka `href` check hota hai.
2. Parallel mein URL wait aur link click hota hai.
3. Final URL mein `forgot-password` contain karna assert hota hai.

Expected:
- User forgot-password flow par navigate kare.

### TC-012 | Error clears when correct credentials entered after failed attempt
Steps:
1. Valid email + wrong password se login try hota hai.
2. Error banner visible assert hota hai.
3. Password field mein correct password fill hota hai.
4. Login button click hota hai.
5. `waitForDashboard()` call hota hai.
6. Dashboard URL assert hota hai.

Expected:
- Retry after failure successful ho.
- User dashboard par chala jaye.

### TC-013 | Login with Microsoft button is visible and enabled
Steps:
1. Microsoft login button visible assert hota hai.
2. Microsoft login button enabled assert hota hai.

Expected:
- Microsoft login button page par available aur clickable ho.

### TC-014 | User can log out and is redirected to the login page
Steps:
1. Valid email aur password se login hota hai.
2. `waitForDashboard()` ke through successful dashboard load verify hoti hai.
3. Dashboard URL open ki jati hai.
4. Top user menu trigger click hota hai.
5. Overlay close/dismiss ke liye reliable dismiss locator try hota hai.
6. `Logout` button click hota hai.
7. Login page ke `Welcome!` heading aur landing `Login` button visible assert hote hain.

Expected:
- User successfully log out ho.
- User login page par wapas aa jaye.

## Review notes

Observed behavior:
- Test suite functional hai aur login UI + happy path + negative cases + password toggle cover karti hai.
- `beforeEach` har test ke liye login form tak navigation repeat karta hai, is liye tests independent hain.

Risks / fragile points:
- `copyright` text `@2026 Signal. All rights reserved.` hardcoded hai. Year/text change hone par `TC-001` fail hoga.
- `goto()` homepage par `Login` CTA click hone par depend karta hai. Agar app direct login page kholne lage ya CTA text change ho jaye to saare tests impact honge.
- `TC-004` ka expected message app-side/server-side implementation par depend karta hai. Agar empty-password validation client-side ho gayi to result change ho sakta hai.
- `TC-014` user-menu trigger aur logout drawer/popover structure par depend karta hai. Header DOM ya user avatar rendering change hui to locator update karna padega.
