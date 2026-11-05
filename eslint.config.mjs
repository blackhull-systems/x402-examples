// Lint rules for every example: correctness only, formatting left to Prettier.
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default [
  { ignores: ["**/node_modules/", "**/.venv/"] },
  js.configs.recommended,
  { languageOptions: { globals: globals.node } },
  { linterOptions: { reportUnusedDisableDirectives: "error" } },
  prettier,
];
