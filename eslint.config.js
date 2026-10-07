import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules/", "public/vendor/", ".wrangler/", ".claude/"] },
  js.configs.recommended,
  {
    files: ["public/js/**/*.js"],
    languageOptions: { globals: { ...globals.browser, L: "readonly", google: "readonly" } },
  },
  {
    files: ["functions/**/*.js"],
    languageOptions: { globals: { ...globals.serviceworker } },
  },
  {
    files: ["test/**/*.js", "eslint.config.js"],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" }],
      eqeqeq: ["error", "always", { null: "ignore" }],
      "prefer-const": "error",
      "no-var": "error",
    },
  },
];
