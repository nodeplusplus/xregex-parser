module.exports = {
  transform: {
    "^.+\\.ts?$": "ts-jest",
  },
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/**/index.ts"],
  testEnvironment: "node",
  setupFilesAfterEnv: ["./jest.setup.js"],
};
