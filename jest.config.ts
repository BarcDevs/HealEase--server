export default {
    testEnvironment: 'node',
    transform: {
        "^.+\\.ts$": "ts-jest"
    },
    testMatch: [
        "**/*.spec.ts",
        "**/*.test.ts",
    ]
}
