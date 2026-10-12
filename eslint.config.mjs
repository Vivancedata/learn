import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // Stated, not "detect": eslint-plugin-react's detection calls
    // context.getFilename(), which ESLint 10 removed, so every file crashed
    // on `react/display-name`. Keep in step with the react major in package.json.
    settings: { react: { version: "19" } },
    rules: {
      // Ignore variables prefixed with underscore (common convention for unused params)
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // These stricter rules were introduced with newer Next/React lint presets and
      // would require a larger refactor across existing components.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
    },
  },
];

export default eslintConfig;
