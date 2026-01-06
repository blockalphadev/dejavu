/**
 * Test Fixtures
 * 
 * Reusable test data for unit and integration tests.
 */

export const mockUser = {
    id: 'user-123-abc-456',
    email: 'test@example.com',
    fullName: 'Test User',
    walletAddresses: [
        { address: '0x1234567890abcdef1234567890abcdef12345678', chain: 'ethereum' },
    ],
    createdAt: new Date('2024-01-01T00:00:00Z'),
};

export const mockMarket = {
    id: '0x' + 'a'.repeat(64),
    creator: '0x1234567890abcdef1234567890abcdef12345678',
    title: 'Will ETH reach $5,000 by end of 2024?',
    description: 'This market resolves YES if ETH price is >= $5,000 on December 31, 2024.',
    endTime: BigInt(1735689600), // Dec 31, 2024
    resolutionTime: BigInt(1735776000),
    totalYesShares: BigInt('1000000000000000000000'), // 1000 shares
    totalNoShares: BigInt('500000000000000000000'),   // 500 shares
    resolved: false,
    outcome: null,
    collateralToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    chain: 'evm' as const,
    chainId: '8453',
};

export const mockPosition = {
    marketId: mockMarket.id,
    user: mockUser.walletAddresses[0].address,
    yesShares: BigInt('100000000000000000000'), // 100 shares
    noShares: BigInt('50000000000000000000'),   // 50 shares
    chain: 'evm' as const,
};

export const mockTokens = {
    usdc: {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        symbol: 'USDC',
        decimals: 6,
    },
    usdt: {
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        symbol: 'USDT',
        decimals: 6,
    },
};

/**
 * Create mock market with custom properties
 */
export function createMockMarket(overrides: Partial<typeof mockMarket> = {}) {
    return { ...mockMarket, ...overrides };
}

/**
 * Create mock user with custom properties
 */
export function createMockUser(overrides: Partial<typeof mockUser> = {}) {
    return { ...mockUser, ...overrides };
}

/**
 * Generate random wallet address
 */
export function randomAddress(): `0x${string}` {
    const chars = '0123456789abcdef';
    let address = '0x';
    for (let i = 0; i < 40; i++) {
        address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address as `0x${string}`;
}

/**
 * Generate random market ID
 */
export function randomMarketId(): `0x${string}` {
    const chars = '0123456789abcdef';
    let id = '0x';
    for (let i = 0; i < 64; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id as `0x${string}`;
}
