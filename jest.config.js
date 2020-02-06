module.exports = {
  collectCoverageFrom: ["lib/**/*.js"],
  coverageDirectory: "./coverage",
  coverageReporters: ["lcov", "text-summary"],
  moduleFileExtensions: ["js", "json"],
  setupFilesAfterEnv: ["./test/setup/expect.js"],
  testMatch: ["**/test/(unit|e2e)/**/*.spec.js"],
  testEnvironment: "node",
};
