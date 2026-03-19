const nextCoreWebVitals = require("eslint-config-next/core-web-vitals");

module.exports = [
  ...nextCoreWebVitals,
  {
    rules: {
      // Add project-specific rules or overrides here.
      // Example: disable the react/react-in-jsx-scope rule for React 17+
      "react/react-in-jsx-scope": "off",
    },
  },
];
