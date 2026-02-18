import tseslint from "typescript-eslint";

export default [
  { files: ["**/*.{js,mjs,cjs,ts,tsx}"] },
  tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
  },
];
