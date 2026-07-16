import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useHederaWallet } from '../hooks/useHederaWallet';

interface PointsState {
  userPoints: number;
  awardPoints: (amount: number, reason: string) => void;
}

const PointsContext = createContext<PointsState | undefined>(undefined);

export function PointsProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useHederaWallet();
  const [userPoints, setUserPoints] = useState(0);

  // Load from localStorage when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      const saved = localStorage.getItem(`rheo_points_${address}`);
      if (saved) {
        setUserPoints(parseInt(saved, 10) || 0);
      } else {
        setUserPoints(0);
      }
    } else {
      setUserPoints(0);
    }
  }, [isConnected, address]);

  // Silent save to localStorage
  useEffect(() => {
    if (isConnected && address) {
      localStorage.setItem(`rheo_points_${address}`, userPoints.toString());
    }
  }, [isConnected, address, userPoints]);

  const awardPoints = useCallback((amount: number, reason: string) => {
    setUserPoints(prev => prev + amount);
    toast.custom((t) => (
      <div className="flex flex-col gap-2 p-4 rounded-xl border border-yellow-500/40 bg-[#050A14]/95 backdrop-blur-md shadow-[0_0_15px_rgba(234,179,8,0.2)]">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 font-bold text-sm">🏆 +{amount} Points: {reason}</span>
        </div>
        <button 
          onClick={() => toast.dismiss(t)} 
          className="text-xs font-semibold text-slate-muted hover:text-white mt-1 self-start transition-colors"
        >
          Dismiss
        </button>
      </div>
    ));
  }, []);

  return (
    <PointsContext.Provider value={{ userPoints, awardPoints }}>
      {children}
    </PointsContext.Provider>
  );
}

export function usePoints() {
  const context = useContext(PointsContext);
  if (context === undefined) {
    throw new Error('usePoints must be used within a PointsProvider');
  }
  return context;
}

