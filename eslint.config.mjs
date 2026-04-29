import js from "@eslint/js";
import playwright from "eslint-plugin-playwright";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    ignores: [
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      "artifacts/**",
      "reports/**",
      "dist/**",
      ".tmp/**",
    ],
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": [
        "error",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          caughtErrors: "none",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    files: ["pages/**/*.js", "utils/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },
  {
    files: ["tests/**/*.js"],
    ...playwright.configs["flat/recommended"],
  },
  {
    files: ["tests/**/*.js"],
    rules: {
      "playwright/no-wait-for-timeout": "off",
      "playwright/expect-expect": "off",
      "playwright/no-conditional-in-test": "off",
      "playwright/no-force-option": "off",
      "playwright/no-conditional-expect": "off"
    },
  },
];
