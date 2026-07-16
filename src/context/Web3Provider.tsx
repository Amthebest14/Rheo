import React from 'react'
import { createAppKit } from '@reown/appkit/react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { type Chain } from 'viem'

// 1. Get projectId from env
const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || 'test_project_id_123';

// 2. Define custom Hedera Testnet chain explicitly as required
export const hederaTestnetChain: Chain = {
  id: 296,
  name: 'Hedera Testnet',
  nativeCurrency: { name: 'HBAR', symbol: 'HBAR', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet.hashio.io/api'] },
  },
  blockExplorers: {
    default: { name: 'HashScan', url: 'https://hashscan.io/testnet' },
  },
}

// 3. Create Wagmi Adapter
const networks = [hederaTestnetChain] as any;
const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
})

// 4. Create AppKit instance with Rheo Finance branding
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: 'Rheo Finance',
    description: 'Continuous Yield. Automated Execution.',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://rheo.finance',
    icons: ['https://avatars.githubusercontent.com/u/179238217'] // Rheo Finance logo placeholder
  },
  features: {
    analytics: true
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#00D1A1', // Pulse Cyan
    '--w3m-border-radius-master': '12px'
  }
})

// 5. Initialize TanStack Query Client
const queryClient = new QueryClient()

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
