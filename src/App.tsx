/**
 * App.tsx — Root Router
 * Establishes BrowserRouter with two strict top-level routes:
 *   /     → LandingPage (existing scrollable marketing site)
 *   /app  → DashboardTerminal (the Web3 dashboard engine)
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { PortfolioProvider } from './context/PortfolioContext'
import { HederaWalletProvider } from './hooks/useHederaWallet'
import { TransactionProvider } from './context/TransactionContext'
import { PointsProvider } from './context/PointsContext'
import { ProtocolProvider } from './context/ProtocolContext'
import { Web3Provider } from './context/Web3Provider'
import LandingPage        from './pages/LandingPage'
import DashboardTerminal  from './pages/DashboardTerminal'

export default function App() {
  return (
    <Web3Provider>
      <HederaWalletProvider>
        <TransactionProvider>
          <ProtocolProvider>
            <PortfolioProvider>
              <PointsProvider>
              <BrowserRouter>
              <Toaster theme="dark" position="bottom-right" />
              <Routes>
              {/* Marketing landing page */}
              <Route path="/" element={<LandingPage />} />
              
              {/* Internal Web3 Dashboard App */}
              <Route path="/app/*" element={<DashboardTerminal />} />
              
              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              </BrowserRouter>
              </PointsProvider>
            </PortfolioProvider>
          </ProtocolProvider>
        </TransactionProvider>
      </HederaWalletProvider>
    </Web3Provider>
  )
}
