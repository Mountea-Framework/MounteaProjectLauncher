// Type-aware rules require npm ci; Codacy hosted analysis uses .eslintrc.json.
module.exports = {
  "extends": [
    "./.eslintrc.json"
  ],
  "overrides": [
    {
      "files": [
        "**/*.ts",
        "**/*.tsx"
      ],
      "parserOptions": {
        "project": "./tsconfig.json",
        "tsconfigRootDir": __dirname
      },
      "extends": [
        "plugin:@typescript-eslint/recommended-type-checked"
      ],
      "rules": {
        "@typescript-eslint/no-unsafe-argument": "error",
        "@typescript-eslint/no-unsafe-member-access": "error",
        "@typescript-eslint/no-unsafe-assignment": "error",
        "@typescript-eslint/no-confusing-void-expression": "error",
        "@typescript-eslint/no-unsafe-call": "error",
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/no-unsafe-return": "error",
        "@typescript-eslint/no-unnecessary-type-assertion": "error",
        "@typescript-eslint/prefer-nullish-coalescing": "error",
        "@typescript-eslint/no-unnecessary-condition": "error",
        "@typescript-eslint/use-unknown-in-catch-callback-variable": "error",
        "@typescript-eslint/no-redundant-type-constituents": "error"
      }
    }
  ]
};
