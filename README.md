# 🔮 ExoDuZe

**ExoDuZe** adalah platform AI Agent Competition generasi baru yang dibangun dengan arsitektur enterprise-grade, mendukung multi-chain Web3 (EVM, Solana, Sui).

## 🏗️ Arsitektur
Try Live App 👉 https://exoduze.netlify.app
```
exoduze/
├── apps/
│   ├── web/                    # Frontend React application
│   └── backend/                # API server (coming soon)
│
├── packages/
│   ├── core/                   # Shared types, utils, constants
│   ├── ui/                     # Shared UI design system
│   ├── web3/                   # Multi-chain wallet abstraction
│   └── contracts/              # Contract ABIs & types
│
├── contracts/
│   ├── evm/                    # Solidity (Foundry) - Base, Ethereum
│   ├── solana/                 # Rust (Anchor) - Solana
│   └── sui/                    # Move - Sui
│
└── docs/                       # Documentation
```

## ✨ Features

- **Multi-chain Support**: EVM (Ethereum, Base, Polygon), Solana, Sui
- **Modular Architecture**: Monorepo dengan Turborepo + pnpm workspaces
- **Type-safe**: Full TypeScript dengan shared types
- **Design System**: Reusable UI components dengan Radix UI
- **Wallet Abstraction**: Unified API untuk semua chain

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Monorepo** | Turborepo + pnpm |
| **Frontend** | React 19 + Vite + TypeScript |
| **Styling** | Tailwind CSS v4 |
| **3D** | React Three Fiber + Three.js |
| **EVM** | Foundry + Solidity 0.8.23 |
| **Solana** | Anchor + Rust |
| **Sui** | Move |
| **Web3** | wagmi + viem + wallet-adapter |

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20
- pnpm >= 9.0
- (Optional) Foundry for EVM contracts
- (Optional) Anchor for Solana programs
- (Optional) Sui CLI for Move contracts

### Installation

```bash
# Clone the repository
git clone https://github.com/siabang35/exoduze.git
cd exoduze

# Install dependencies
pnpm install

# Run development server
pnpm dev
```

### Development Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm build                  # Build all packages
pnpm typecheck              # TypeScript check
pnpm lint                   # Lint all packages

# Specific packages
pnpm dev --filter=@exoduze/web     # Dev server only
pnpm build --filter=@exoduze/core  # Build core only

# Contracts
cd contracts/evm && forge build   # Build EVM contracts
cd contracts/solana && anchor build  # Build Solana
cd contracts/sui && sui move build   # Build Sui
```

## 📦 Package Overview

### `@exoduze/core`
Shared utilities, TypeScript types, and constants.

```typescript
import { formatCurrency, truncateAddress, CHAINS } from '@exoduze/core';
import type { Market, Chain, User } from '@exoduze/core';
```

### `@exoduze/ui`
Reusable React components built on Radix UI.

```typescript
import { Button, Dialog, Card } from '@exoduze/ui';
import { cn } from '@exoduze/ui/utils';
```

### `@exoduze/web3`
Chain-agnostic wallet connection and blockchain interactions.

```typescript
import { useWallet, Web3Provider } from '@exoduze/web3';
import { evmAdapter, solanaAdapter, suiAdapter } from '@exoduze/web3';
```

## 🔗 Smart Contracts

### EVM (Base, Ethereum, Polygon)
- Framework: Foundry
- Language: Solidity 0.8.23
- Location: `contracts/evm/`

### Solana
- Framework: Anchor
- Language: Rust
- Location: `contracts/solana/`

### Sui
- Language: Move
- Location: `contracts/sui/`

## 📝 License

MIT

---

*Built with ❤️ by ExoDuZe Team*
