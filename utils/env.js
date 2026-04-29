
const env = {
  baseUrl: (process.env.BASE_URL || "https://uat.sales.teamsignal.com").replace(
    /\/$/,
    "",
  ),
  email: process.env.SIGNAL_EMAIL_HO || "",
  password: process.env.SIGNAL_PASSWORD_HO || "",
  email_sm: process.env.SIGNAL_EMAIL_SM || "",
  password_sm: process.env.SIGNAL_PASSWORD_SM || "",
  email_sp: process.env.SIGNAL_EMAIL_SP || "",
  password_sp: process.env.SIGNAL_PASSWORD_SP || "",
  // Display name of the HO user as shown in the CRM UI (e.g. "Moiz").
  // Set HO_USERNAME in .env.[environment] to match the logged-in user's display name.
  ho_username: process.env.HO_USERNAME || "",
};

module.exports = { env };
