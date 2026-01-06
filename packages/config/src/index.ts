/**
 * @dejavu/config
 * 
 * Centralized configuration for the DeJaVu platform.
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
