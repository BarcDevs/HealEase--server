export default {
    testEnvironment: 'node',
    transform: {
        '^.+\\.ts$': 'ts-jest'
    },
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.[tj]s$': '$1'
    },
    transformIgnorePatterns: [
        'node_modules/(?!(@exodus|html-encoding-sniffer|jsdom)/)'
    ],
    testMatch: [
        '**/*.spec.ts',
        '**/*.test.ts'
    ],
    testPathIgnorePatterns: [
        '/node_modules/',
        '\\.integration\\.test\\.ts$'
    ],
    setupFilesAfterEnv: [
        '<rootDir>/src/__tests__/setup/jestSetup.ts'
    ],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 83,
            lines: 87,
            statements: 87
        }
    }
}
