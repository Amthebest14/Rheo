import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useHederaWallet } from '../hooks/useHederaWallet';

export interface TransactionRecord {
  id: string;
  type: 'deposit' | 'withdraw' | 'compound';
  vaultId: string;
  amounts: Array<{ asset: string; quantity: number }>;
  timestamp: number;
  status: 'success' | 'pending' | 'failed';
  hash: string;
}

interface TransactionContextState {
  transactions: TransactionRecord[];
  addTransaction: (tx: TransactionRecord) => void;
}

const TransactionContext = createContext<TransactionContextState | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useHederaWallet();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  // Load from localStorage when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      const saved = localStorage.getItem(`rheo_transactions_${address}`);
      if (saved) {
        try {
          setTransactions(JSON.parse(saved));
        } catch (e) {
          setTransactions([]);
        }
      } else {
        setTransactions([]);
      }
    } else {
      setTransactions([]);
    }
  }, [isConnected, address]);

  // Silent save to localStorage
  useEffect(() => {
    if (isConnected && address) {
      localStorage.setItem(`rheo_transactions_${address}`, JSON.stringify(transactions));
    }
  }, [isConnected, address, transactions]);

  const addTransaction = useCallback((tx: TransactionRecord) => {
    setTransactions(prev => [tx, ...prev]);
  }, []);

  return (
    <TransactionContext.Provider value={{ transactions, addTransaction }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}

