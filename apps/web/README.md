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

## Dependencies

- `@dejavu/core` - Shared types dan utilities
- `@dejavu/ui` - Design system components
- `@dejavu/web3` - Web3 wallet integration
