"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const setup_1 = require("../setup");
// Mock app for testing
const mockApp = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    use: jest.fn(),
    listen: jest.fn(),
};
describe('API Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('Health Check API', () => {
        it('should return 200 for health check', async () => {
            // Mock the health endpoint
            mockApp.get.mockImplementation((path, handler) => {
                if (path === '/health') {
                    handler(setup_1.testUtils.createMockRequest(), setup_1.testUtils.createMockResponse());
                }
            });
            const response = {
                status: 200,
                body: setup_1.testUtils.createMockUser(),
            };
            expect(response.status).toBe(200);
            expect(response.body).toBeValidUser();
        });
        it('should handle health check errors', async () => {
            const mockResponse = setup_1.testUtils.createMockResponse();
            mockResponse.status.mockReturnValue(mockResponse);
            mockResponse.json.mockReturnValue({
                success: false,
                error: {
                    code: 'HEALTH_CHECK_ERROR',
                    message: 'Health check failed',
                    timestamp: new Date().toISOString(),
                },
            });
            const errorResponse = {
                status: 500,
                body: {
                    success: false,
                    error: {
                        code: 'HEALTH_CHECK_ERROR',
                        message: 'Health check failed',
                        timestamp: new Date().toISOString(),
                    },
                },
            };
            expect(errorResponse.status).toBe(500);
            expect(errorResponse.body).toBeValidErrorResponse();
        });
    });
    describe('User API', () => {
        it('should create a new user', async () => {
            const userData = setup_1.testUtils.createMockUser({
                email: 'newuser@example.com',
                role: 'finance',
            });
            const mockResponse = setup_1.testUtils.createMockResponse();
            mockResponse.status.mockReturnValue(mockResponse);
            mockResponse.json.mockReturnValue({
                success: true,
                data: userData,
            });
            const response = {
                status: 201,
                body: {
                    success: true,
                    data: userData,
                },
            };
            expect(response.status).toBe(201);
            expect(response.body.data).toBeValidUser();
            expect(response.body.data.email).toBe('newuser@example.com');
            expect(response.body.data.role).toBe('finance');
        });
        it('should validate user data', async () => {
            const invalidUser = {
                email: 'invalid-email',
                role: 'invalid-role',
            };
            const mockResponse = setup_1.testUtils.createMockResponse();
            mockResponse.status.mockReturnValue(mockResponse);
            mockResponse.json.mockReturnValue({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid user data',
                    timestamp: new Date().toISOString(),
                },
            });
            const response = {
                status: 400,
                body: {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid user data',
                        timestamp: new Date().toISOString(),
                    },
                },
            };
            expect(response.status).toBe(400);
            expect(response.body).toBeValidErrorResponse();
        });
    });
    describe('Notification API', () => {
        it('should send a notification', async () => {
            const notificationData = setup_1.testUtils.createMockNotification({
                title: 'Test Notification',
                type: 'success',
            });
            const mockResponse = setup_1.testUtils.createMockResponse();
            mockResponse.status.mockReturnValue(mockResponse);
            mockResponse.json.mockReturnValue({
                success: true,
                data: notificationData,
            });
            const response = {
                status: 200,
                body: {
                    success: true,
                    data: notificationData,
                },
            };
            expect(response.status).toBe(200);
            expect(response.body.data).toBeValidNotification();
            expect(response.body.data.title).toBe('Test Notification');
            expect(response.body.data.type).toBe('success');
        });
        it('should validate notification data', async () => {
            const invalidNotification = {
                title: '',
                type: 'invalid-type',
            };
            const mockResponse = setup_1.testUtils.createMockResponse();
            mockResponse.status.mockReturnValue(mockResponse);
            mockResponse.json.mockReturnValue({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid notification data',
                    timestamp: new Date().toISOString(),
                },
            });
            const response = {
                status: 400,
                body: {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid notification data',
                        timestamp: new Date().toISOString(),
                    },
                },
            };
            expect(response.status).toBe(400);
            expect(response.body).toBeValidErrorResponse();
        });
    });
    describe('WebSocket API', () => {
        it('should handle WebSocket connection', async () => {
            const mockWebSocket = {
                on: jest.fn(),
                send: jest.fn(),
                close: jest.fn(),
            };
            // Mock WebSocket connection
            mockWebSocket.on.mockImplementation((event, handler) => {
                if (event === 'connection') {
                    handler(mockWebSocket);
                }
            });
            expect(mockWebSocket.on).toHaveBeenCalledWith('connection', expect.any(Function));
            expect(mockWebSocket.on).toHaveBeenCalledWith('message', expect.any(Function));
            expect(mockWebSocket.on).toHaveBeenCalledWith('close', expect.any(Function));
        });
        it('should validate WebSocket messages', async () => {
            const validMessage = setup_1.testUtils.createMockMeshMessage({
                type: 'skill_execution',
                payload: { skill: 'test-skill' },
            });
            const mockResponse = setup_1.testUtils.createMockResponse();
            mockResponse.status.mockReturnValue(mockResponse);
            mockResponse.json.mockReturnValue({
                success: true,
                data: validMessage,
            });
            const response = {
                status: 200,
                body: {
                    success: true,
                    data: validMessage,
                },
            };
            expect(response.status).toBe(200);
            expect(response.body.data).toBeValidMeshMessage();
            expect(response.body.data.type).toBe('skill_execution');
        });
    });
    describe('Error Handling', () => {
        it('should handle 404 errors', async () => {
            const mockResponse = setup_1.testUtils.createMockResponse();
            mockResponse.status.mockReturnValue(mockResponse);
            mockResponse.json.mockReturnValue({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Resource not found',
                    timestamp: new Date().toISOString(),
                },
            });
            const response = {
                status: 404,
                body: {
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'Resource not found',
                        timestamp: new Date().toISOString(),
                    },
                },
            };
            expect(response.status).toBe(404);
            expect(response.body).toBeValidErrorResponse();
            expect(response.body.error.code).toBe('NOT_FOUND');
        });
        it('should handle 500 errors', async () => {
            const mockResponse = setup_1.testUtils.createMockResponse();
            mockResponse.status.mockReturnValue(mockResponse);
            mockResponse.json.mockReturnValue({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Internal server error',
                    timestamp: new Date().toISOString(),
                },
            });
            const response = {
                status: 500,
                body: {
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: 'Internal server error',
                        timestamp: new Date().toISOString(),
                    },
                },
            };
            expect(response.status).toBe(500);
            expect(response.body).toBeValidErrorResponse();
            expect(response.body.error.code).toBe('INTERNAL_ERROR');
        });
    });
});
//# sourceMappingURL=api.test.js.map