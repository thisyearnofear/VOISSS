import tseslint from "typescript-eslint";

export default [
  { files: ["**/*.{js,mjs,cjs,ts,tsx}"] },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    // Ambient declarations and polyfills legitimately use triple-slash
    // references, @ts-ignore guards, and empty marker interfaces.
    files: ["**/*.d.ts", "polyfills.ts"],
    rules: {
      "@typescript-eslint/triple-slash-reference": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
];
