/**
 * Prediction Market ABI
 * 
 * EVM-compatible contract ABI for the DeJaVu Prediction Market.
 * Supports Ethereum, Base, Arbitrum, and other EVM chains.
 */
export const PredictionMarketABI = [
    // ==================
    // View Functions
    // ==================
    {
        type: 'function',
        name: 'getMarket',
        inputs: [{ name: 'marketId', type: 'bytes32' }],
        outputs: [
            {
                name: 'market',
                type: 'tuple',
                components: [
                    { name: 'id', type: 'bytes32' },
                    { name: 'creator', type: 'address' },
                    { name: 'title', type: 'string' },
                    { name: 'description', type: 'string' },
                    { name: 'endTime', type: 'uint256' },
                    { name: 'resolutionTime', type: 'uint256' },
                    { name: 'totalYesShares', type: 'uint256' },
                    { name: 'totalNoShares', type: 'uint256' },
                    { name: 'resolved', type: 'bool' },
                    { name: 'outcome', type: 'bool' },
                    { name: 'collateralToken', type: 'address' },
                ],
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'getPosition',
        inputs: [
            { name: 'marketId', type: 'bytes32' },
            { name: 'user', type: 'address' },
        ],
        outputs: [
            { name: 'yesShares', type: 'uint256' },
            { name: 'noShares', type: 'uint256' },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'getPrice',
        inputs: [
            { name: 'marketId', type: 'bytes32' },
            { name: 'isYes', type: 'bool' },
        ],
        outputs: [{ name: 'price', type: 'uint256' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'getLiquidity',
        inputs: [{ name: 'marketId', type: 'bytes32' }],
        outputs: [{ name: 'liquidity', type: 'uint256' }],
        stateMutability: 'view',
    },

    // ==================
    // State-Changing Functions
    // ==================
    {
        type: 'function',
        name: 'createMarket',
        inputs: [
            { name: 'title', type: 'string' },
            { name: 'description', type: 'string' },
            { name: 'endTime', type: 'uint256' },
            { name: 'collateralToken', type: 'address' },
            { name: 'initialLiquidity', type: 'uint256' },
        ],
        outputs: [{ name: 'marketId', type: 'bytes32' }],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'buyShares',
        inputs: [
            { name: 'marketId', type: 'bytes32' },
            { name: 'isYes', type: 'bool' },
            { name: 'amount', type: 'uint256' },
            { name: 'maxCost', type: 'uint256' },
        ],
        outputs: [{ name: 'sharesBought', type: 'uint256' }],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'sellShares',
        inputs: [
            { name: 'marketId', type: 'bytes32' },
            { name: 'isYes', type: 'bool' },
            { name: 'amount', type: 'uint256' },
            { name: 'minReturn', type: 'uint256' },
        ],
        outputs: [{ name: 'collateralReceived', type: 'uint256' }],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'addLiquidity',
        inputs: [
            { name: 'marketId', type: 'bytes32' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: 'lpTokens', type: 'uint256' }],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'removeLiquidity',
        inputs: [
            { name: 'marketId', type: 'bytes32' },
            { name: 'lpTokens', type: 'uint256' },
        ],
        outputs: [{ name: 'collateralReturned', type: 'uint256' }],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'resolveMarket',
        inputs: [
            { name: 'marketId', type: 'bytes32' },
            { name: 'outcome', type: 'bool' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'claimWinnings',
        inputs: [{ name: 'marketId', type: 'bytes32' }],
        outputs: [{ name: 'amount', type: 'uint256' }],
        stateMutability: 'nonpayable',
    },

    // ==================
    // Events
    // ==================
    {
        type: 'event',
        name: 'MarketCreated',
        inputs: [
            { name: 'marketId', type: 'bytes32', indexed: true },
            { name: 'creator', type: 'address', indexed: true },
            { name: 'title', type: 'string', indexed: false },
            { name: 'endTime', type: 'uint256', indexed: false },
        ],
    },
    {
        type: 'event',
        name: 'SharesPurchased',
        inputs: [
            { name: 'marketId', type: 'bytes32', indexed: true },
            { name: 'buyer', type: 'address', indexed: true },
            { name: 'isYes', type: 'bool', indexed: false },
            { name: 'shares', type: 'uint256', indexed: false },
            { name: 'cost', type: 'uint256', indexed: false },
        ],
    },
    {
        type: 'event',
        name: 'SharesSold',
        inputs: [
            { name: 'marketId', type: 'bytes32', indexed: true },
            { name: 'seller', type: 'address', indexed: true },
            { name: 'isYes', type: 'bool', indexed: false },
            { name: 'shares', type: 'uint256', indexed: false },
            { name: 'returned', type: 'uint256', indexed: false },
        ],
    },
    {
        type: 'event',
        name: 'MarketResolved',
        inputs: [
            { name: 'marketId', type: 'bytes32', indexed: true },
            { name: 'outcome', type: 'bool', indexed: false },
            { name: 'resolver', type: 'address', indexed: true },
        ],
    },
    {
        type: 'event',
        name: 'WinningsClaimed',
        inputs: [
            { name: 'marketId', type: 'bytes32', indexed: true },
            { name: 'user', type: 'address', indexed: true },
            { name: 'amount', type: 'uint256', indexed: false },
        ],
    },
    {
        type: 'event',
        name: 'LiquidityAdded',
        inputs: [
            { name: 'marketId', type: 'bytes32', indexed: true },
            { name: 'provider', type: 'address', indexed: true },
            { name: 'amount', type: 'uint256', indexed: false },
            { name: 'lpTokens', type: 'uint256', indexed: false },
        ],
    },
    {
        type: 'event',
        name: 'LiquidityRemoved',
        inputs: [
            { name: 'marketId', type: 'bytes32', indexed: true },
            { name: 'provider', type: 'address', indexed: true },
            { name: 'lpTokens', type: 'uint256', indexed: false },
            { name: 'returned', type: 'uint256', indexed: false },
        ],
    },
] as const;

/**
 * ERC20 ABI (minimal for collateral tokens)
 */
export const ERC20ABI = [
    {
        type: 'function',
        name: 'approve',
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'allowance',
        inputs: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'balanceOf',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'transfer',
        inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'decimals',
        inputs: [],
        outputs: [{ name: '', type: 'uint8' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'symbol',
        inputs: [],
        outputs: [{ name: '', type: 'string' }],
        stateMutability: 'view',
    },
] as const;
