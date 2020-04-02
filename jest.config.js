module.exports = {
  transform: {
    "^.+\\.ts?$": "ts-jest",
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/index.ts",
    "!src/**/Factory.ts",
  ],
  testEnvironment: "node",
  setupFilesAfterEnv: ["./jest.setup.js"],
};
