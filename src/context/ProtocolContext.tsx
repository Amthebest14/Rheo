import React, { createContext, useContext, useState } from 'react';
import { VAULTS, VaultRow } from '../config/vaultData';

interface ProtocolState {
  vaults: VaultRow[];
  tokenPrices: Record<string, number>;
  isLive: boolean;
}

const ProtocolContext = createContext<ProtocolState | undefined>(undefined);

const HARDCODED_PRICES: Record<string, number> = {
  'HBAR': 0.08,
  'HBARX': 0.115,
  'SAUCE': 0.016,
  'USDC': 1.0,
  'DAI': 1.0
};

export function ProtocolProvider({ children }: { children: React.ReactNode }) {
  const [tokenPrices] = useState<Record<string, number>>(HARDCODED_PRICES);
  const [isLive] = useState(true);

  const [vaults] = useState<VaultRow[]>(() => {
    return VAULTS.map(vault => {
      let newRatio = vault.ratio;
      const priceA = HARDCODED_PRICES[vault.tokenA];
      const priceB = HARDCODED_PRICES[vault.tokenB];
      if (priceA && priceB && priceB > 0) {
        newRatio = priceA / priceB;
      }
      return {
        ...vault,
        ratio: newRatio,
      };
    });
  });

  return (
    <ProtocolContext.Provider value={{ vaults, tokenPrices, isLive }}>
      {children}
    </ProtocolContext.Provider>
  );
}

export function useProtocol() {
  const context = useContext(ProtocolContext);
  if (context === undefined) {
    throw new Error('useProtocol must be used within a ProtocolProvider');
  }
  return context;
}
