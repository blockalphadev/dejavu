# DeJaVu - Project Guidelines & Architecture

> **Comprehensive documentation for developers and maintainers**  
> Last Updated: January 2026

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Repository Structure](#repository-structure)
3. [Architecture Overview](#architecture-overview)
4. [Frontend (apps/web)](#frontend-appsweb)
5. [Backend API (apps/api)](#backend-api-appsapi)
6. [Smart Contracts](#smart-contracts)
7. [Shared Packages](#shared-packages)
8. [Environment Configuration](#environment-configuration)
9. [Authentication Flow](#authentication-flow)
10. [Database Schema](#database-schema)
11. [Security Best Practices](#security-best-practices)
12. [Development Workflow](#development-workflow)
13. [Deployment Guide](#deployment-guide)
14. [Troubleshooting](#troubleshooting)

---

## Project Overview

**DeJaVu** is a decentralized prediction market platform supporting multiple blockchain networks (Ethereum, Solana, Sui, Base). The platform enables users to create and participate in prediction markets using cryptocurrency wallets or traditional authentication methods.

### Key Features
- 🔐 **Multi-Auth**: Email/password, Magic Link, Google OAuth, Wallet (MetaMask, Phantom)
- ⛓️ **Multi-Chain**: Ethereum, Solana, Sui, Base support
- 📊 **Prediction Markets**: Create and trade on market outcomes
- 🎨 **Modern UI**: React 19 with responsive design, light/dark themes
- 🔒 **Enterprise Security**: Rate limiting, brute force protection, audit logging

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, CSS Modules |
| Backend | NestJS 10, TypeScript, Express |
| Database | Supabase (PostgreSQL) with RLS |
| Authentication | Passport.js, JWT, Supabase Auth |
| Blockchain | ethers.js, @solana/web3.js, @mysten/sui.js |
| Smart Contracts | Solidity (Foundry), Anchor (Solana), Move (Sui) |

---

## Repository Structure

```
dejavu/
├── apps/                       # Application packages
│   ├── api/                    # NestJS Backend API
│   │   ├── src/
│   │   │   ├── common/         # Shared utilities (middleware, filters, interceptors)
│   │   │   ├── config/         # Environment validation
│   │   │   ├── database/       # Supabase service, migrations
│   │   │   └── modules/        # Feature modules (auth, users, dashboard)
│   │   ├── .env.template       # Environment variables template
│   │   └── package.json
│   │
│   └── web/                    # React Frontend
│       ├── src/
│       │   ├── app/            # Main application
│       │   │   ├── components/ # UI components
│       │   │   ├── hooks/      # Custom React hooks
│       │   │   └── utils/      # Helper functions
│       │   ├── services/       # API services
│       │   └── styles/         # Global styles, themes
│       ├── .env.template       # Frontend env template
│       └── package.json
│
├── contracts/                  # Smart contracts
│   ├── evm/                    # Ethereum/Base (Solidity + Foundry)
│   ├── solana/                 # Solana (Anchor)
│   └── sui/                    # Sui (Move)
│
├── packages/                   # Shared packages
│   ├── config/                 # Shared configuration
│   ├── contracts/              # Contract ABIs and types
│   ├── core/                   # Core utilities
│   ├── ui/                     # Shared UI components
│   └── web3/                   # Web3 adapters and hooks
│
├── guidelines/                 # Documentation (this file)
├── .env.example                # Root environment reference
├── package.json                # Root package.json
├── pnpm-workspace.yaml         # PNPM workspace config
├── tsconfig.base.json          # Base TypeScript config
└── turbo.json                  # Turborepo pipeline config
```

---

## Architecture Overview

```mermaid
graph TB
    subgraph Client["Frontend (React)"]
        UI[UI Components]
        Hooks[Custom Hooks]
        Services[API Services]
        Web3[Web3 Adapters]
    end

    subgraph Server["Backend (NestJS)"]
        Auth[Auth Module]
        Users[Users Module]
        Dashboard[Dashboard Module]
        Guards[JWT Guards]
    end

    subgraph Database["Supabase"]
        PG[(PostgreSQL)]
        AuthSvc[Supabase Auth]
        RLS[Row Level Security]
    end

    subgraph Blockchain["Smart Contracts"]
        EVM[Ethereum/Base]
        SOL[Solana]
        SUI[Sui]
    end

    UI --> Hooks
    Hooks --> Services
    Services --> Auth
    Web3 --> EVM
    Web3 --> SOL
    Web3 --> SUI
    Auth --> AuthSvc
    Auth --> PG
    Users --> PG
    Dashboard --> PG
    PG --> RLS
```
### Clean Architecture

![Clean Architecture](../apps/web/public/images/architecture/architectures.png)

### Design Principles

1. **Clean Architecture**: Separation of concerns with modular design
2. **Type Safety**: Full TypeScript coverage with strict mode
3. **Security First**: Defense in depth with multiple security layers
4. **Scalability**: Horizontal scaling ready with stateless backend
5. **Multi-Chain Native**: Abstracted wallet adapters for all chains

---

## Frontend (apps/web)

### Technology Stack
- **Framework**: React 19 with concurrent features
- **Build Tool**: Vite for fast HMR and builds
- **Styling**: CSS Modules + global theme system
- **State Management**: React hooks + context
- **Web3**: wagmi, @solana/wallet-adapter, @mysten/wallet-standard

### Directory Structure

```
apps/web/src/
├── app/
│   ├── App.tsx                 # Root component with routing
│   ├── components/
│   │   ├── auth/               # Authentication components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   └── WalletConnect.tsx
│   │   ├── dashboard/          # Dashboard components
│   │   ├── layout/             # Header, Footer, Navigation
│   │   ├── markets/            # Prediction market components
│   │   └── ui/                 # Base UI primitives
│   ├── hooks/
│   │   ├── useAuth.ts          # Authentication state
│   │   ├── useWallet.ts        # Wallet connection
│   │   └── useTheme.ts         # Theme management
│   └── utils/
│       └── helpers.ts
├── services/
│   ├── api.ts                  # Backend API client
│   └── polymarket.ts           # Market data service
└── styles/
    ├── globals.css             # Global styles
    ├── theme.css               # CSS variables for theming
    └── components.css          # Component-specific styles
```

### Component Guidelines

```tsx
// ✅ Good: Functional component with TypeScript
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ variant = 'primary', children, onClick }: ButtonProps) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
}

// ❌ Avoid: Class components, any types, inline styles
```

### Theme System

The app supports three theme modes: `light`, `dark`, and `system`.

```css
/* styles/theme.css */
:root {
  --bg-primary: #ffffff;
  --text-primary: #1a1a2e;
  --accent: #7c3aed;
}

[data-theme="dark"] {
  --bg-primary: #0a0a1a;
  --text-primary: #e2e8f0;
  --accent: #8b5cf6;
}
```

---

## Backend API (apps/api)

### Technology Stack
- **Framework**: NestJS 10 with modular architecture
- **Language**: TypeScript with strict mode
- **Database**: Supabase (PostgreSQL) via @supabase/supabase-js
- **Auth**: Passport.js with JWT + multiple strategies

### Module Structure

```
apps/api/src/
├── main.ts                     # Application bootstrap
├── app.module.ts               # Root module
├── common/                     # Shared utilities
│   ├── middleware/
│   │   └── logger.middleware.ts    # Request logging with data masking
│   ├── filters/
│   │   └── global-exception.filter.ts
│   └── interceptors/
│       └── audit-log.interceptor.ts
├── config/
│   └── env.validation.ts       # Zod schema for env vars
├── database/
│   ├── database.module.ts
│   ├── supabase.service.ts     # Supabase client provider
│   ├── types.ts                # Database types
│   └── migrations/
│       ├── 001_initial_schema.sql
│       └── 002_audit_and_sessions.sql
└── modules/
    ├── auth/
    │   ├── auth.module.ts
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   ├── dto/                # Data Transfer Objects
    │   ├── guards/             # JWT, Google guards
    │   ├── strategies/         # Passport strategies
    │   ├── decorators/         # @CurrentUser, @Public
    │   └── validators/         # Password strength
    ├── users/
    │   ├── users.module.ts
    │   └── users.service.ts
    └── dashboard/
        ├── dashboard.module.ts
        ├── dashboard.controller.ts
        └── dashboard.service.ts
```

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/signup` | Public | Register new user |
| POST | `/auth/login` | Public | Login with email/password |
| POST | `/auth/magic-link` | Public | Send magic link email |
| POST | `/auth/wallet/challenge` | Public | Get wallet signing challenge |
| POST | `/auth/wallet/verify` | Public | Verify wallet signature |
| GET | `/auth/google` | Public | Initiate Google OAuth |
| POST | `/auth/refresh` | Public | Refresh access token |
| POST | `/auth/logout` | JWT | Logout user |
| GET | `/auth/me` | JWT | Get current user |
| GET | `/dashboard` | JWT | Get dashboard data |
| GET | `/health` | Public | Health check |

### Creating a New Module

```bash
# Generate module scaffolding
cd apps/api
npx nest g module modules/markets
npx nest g controller modules/markets
npx nest g service modules/markets
```

```typescript
// modules/markets/markets.module.ts
import { Module } from '@nestjs/common';
import { MarketsController } from './markets.controller';
import { MarketsService } from './markets.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [MarketsController],
  providers: [MarketsService],
  exports: [MarketsService],
})
export class MarketsModule {}
```

---

## Smart Contracts

### EVM Contracts (Ethereum/Base)

Built with **Foundry** for testing and deployment.

```
contracts/evm/
├── src/
│   └── PredictionMarket.sol    # Main contract
├── test/                       # Forge tests
├── script/                     # Deployment scripts
├── foundry.toml                # Foundry config
└── package.json
```

**Development Commands:**
```bash
cd contracts/evm

# Build contracts
forge build

# Run tests
forge test

# Deploy (example for Sepolia)
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC --broadcast
```

### Solana Contracts

Built with **Anchor** framework.

```
contracts/solana/
├── programs/
│   └── prediction_market/
│       └── src/
│           └── lib.rs
├── tests/
├── Anchor.toml
└── Cargo.toml
```

**Development Commands:**
```bash
cd contracts/solana

# Build
anchor build

# Test
anchor test

# Deploy
anchor deploy
```

### Sui Contracts

Built with **Move** language.

```
contracts/sui/
├── sources/
│   └── prediction_market.move
├── tests/
└── Move.toml
```

---

## Shared Packages

### packages/web3

Multi-chain wallet adapter abstraction.

```typescript
// Example usage
import { useWallet } from '@dejavu/web3';

function ConnectButton() {
  const { connect, disconnect, address, chain, isConnected } = useWallet();
  
  return isConnected ? (
    <button onClick={disconnect}>
      {address?.slice(0, 6)}...{address?.slice(-4)}
    </button>
  ) : (
    <button onClick={() => connect('ethereum')}>Connect Wallet</button>
  );
}
```

**Supported Chains:**
- Ethereum (MetaMask, WalletConnect)
- Solana (Phantom, Solflare)
- Sui (Sui Wallet)
- Base (MetaMask)

### packages/ui

Shared UI components library.

```typescript
import { Button, Card, Modal, Input } from '@dejavu/ui';
```

### packages/core

Core utilities and types.

```typescript
import { formatAddress, formatCurrency, validateEmail } from '@dejavu/core';
```

---

## Environment Configuration

### Backend (apps/api/.env)

```bash
# Server
NODE_ENV=development
PORT=3001
API_PREFIX=api/v1

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres

# JWT (generate with: openssl rand -base64 48)
JWT_SECRET=your_jwt_secret_minimum_32_characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret_minimum_32_characters
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3001/api/v1/auth/google/callback

# Security
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
RATE_LIMIT_MAX=100
RATE_LIMIT_AUTH_MAX=5
LOCKOUT_THRESHOLD=5
LOCKOUT_DURATION_MINUTES=15

# Cookies
COOKIE_DOMAIN=localhost
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax

# Logging
LOG_LEVEL=debug
ENABLE_AUDIT_LOG=true
```

### Frontend (apps/web/.env)

```bash
# API
VITE_API_URL=http://localhost:3001/api/v1

# Supabase (public keys only!)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Feature Flags
VITE_ENABLE_WALLET_AUTH=true
VITE_ENABLE_GOOGLE_AUTH=true
VITE_ENABLE_EMAIL_AUTH=true

# Wallet Config
VITE_SUPPORTED_CHAINS=ethereum,solana,sui,base
```

---

## Authentication Flow

### Email/Password Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Supabase

    User->>Frontend: Enter email/password
    Frontend->>Backend: POST /auth/signup
    Backend->>Backend: Validate password strength
    Backend->>Supabase: Create user
    Supabase-->>Backend: User created
    Backend->>Backend: Generate JWT tokens
    Backend-->>Frontend: { user, tokens }
    Frontend->>Frontend: Store access token
    Frontend-->>User: Redirect to dashboard
```

### Wallet Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Wallet
    participant Backend
    participant Supabase

    User->>Frontend: Click "Connect Wallet"
    Frontend->>Wallet: Request accounts
    Wallet-->>Frontend: Return address
    Frontend->>Backend: POST /auth/wallet/challenge
    Backend-->>Frontend: { message, nonce }
    Frontend->>Wallet: Sign message
    Wallet-->>Frontend: Signature
    Frontend->>Backend: POST /auth/wallet/verify
    Backend->>Backend: Verify signature (EVM/Solana/Sui)
    Backend->>Supabase: Find or create user
    Backend-->>Frontend: { user, tokens }
```

---

## Database Schema

### Core Tables

```sql
-- User Profiles
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    wallet_addresses JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet Addresses
CREATE TABLE public.wallet_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    address TEXT NOT NULL,
    chain TEXT CHECK (chain IN ('ethereum', 'solana', 'sui', 'base')),
    is_primary BOOLEAN DEFAULT false,
    UNIQUE(address, chain)
);

-- Login Attempts (for brute force protection)
CREATE TABLE public.login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT,
    wallet_address TEXT,
    ip_address INET,
    success BOOLEAN,
    failure_reason TEXT,
    attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT,
    resource TEXT,
    ip_address INET,
    success BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS)

All tables have RLS enabled with policies:

```sql
-- Users can only read their own profile
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Service role bypasses RLS for admin operations
CREATE POLICY "Service role can manage all"
    ON public.profiles FOR ALL
    USING (auth.role() = 'service_role');
```

---

## Security Best Practices

### Backend Security

1. **Input Validation**: All DTOs use class-validator decorators
2. **Rate Limiting**: 100 req/min general, 5 req/min for auth
3. **Brute Force Protection**: Account lockout after 5 failed attempts
4. **Sensitive Data Masking**: Passwords/tokens redacted in logs
5. **CORS**: Strict origin whitelist
6. **Helmet**: Security headers configured
7. **HTTPS Only**: Secure cookies in production

### Frontend Security

1. **No secrets in client code**: Only public keys
2. **XSS Prevention**: React auto-escapes, no dangerouslySetInnerHTML
3. **CSRF Protection**: SameSite cookies
4. **Token Storage**: Access tokens in memory, refresh in HTTP-only cookie

### Production Checklist

- [ ] `NODE_ENV=production`
- [ ] `COOKIE_SECURE=true`
- [ ] `COOKIE_SAME_SITE=strict`
- [ ] Strong, unique JWT secrets (256-bit)
- [ ] Database connection uses SSL
- [ ] CORS only allows production domains
- [ ] Rate limiting configured appropriately
- [ ] Logging level set to `info` or `warn`

---

## Development Workflow

### Prerequisites

- Node.js 20+
- PNPM 8+
- Git

### Initial Setup

```bash
# Clone repository
git clone https://github.com/your-org/dejavu.git
cd dejavu

# Install dependencies
pnpm install

# Copy environment templates
cp apps/api/.env.template apps/api/.env
cp apps/web/.env.template apps/web/.env

# Configure your credentials in .env files

# Run database migrations in Supabase SQL Editor
```

### Development Commands

```bash
# Start all apps in development mode
pnpm dev

# Start only backend
pnpm --filter @dejavu/api dev

# Start only frontend
pnpm --filter @dejavu/web dev

# Type check all packages
pnpm typecheck

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint
```

### Git Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit with conventional commits
3. Push and create Pull Request
4. After review, merge to `main`

**Commit Messages:**
```
feat(auth): add wallet authentication
fix(ui): correct mobile navigation
docs: update API documentation
refactor(api): improve error handling
```

---

## Deployment Guide

### Backend Deployment

**Recommended Platforms:** Railway, Render, Fly.io, AWS ECS

```bash
# Build production
cd apps/api
npm run build

# Start production server
NODE_ENV=production npm start
```

### Frontend Deployment

**Recommended Platforms:** Vercel, Netlify, Cloudflare Pages

```bash
# Build production
cd apps/web
npm run build

# Output in dist/ directory
```

### Environment Variables Checklist

| Variable | Required | Secret |
|----------|----------|--------|
| `SUPABASE_URL` | ✅ | ❌ |
| `SUPABASE_ANON_KEY` | ✅ | ❌ |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ |
| `DATABASE_URL` | ✅ | ✅ |
| `JWT_SECRET` | ✅ | ✅ |
| `JWT_REFRESH_SECRET` | ✅ | ✅ |
| `GOOGLE_CLIENT_SECRET` | ⚪ | ✅ |
| `PRIVY_APP_ID` | ✅ | ❌ |
| `PRIVY_APP_SECRET` | ✅ | ✅ |

---

## Privy Integration

DeJaVu uses [Privy](https://privy.io) for embedded wallet creation.

### Backend Configuration

```bash
# apps/api/.env
PRIVY_APP_ID=cmk2rk1w400bqju0c8tvu4fq4
PRIVY_APP_SECRET=your_secret_here
```

### Privy Service (`apps/api/src/modules/deposits/services/privy.service.ts`)

| Method | Description |
|--------|-------------|
| `verifyToken(token)` | Verify Privy JWT via JWKS |
| `getOrCreateWallet(userId, chain)` | Get or create embedded wallet |
| `getEmbeddedWallets(userId)` | Get all user wallets |

### Frontend Integration

```typescript
import { usePrivy } from '@privy-io/react-auth';

const { user, authenticated, getAccessToken } = usePrivy();
const privyUserId = user?.id; // "did:privy:xxx"
```

---

## Deposits Module

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/deposits/balance` | JWT | Get user balance |
| POST | `/deposits/wallet/generate` | JWT | Generate Privy wallet |
| GET | `/deposits/wallet/:chain` | JWT | Get wallet for chain |
| POST | `/deposits/initiate` | JWT | Initiate deposit |
| POST | `/deposits/verify` | JWT | Verify transaction |
| GET | `/deposits/history` | JWT | Get deposit history |

### Wallet Generation Flow

1. Frontend calls `POST /deposits/wallet/generate` with `{ chain, privyUserId }`
2. Backend calls Privy API to create embedded wallet
3. Wallet address stored in `privy_wallets` table
4. Address returned to frontend for deposit

### Database Tables

Located in `apps/api/supabase/migrations/`:

| Migration | Tables |
|-----------|--------|
| `000_foundation.sql` | profiles, wallet_addresses, login_attempts, audit_logs |
| `001_initial_schema.sql` | markets, positions, orders, liquidity_positions |
| `002_deposits.sql` | user_balances, privy_wallets, deposit_transactions |

---

## Troubleshooting

### Common Issues

**Build fails with SWC error:**
```bash
npm install --save-dev @swc/cli @swc/core
```

**Supabase connection fails:**
- Verify `SUPABASE_URL` is correct (no trailing slash)
- Check service role key has correct permissions
- Ensure database migrations are run

**Wallet connection fails:**
- Verify wallet extension is installed
- Check browser console for errors
- Ensure correct chain is selected in wallet

**JWT validation fails:**
- Check JWT_SECRET is at least 32 characters
- Verify token hasn't expired
- Ensure secrets match between token generation and validation

**Privy wallet creation fails:**
- Verify `PRIVY_APP_SECRET` is configured
- Check Privy dashboard for app settings
- Ensure user has valid Privy session

### Support

- **Documentation**: Check this file and `/docs` folder
- **Issues**: Create GitHub issue with reproduction steps
- **Emergency**: Contact lead developer

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | Jan 2026 | Added Privy integration, deposit system, comprehensive migrations |
| 1.0.0 | Jan 2026 | Initial release with multi-auth and multi-chain support |

---

*This document should be updated whenever significant architectural changes are made.*

