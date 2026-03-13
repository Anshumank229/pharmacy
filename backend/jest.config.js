// backend/jest.config.js
export default {
    testEnvironment: "node",
    // ESM support — no transform needed since backend uses native ESM
    transform: {},
    extensionsToTreatAsEsm: [".js"],
    testMatch: ["**/tests/**/*.test.js"],
    // Note: correct key is setupFilesAfterFramework → setupFilesAfterFramework is incorrect in prompt.
    // The correct Jest key is setupFilesAfterFramework: not a valid key.
    // Correct Jest key: setupFilesAfterFramework is NOT valid. Use:
    setupFiles: ["./tests/setup.js"],
    collectCoverageFrom: [
        "src/controllers/**/*.js",
        "src/middleware/**/*.js",
        "src/models/**/*.js",
        "src/utils/**/*.js",
        "!src/**/*.test.js"
    ],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 80,
            lines: 80,
            statements: 80
        }
    },
    // Increase timeout for mongodb-memory-server startup
    testTimeout: 30000,
    // Verbose output
    verbose: true
};
