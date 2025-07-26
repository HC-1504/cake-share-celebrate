import { createConfig, WagmiProvider, http } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { walletConnect } from '@wagmi/connectors'
import React from 'react'
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { holesky } from 'wagmi/chains'
import { createPublicClient } from 'viem'

const projectId = '3b4a24e3058f5f15083dfbfe0164912f'

const metadata = {
    name: 'Cake Share Celebrate',
    description: 'Blockchain event registration',
    url: 'https://example.com',
    icons: ['https://walletconnect.com/walletconnect-logo.png']
}

const chains = [holesky] as const

const publicClient = createPublicClient({
    chain: holesky,
    transport: http()
})

const wagmiConfig = createConfig({
    chains,
    transports: {
        [holesky.id]: http()
    },
    connectors: [
        injected(),
        walletConnect({ projectId })
    ]
})

createWeb3Modal({
    wagmiConfig,
    projectId,
    themeMode: 'light'
})

export { wagmiConfig, publicClient }

export const Web3ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <WagmiProvider config={wagmiConfig}>
            {children}
        </WagmiProvider>
    )
}
