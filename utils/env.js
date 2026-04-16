
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
};

module.exports = { env };
