// ============================================================
// pages/login.page.js
// Re-exports LoginModule under the 'LoginPage' alias
// for compatibility with market-verticals spec.
// The canonical implementation lives in login-module.js
// ============================================================

const { LoginModule } = require('./login-module');

// Alias so that tests can import either name
class LoginPage extends LoginModule {}

module.exports = { LoginPage, LoginModule };
