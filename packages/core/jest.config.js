module.exports = {
  moduleFileExtensions: ["ts", "js", "json"],
  preset: "ts-jest",
  collectCoverageFrom: ["src/**/*.{ts,tsx}"],
  globals: {
    "ts-jest": {
      tsConfig: "tsconfig.json",
      diagnostics: false,
    },
  },
};
