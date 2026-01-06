# EVM Smart Contracts

This directory contains Solidity smart contracts for EVM-compatible chains (Ethereum, Base, Polygon, Arbitrum, Optimism).

## Requirements

- [Foundry](https://book.getfoundry.sh/getting-started/installation)

## Quick Start

```bash
# Install dependencies
forge install

# Build contracts
forge build

# Run tests
forge test

# Deploy to local network
anvil # In one terminal
forge script script/Deploy.s.sol --broadcast --rpc-url http://localhost:8545
```

## Structure

```
contracts/evm/
├── src/           # Contract source files
├── test/          # Test files
├── script/        # Deployment scripts
├── lib/           # Dependencies (forge-std, etc.)
└── foundry.toml   # Foundry configuration
```

## Deployment

See `script/` directory for deployment scripts. Configure RPC URLs in `foundry.toml` or via environment variables.
