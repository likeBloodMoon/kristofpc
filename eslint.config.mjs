/* eslint.config.mjs — ESLint 9 flat config */
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["**/.next/**", "**/node_modules/**", "**/dist/**"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "react-hooks": (await import("eslint-plugin-react-hooks")).default,
    },
    rules: {
      // React Compiler provides exhaustive-deps alternatives; keep rule relaxed:
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];