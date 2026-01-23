# DeJaVu Web Application

Frontend React application untuk platform DeJaVu prediction market.

## Development

```bash
# Dari root directory
pnpm dev --filter=@dejavu/web

# Atau dari direktori ini
pnpm dev
```

## Build

```bash
pnpm build
```

## Structure

```
src/
├── app/
│   ├── components/          # React components
│   │   ├── auth/            # Authentication components
│   │   ├── ui/              # UI primitives
│   │   └── ...              # Feature components
│   ├── hooks/               # Custom React hooks
│   └── utils/               # Utility functions
├── services/                # API services
├── styles/                  # CSS styles
└── main.tsx                 # Entry point
```

## Environment Variables

Create `.env` file in the root of this directory:

```env
# Sui Network Configuration (optional, defaults to mainnet)
# Options: mainnet, testnet, devnet
VITE_SUI_NETWORK=mainnet

# API URL (if different from default)
VITE_API_URL=http://localhost:3001/api/v1
```

## Dependencies

- `@dejavu/core` - Shared types dan utilities
- `@dejavu/ui` - Design system components
- `@dejavu/web3` - Web3 wallet integration
