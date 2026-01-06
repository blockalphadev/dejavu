/**
 * Test Mocks
 * 
 * Mock implementations for testing services and repositories.
 */

/**
 * Mock Logger
 */
export const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
};

/**
 * Mock Supabase Client
 */
export function createMockSupabaseClient() {
    return {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
}

/**
 * Mock Config Service
 */
export function createMockConfigService(config: Record<string, any> = {}) {
    return {
        get: jest.fn((key: string, defaultValue?: any) => config[key] ?? defaultValue),
        getOrThrow: jest.fn((key: string) => {
            if (config[key] === undefined) {
                throw new Error(`Config key "${key}" not found`);
            }
            return config[key];
        }),
    };
}

/**
 * Mock JWT Service
 */
export function createMockJwtService() {
    return {
        sign: jest.fn().mockReturnValue('mock-jwt-token'),
        signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
        verify: jest.fn().mockReturnValue({ sub: 'user-123' }),
        verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-123' }),
        decode: jest.fn().mockReturnValue({ sub: 'user-123' }),
    };
}

/**
 * Mock Cache Service
 */
export function createMockCacheService() {
    const cache = new Map<string, any>();

    return {
        get: jest.fn(async (key: string) => cache.get(key)),
        set: jest.fn(async (key: string, value: any) => {
            cache.set(key, value);
        }),
        delete: jest.fn(async (key: string) => cache.delete(key)),
        clear: jest.fn(async () => cache.clear()),
        has: jest.fn(async (key: string) => cache.has(key)),
    };
}

/**
 * Mock Event Bus
 */
export function createMockEventBus() {
    const handlers = new Map<string, Function[]>();

    return {
        publish: jest.fn(async (event: { type: string; payload: any }) => {
            const eventHandlers = handlers.get(event.type) || [];
            for (const handler of eventHandlers) {
                await handler(event);
            }
        }),
        subscribe: jest.fn((eventType: string, handler: Function) => {
            const existing = handlers.get(eventType) || [];
            handlers.set(eventType, [...existing, handler]);
            return () => {
                const current = handlers.get(eventType) || [];
                handlers.set(eventType, current.filter(h => h !== handler));
            };
        }),
    };
}

// Jest global mock
declare const jest: {
    fn: () => jest.Mock;
    Mock: any;
};
