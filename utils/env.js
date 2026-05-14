
function required(key) {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

const env = {
  baseUrl: required("BASE_URL").replace(/\/$/, ""),
  email: required("SIGNAL_EMAIL_HO"),
  password: required("SIGNAL_PASSWORD_HO"),
  email_sm: required("SIGNAL_EMAIL_SM"),
  password_sm: required("SIGNAL_PASSWORD_SM"),
  email_sp: required("SIGNAL_EMAIL_SP"),
  password_sp: required("SIGNAL_PASSWORD_SP"),
  email_fo: required("SIGNAL_EMAIL_FO"),
  password_fo: required("SIGNAL_PASSWORD_FO"),
  email_director: required("SIGNAL_EMAIL_DIRECTOR"),
  password_director: required("SIGNAL_PASSWORD_DIRECTOR"),
  email_supervisor: required("SIGNAL_EMAIL_SUPERVISOR"),
  password_supervisor: required("SIGNAL_PASSWORD_SUPERVISOR"),
  email_coordinator: required("SIGNAL_EMAIL_COORDINTOR"),
  password_coordinator: required("SIGNAL_PASSWORD_COORDINTOR"),
  ho_username: required("HO_USERNAME"),
  username_sm: required("SM_USERNAME"),
};

module.exports = { env };
