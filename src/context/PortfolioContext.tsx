import React, { createContext, useContext, useState, useEffect } from 'react';
import { useHederaWallet } from '../hooks/useHederaWallet';

export interface ActivePosition {
  vaultId: string;
  tokenAAmount: number;
  tokenBAmount: number;
  baseApr: number; // For APY calculation
  depositTimestamp: number;
}

interface PortfolioState {
  activePositions: ActivePosition[];
  totalPendingYield: number;
  deposit: (vaultId: string, tokenAAmount: number, tokenBAmount: number, baseApr: number) => void;
  withdraw: (vaultId: string, percent: number) => void;
  setTotalPendingYield: (val: number | ((prev: number) => number)) => void;
  stakedRheo: number;
  setStakedRheo: React.Dispatch<React.SetStateAction<number>>;
  claimableDividends: number;
  setClaimableDividends: React.Dispatch<React.SetStateAction<number>>;
}

const PortfolioContext = createContext<PortfolioState | undefined>(undefined);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useHederaWallet();

  const [activePositions, setActivePositions] = useState<ActivePosition[]>([]);
  const [totalPendingYield, setTotalPendingYield] = useState(0);
  const [stakedRheo, setStakedRheo] = useState(0);
  const [claimableDividends, setClaimableDividends] = useState(0);

  // Load from localStorage when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      const saved = localStorage.getItem(`rheo_portfolio_${address}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setActivePositions(parsed.activePositions || []);
          setTotalPendingYield(parsed.totalPendingYield || 0);
          setStakedRheo(parsed.stakedRheo || 0);
          setClaimableDividends(parsed.claimableDividends || 0);
        } catch (e) {
          console.warn('Failed to parse portfolio data');
        }
      } else {
        // Reset to default
        setActivePositions([]);
        setTotalPendingYield(0);
        setStakedRheo(0);
        setClaimableDividends(0);
      }
    } else {
      // Disconnected state
      setActivePositions([]);
      setTotalPendingYield(0);
      setStakedRheo(0);
      setClaimableDividends(0);
    }
  }, [isConnected, address]);

  // Silent save to localStorage
  useEffect(() => {
    if (isConnected && address) {
      localStorage.setItem(`rheo_portfolio_${address}`, JSON.stringify({
        activePositions,
        totalPendingYield,
        stakedRheo,
        claimableDividends
      }));
    }
  }, [isConnected, address, activePositions, totalPendingYield, stakedRheo, claimableDividends]);

  const deposit = (vaultId: string, tokenAAmount: number, tokenBAmount: number, baseApr: number) => {
    setActivePositions(prev => {
      const existing = prev.find(p => p.vaultId === vaultId);
      if (existing) {
        return prev.map(p => 
          p.vaultId === vaultId 
            ? { 
                ...p, 
                tokenAAmount: p.tokenAAmount + tokenAAmount, 
                tokenBAmount: p.tokenBAmount + tokenBAmount,
                baseApr: baseApr 
              } 
            : p
        );
      }
      return [...prev, { vaultId, tokenAAmount, tokenBAmount, baseApr, depositTimestamp: Date.now() }];
    });
  };

  const withdraw = (vaultId: string, percent: number) => {
    setActivePositions(prev => {
      return prev.map(p => {
        if (p.vaultId === vaultId) {
          return {
            ...p,
            tokenAAmount: Math.max(0, p.tokenAAmount * (1 - percent)),
            tokenBAmount: Math.max(0, p.tokenBAmount * (1 - percent)),
          };
        }
        return p;
      }).filter(p => p.tokenAAmount > 0.0001 || p.tokenBAmount > 0.0001);
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isConnected) return;
      
      setActivePositions(positions => {
        let currentYield = 0;
        positions.forEach(pos => {
          const msElapsed = Date.now() - pos.depositTimestamp;
          const hoursElapsed = msElapsed / (1000 * 60 * 60);
          
          // Simplified USD mock valuation: token amounts * generic weight
          const principalUsd = (pos.tokenAAmount + pos.tokenBAmount) * 0.5;

          const r = pos.baseApr / 100;
          const n = 8760; // Hourly compounding
          const tYears = hoursElapsed / 8760;

          // Plus a micro flat increment per second so it's always moving visibly for the demo
          const accrued = principalUsd * Math.pow(1 + r/n, n * tYears) - principalUsd + (msElapsed / 1000) * 0.0000014;
          currentYield += accrued;
        });

        setTotalPendingYield(currentYield);
        return positions;
      });

      setStakedRheo(staked => {
        if (staked > 0) {
          const yieldPerSec = staked * (0.154 / 31536000) + staked * 0.00000005; // 15.4% APR + visual bump
          setClaimableDividends(prev => prev + yieldPerSec);
        }
        return staked;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  return (
    <PortfolioContext.Provider value={{
      activePositions,
      totalPendingYield,
      deposit,
      withdraw,
      setTotalPendingYield,
      stakedRheo,
      setStakedRheo,
      claimableDividends,
      setClaimableDividends
    }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}

