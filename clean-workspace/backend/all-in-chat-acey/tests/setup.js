"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testUtils = void 0;
const globals_1 = require("@jest/globals");
const logger_1 = require("../src/utils/logger");
const environment_1 = require("../src/config/environment");
const secretsManager_1 = require("../src/utils/secretsManager");
// Global test setup
(0, globals_1.beforeAll)(async () => {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'error';
    process.env.DB_HOST = 'localhost';
    process.env.DB_NAME = 'acey_test';
    process.env.REDIS_DB = '1';
    // Initialize services
    const logger = new logger_1.Logger();
    const envService = environment_1.EnvironmentService.getInstance();
    const secretsManager = secretsManager_1.SecretsManager.getInstance();
    logger.log('Test environment initialized');
});
(0, globals_1.afterAll)(async () => {
    // Cleanup test environment
    const logger = new logger_1.Logger();
    logger.log('Test environment cleaned up');
});
(0, globals_1.beforeEach)(async () => {
    // Reset mocks and test data
    jest.clearAllMocks();
});
(0, globals_1.afterEach)(async () => {
    // Cleanup after each test
    jest.restoreAllMocks();
});
// Global test utilities
exports.testUtils = {
    createMockUser: (overrides = {}) => ({
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'owner',
        tier: 'core',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    }),
    createMockNotification: (overrides = {}) => ({
        title: 'Test Notification',
        body: 'Test notification body',
        type: 'info',
        data: {},
        priority: 'normal',
        ttl: 3600,
        ...overrides,
    }),
    createMockMeshMessage: (overrides = {}) => ({
        type: 'skill_execution',
        payload: { skill: 'test-skill' },
        timestamp: new Date(),
        sender: 'test-sender',
        recipient: 'test-recipient',
        priority: 'normal',
        ...overrides,
    }),
    waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    createMockRequest: (overrides = {}) => ({
        method: 'GET',
        url: '/test',
        headers: {},
        body: {},
        query: {},
        params: {},
        user: null,
        ip: '127.0.0.1',
        ...overrides,
    }),
    createMockResponse: () => {
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            cookie: jest.fn().mockReturnThis(),
            clearCookie: jest.fn().mockReturnThis(),
        };
        return res;
    },
};
// Also make available globally for backward compatibility
global.testUtils = exports.testUtils;
// Custom matchers
expect.extend({
    toBeValidHealthCheck(received) {
        const pass = received &&
            typeof received.status === 'string' &&
            ['healthy', 'unhealthy', 'degraded'].includes(received.status) &&
            received.timestamp &&
            typeof received.uptime === 'number' &&
            received.services &&
            Array.isArray(received.services);
        return {
            message: () => pass ? 'expected health check to be invalid' : 'expected health check to be valid',
            pass,
        };
    },
    toBeValidErrorResponse(received) {
        const pass = received &&
            received.success === false &&
            received.error &&
            received.error.code &&
            received.error.message &&
            received.error.timestamp;
        return {
            message: () => pass ? 'expected error response to be invalid' : 'expected error response to be valid',
            pass,
        };
    },
    toBeValidUser(received) {
        const pass = received &&
            typeof received.id === 'string' &&
            typeof received.email === 'string' &&
            ['owner', 'finance', 'legal', 'dev', 'partner'].includes(received.role);
        return {
            message: () => pass ? 'expected user to be invalid' : 'expected user to be valid',
            pass,
        };
    },
    toBeValidNotification(received) {
        const pass = received &&
            typeof received.title === 'string' &&
            typeof received.body === 'string' &&
            ['info', 'warning', 'error', 'success'].includes(received.type);
        return {
            message: () => pass ? 'expected notification to be invalid' : 'expected notification to be valid',
            pass,
        };
    },
    toBeValidMeshMessage(received) {
        const pass = received &&
            typeof received.type === 'string' &&
            received.payload &&
            received.timestamp;
        return {
            message: () => pass ? 'expected mesh message to be invalid' : 'expected mesh message to be valid',
            pass,
        };
    },
});
//# sourceMappingURL=setup.js.map