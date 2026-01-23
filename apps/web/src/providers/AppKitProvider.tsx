
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { type AppKitNetwork, mainnet, arbitrum, base, polygon, optimism } from '@reown/appkit/networks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { ReactNode } from 'react'

const queryClient = new QueryClient()

// Get projectId from .env
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

// Metadata
const metadata = {
    name: 'DeJaVu',
    description: 'DeJaVu Decentralized Prediction Market',
    url: 'https://dejavubuild.netlify.app',
    icons: ['https://assets.reown.com/reown-profile-pic.png']
}

// Networks
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, arbitrum, base, polygon, optimism]

// Create Adapter
export const wagmiAdapter = new WagmiAdapter({
    networks,
    projectId,
    ssr: true
});

// Initialize AppKit
createAppKit({
    adapters: [wagmiAdapter],
    networks,
    projectId,
    metadata,
    features: {
        analytics: true,
        email: true, // Enable Email Login
        socials: ['google', 'x', 'github', 'discord', 'apple', 'facebook'], // Enable Social Logins
    },
    themeMode: 'dark',
    themeVariables: {
        '--w3m-accent': '#8b5cf6', // Violet accent
        '--w3m-border-radius-master': '1px'
    }
})

export function AppKitProvider({ children }: { children: ReactNode }) {
    return (
        <WagmiProvider config={wagmiAdapter.wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiProvider>
    )
}
