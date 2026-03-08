/**
 * @exoduze/config
 * 
 * Centralized configuration for the ExoDuZe platform.
 * 
 * Provides:
 * - Chain configurations (EVM, Solana, Sui)
 * - Feature flags for controlled rollouts
 * - Environment validation schemas
 */

// Chains
export * from './chains/index.js';

// Features
export * from './features/index.js';
