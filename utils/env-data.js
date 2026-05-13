const { envName } = require("./auth/load-env");

const data = {
  uat: {
    franchise:              "216 - Omaha, NE",
    assignee:               "Moiz SM UAT",
    contactSearch:          "moiz",
    contactLabel:           "Ali TkSmoke (moiz.qureshi+c1@",
    preferredUserSearches:  ["MoizSM", "Moiz User", "Moiz"],
  },
  staging: {
    franchise:              "Tkxel Test Franchise",
    assignee:               "Moiz SM UAT",
    contactSearch:          "moiz",
    contactLabel:           "Ali TkSmoke (moiz.qureshi+c1@",
    preferredUserSearches:  ["MoizSM", "Moiz User", "Moiz"],
  },
  prod: {
    franchise:              "Tkxel Test Franchise",
    assignee:               "Moiz ProdHO",
    contactSearch:          "Ahsan Awan",
    contactLabel:           "Ahsan Awan",
    preferredUserSearches:  ["Moiz ProdHO", "Moiz"],
  },
};

module.exports = data[envName] ?? data.uat;
