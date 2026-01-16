export declare const testUtils: {
    createMockUser: (overrides?: {}) => {
        id: string;
        email: string;
        role: string;
        tier: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    };
    createMockNotification: (overrides?: {}) => {
        title: string;
        body: string;
        type: string;
        data: {};
        priority: string;
        ttl: number;
    };
    createMockMeshMessage: (overrides?: {}) => {
        type: string;
        payload: {
            skill: string;
        };
        timestamp: Date;
        sender: string;
        recipient: string;
        priority: string;
    };
    waitFor: (ms: number) => Promise<unknown>;
    createMockRequest: (overrides?: {}) => {
        method: string;
        url: string;
        headers: {};
        body: {};
        query: {};
        params: {};
        user: null;
        ip: string;
    };
    createMockResponse: () => any;
};
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeValidHealthCheck(): R;
            toBeValidErrorResponse(): R;
            toBeValidUser(): R;
            toBeValidNotification(): R;
            toBeValidMeshMessage(): R;
        }
    }
}
//# sourceMappingURL=setup.d.ts.map