
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
  email_fo: process.env.SIGNAL_EMAIL_FO || "",
  password_fo: process.env.SIGNAL_PASSWORD_FO || "",
  email_director: process.env.SIGNAL_EMAIL_DIRECTOR || "",
  password_director: process.env.SIGNAL_PASSWORD_DIRECTOR || "",
  email_supervisor: process.env.SIGNAL_EMAIL_SUPERVISOR || "",
  password_supervisor: process.env.SIGNAL_PASSWORD_SUPERVISOR || "",
  email_coordinator: process.env.SIGNAL_EMAIL_COORDINTOR || "",
  password_coordinator: process.env.SIGNAL_PASSWORD_COORDINTOR || "",
  ho_username: process.env.HO_USERNAME || ""
};

module.exports = { env };
