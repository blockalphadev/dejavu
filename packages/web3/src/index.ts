/**
 * @dejavu/web3
 * 
 * Web3 abstraction layer for the DeJaVu platform.
 * Provides chain-agnostic wallet connection and blockchain interactions.
 */

// Types
export * from './types';

// Adapters
export { evmAdapter, EvmAdapter } from './adapters/evm';
export { solanaAdapter, SolanaAdapter } from './adapters/solana';
export { suiAdapter, SuiAdapter } from './adapters/sui';

// Hooks
export { useWallet, useBalance, useSignMessage } from './hooks';

// Providers
export { Web3Provider, useWeb3 } from './providers';
