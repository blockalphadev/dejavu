/**
 * Feature Flags Configuration
 * 
 * Centralized feature flag management for controlled rollouts
 * and A/B testing across environments.
 */

import { z } from 'zod';

/**
 * Environment types
 */
export type Environment = 'development' | 'staging' | 'production';

/**
 * Feature flag definitions
 */
export interface FeatureFlag {
    name: string;
    description: string;
    defaultValue: boolean;
    environments: Partial<Record<Environment, boolean>>;
}

/**
 * Feature flags registry
 */
export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
    // ==================
    // Authentication Features
    // ==================
    ENABLE_WALLET_AUTH: {
        name: 'Wallet Authentication',
        description: 'Enable wallet-based authentication (MetaMask, Phantom, etc.)',
        defaultValue: true,
        environments: {
            development: true,
            staging: true,
            production: true,
        },
    },
    ENABLE_GOOGLE_AUTH: {
        name: 'Google OAuth',
        description: 'Enable Google OAuth authentication',
        defaultValue: true,
        environments: {
            development: true,
            staging: true,
            production: true,
        },
    },
    ENABLE_MAGIC_LINK: {
        name: 'Magic Link Login',
        description: 'Enable passwordless magic link authentication',
        defaultValue: true,
        environments: {
            development: true,
            staging: true,
            production: false, // Disable until email service is ready
        },
    },

    // ==================
    // Market Features
    // ==================
    ENABLE_MARKET_CREATION: {
        name: 'Market Creation',
        description: 'Allow users to create new prediction markets',
        defaultValue: false,
        environments: {
            development: true,
            staging: true,
            production: false, // Admin-only for now
        },
    },
    ENABLE_LIQUIDITY_PROVISION: {
        name: 'Liquidity Provision',
        description: 'Allow users to provide liquidity to markets',
        defaultValue: false,
        environments: {
            development: true,
            staging: true,
            production: false,
        },
    },
    ENABLE_MARKET_RESOLUTION: {
        name: 'Market Resolution',
        description: 'Enable market resolution and settlement',
        defaultValue: false,
        environments: {
            development: true,
            staging: false,
            production: false,
        },
    },

    // ==================
    // Chain Features
    // ==================
    ENABLE_SOLANA: {
        name: 'Solana Support',
        description: 'Enable Solana blockchain support',
        defaultValue: false,
        environments: {
            development: true,
            staging: false,
            production: false,
        },
    },
    ENABLE_SUI: {
        name: 'Sui Support',
        description: 'Enable Sui blockchain support',
        defaultValue: false,
        environments: {
            development: true,
            staging: false,
            production: false,
        },
    },
    ENABLE_TESTNET_CHAINS: {
        name: 'Testnet Chains',
        description: 'Show testnet chains in chain selector',
        defaultValue: true,
        environments: {
            development: true,
            staging: true,
            production: false,
        },
    },

    // ==================
    // UI Features
    // ==================
    ENABLE_DARK_MODE: {
        name: 'Dark Mode',
        description: 'Enable dark mode theme',
        defaultValue: true,
        environments: {
            development: true,
            staging: true,
            production: true,
        },
    },
    ENABLE_ANALYTICS: {
        name: 'Analytics',
        description: 'Enable analytics tracking',
        defaultValue: false,
        environments: {
            development: false,
            staging: true,
            production: true,
        },
    },
    ENABLE_PRICE_CHARTS: {
        name: 'Price Charts',
        description: 'Enable price history charts on markets',
        defaultValue: true,
        environments: {
            development: true,
            staging: true,
            production: true,
        },
    },

    // ==================
    // API Features
    // ==================
    ENABLE_RATE_LIMITING: {
        name: 'Rate Limiting',
        description: 'Enable API rate limiting',
        defaultValue: true,
        environments: {
            development: false, // Disable for testing
            staging: true,
            production: true,
        },
    },
    ENABLE_AUDIT_LOGGING: {
        name: 'Audit Logging',
        description: 'Enable security audit logging',
        defaultValue: true,
        environments: {
            development: true,
            staging: true,
            production: true,
        },
    },
};

/**
 * Get feature flag value for environment
 */
export function isFeatureEnabled(
    flagKey: keyof typeof FEATURE_FLAGS,
    environment: Environment = 'development',
): boolean {
    const flag = FEATURE_FLAGS[flagKey];
    if (!flag) {
        console.warn(`Unknown feature flag: ${flagKey}`);
        return false;
    }

    return flag.environments[environment] ?? flag.defaultValue;
}

/**
 * Get all enabled features for an environment
 */
export function getEnabledFeatures(environment: Environment): string[] {
    return Object.entries(FEATURE_FLAGS)
        .filter(([key]) => isFeatureEnabled(key as keyof typeof FEATURE_FLAGS, environment))
        .map(([key]) => key);
}

/**
 * Zod schema for validating feature flags from environment
 */
export const featureFlagsSchema = z.object({
    ENABLE_WALLET_AUTH: z.boolean().default(true),
    ENABLE_GOOGLE_AUTH: z.boolean().default(true),
    ENABLE_MAGIC_LINK: z.boolean().default(true),
    ENABLE_MARKET_CREATION: z.boolean().default(false),
    ENABLE_LIQUIDITY_PROVISION: z.boolean().default(false),
    ENABLE_SOLANA: z.boolean().default(false),
    ENABLE_SUI: z.boolean().default(false),
    ENABLE_TESTNET_CHAINS: z.boolean().default(true),
    ENABLE_DARK_MODE: z.boolean().default(true),
    ENABLE_ANALYTICS: z.boolean().default(false),
});

export type FeatureFlagsConfig = z.infer<typeof featureFlagsSchema>;
