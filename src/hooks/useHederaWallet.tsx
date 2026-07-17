import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAccount, useBalance, useDisconnect, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { TOKEN_A_ADDRESS, TOKEN_B_ADDRESS, LP_TOKEN_ADDRESS, REWARD_TOKEN_ADDRESS, RHEO_TOKEN_ADDRESS, DAI_ADDRESS, HBARX_ADDRESS } from '../config/contracts';

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  }
] as const;

export type WalletProviderId = 'hashpack' | 'blade' | 'kabila' | 'walletconnect';

export interface TokenBalances {
  HBAR: number;
  WHBAR: number;
  USDC: number;
  SAUCE: number;
  USDT: number;
  RHEO: number;
  DAI: number;
  HBARX: number;
  [key: string]: number;
}

export interface HederaWalletState {
  address: string | null;
  balances: TokenBalances;
  isConnected: boolean;
  isConnecting: boolean;
}

interface HederaWalletContextValue extends HederaWalletState {
  hederaId: string | null;
  connect: (providerId: WalletProviderId) => Promise<void>;
  disconnect: () => void;
  deductBalance: (token: string, amount: number) => void;
  addBalance: (token: string, amount: number) => void;
  mintMockTokens: (tokenName: string, amount: number) => Promise<void>;
}

const HederaWalletContext = createContext<HederaWalletContextValue | undefined>(undefined);

export function HederaWalletProvider({ children }: { children: React.ReactNode }) {
  const { address: evmAddress, isConnected, isConnecting, connector } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();

  const address = evmAddress || null;
  const [hederaId, setHederaId] = useState<string | null>(null);

  // Wrap EIP-1193 provider to strictly format transactions for HashPack and Hedera Relay
  useEffect(() => {
    if (!connector) return;
    let active = true;
    
    const wrapProvider = async () => {
      try {
        const provider = await connector.getProvider() as any;
        if (provider && active && !provider._wrappedForWalletSendTransaction) {
          const originalRequest = provider.request;
          if (typeof originalRequest === 'function') {
            provider.request = async function (args: any) {
              // Normalize value for any method that sends HBAR to ensure it stays in tinybars hex format
              const normalizeValue = (val: any): string => {
                if (!val && val !== 0n) return '0x0';
                if (typeof val === 'string' && val.startsWith('0x')) return val;
                try { return `0x${BigInt(val).toString(16)}`; } catch { return '0x0'; }
              };

              if (args && (args.method === 'wallet_sendTransaction' || args.method === 'eth_sendTransaction')) {
                const request = args.params[0] || {};
                
                let gasPriceHex = request.gasPrice || request.maxFeePerGas;
                if (!gasPriceHex) {
                    try {
                        gasPriceHex = await originalRequest.call(provider, { method: 'eth_gasPrice', params: [] });
                    } catch (e) {
                        console.error('Failed to estimate gasPrice', e);
                    }
                }

                const ethTx = {
                  from: request.from,
                  to: request.to,
                  data: request.data,
                  value: normalizeValue(request.value),
                  gas: request.gas ? (typeof request.gas === 'string' && request.gas.startsWith('0x') ? request.gas : `0x${BigInt(request.gas).toString(16)}`) : undefined,
                  gasPrice: gasPriceHex ? (typeof gasPriceHex === 'string' && gasPriceHex.startsWith('0x') ? gasPriceHex : `0x${BigInt(gasPriceHex).toString(16)}`) : undefined,
                  // Force Legacy type — required by Hedera JSON-RPC relay
                  type: '0x0' 
                };
                
                return originalRequest.call(provider, { 
                  method: 'eth_sendTransaction', 
                  params: [ethTx] 
                });
              }

              // Also intercept eth_estimateGas to ensure value is a hex tinybar string (not WEI bigint)
              if (args && args.method === 'eth_estimateGas' && args.params?.[0]) {
                const req = args.params[0];
                const patchedParams = [{
                  ...req,
                  value: normalizeValue(req.value),
                }];
                return originalRequest.call(provider, { ...args, params: patchedParams });
              }

              return originalRequest.call(provider, args);
            };
            provider._wrappedForWalletSendTransaction = true;
            console.log('[useHederaWallet] Successfully wrapped provider to format strictly for Hedera');
          }
        }
      } catch (err) {
        console.error('[useHederaWallet] Failed to wrap provider:', err);
      }
    };
    
    wrapProvider();
    
    return () => {
      active = false;
    };
  }, [connector]);

  // 1. Fetch live native HBAR balance
  const { data: hbarBalanceData } = useBalance({ address: evmAddress });
  const liveHbarBalance = hbarBalanceData ? parseFloat(formatUnits(hbarBalanceData.value, hbarBalanceData.decimals)) : 0;

  // 2. Fetch live HTS USDC balance (6 decimals)
  const { data: usdcBalanceRaw } = useReadContract({
    address: TOKEN_B_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: evmAddress ? [evmAddress] : undefined,
    query: {
      enabled: !!evmAddress,
    }
  });
  const liveUsdcBalance = usdcBalanceRaw ? parseFloat(formatUnits(usdcBalanceRaw, 6)) : 0;

  // 3. Fetch live HTS SAUCE balance (8 decimals)
  const { data: sauceBalanceRaw } = useReadContract({
    address: REWARD_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: evmAddress ? [evmAddress] : undefined,
    query: {
      enabled: !!evmAddress,
    }
  });
  const liveSauceBalance = sauceBalanceRaw ? parseFloat(formatUnits(sauceBalanceRaw, 8)) : 0;

  // 4. Fetch live HTS RHEO balance (8 decimals)
  const { data: rheoBalanceRaw } = useReadContract({
    address: RHEO_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: evmAddress ? [evmAddress] : undefined,
    query: {
      enabled: !!evmAddress,
    }
  });
  const liveRheoBalance = rheoBalanceRaw ? parseFloat(formatUnits(rheoBalanceRaw, 8)) : 0;

  // 5. Fetch live WHBAR balance (8 decimals)
  const { data: whbarBalanceRaw } = useReadContract({
    address: TOKEN_A_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: evmAddress ? [evmAddress] : undefined,
    query: {
      enabled: !!evmAddress,
    }
  });
  const liveWhbarBalance = whbarBalanceRaw ? parseFloat(formatUnits(whbarBalanceRaw, 8)) : 0;

  // Fetch live DAI balance (6 decimals — matches the deployed DAI.sol)
  const { data: daiBalanceRaw } = useReadContract({
    address: DAI_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: evmAddress ? [evmAddress] : undefined,
    query: {
      enabled: !!evmAddress,
    }
  });
  const liveDaiBalance = daiBalanceRaw ? parseFloat(formatUnits(daiBalanceRaw, 6)) : 0;

  // Fetch live HBARX balance (8 decimals)
  const { data: hbarxBalanceRaw } = useReadContract({
    address: HBARX_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: evmAddress ? [evmAddress] : undefined,
    query: {
      enabled: !!evmAddress,
    }
  });
  const liveHbarxBalance = hbarxBalanceRaw ? parseFloat(formatUnits(hbarxBalanceRaw, 8)) : 0;

  // 6. Fetch live LP balance (8 decimals)
  const { data: lpBalanceRaw } = useReadContract({
    address: LP_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: evmAddress ? [evmAddress] : undefined,
    query: {
      enabled: !!evmAddress,
    }
  });
  const liveLpBalance = lpBalanceRaw ? parseFloat(formatUnits(lpBalanceRaw, 8)) : 0;

  // Resolve Hedera Account ID from Mirror Node when evmAddress changes
  useEffect(() => {
    if (!evmAddress) {
      setHederaId(null);
      return;
    }

    let isMounted = true;
    const resolveId = async () => {
      try {
        const response = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${evmAddress}`);
        if (!response.ok) throw new Error('Account lookup failed');
        const data = await response.json();
        if (isMounted && data.account) {
          setHederaId(data.account);
          console.log(`[useHederaWallet] Resolved native Hedera Account ID: ${data.account}`);
        }
      } catch (err) {
        // Fallback to parsing long-zero format
        if (isMounted) {
          const match = evmAddress.match(/^0x00000000000000000000000000000000([0-9a-fA-F]{8})$/);
          if (match) {
            const num = parseInt(match[1], 16);
            setHederaId(`0.0.${num}`);
          } else {
            setHederaId(null);
          }
        }
      }
    };

    resolveId();
    return () => {
      isMounted = false;
    };
  }, [evmAddress]);

  // Local state for UI adjustments (instant response when staking/minting mock actions are triggered)
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});

  // Combine live balances with local UI adjustments
  const balances: TokenBalances = {
    HBAR: liveHbarBalance,
    WHBAR: liveWhbarBalance,
    USDC: Math.max(0, liveUsdcBalance + (adjustments.USDC || 0)),
    SAUCE: Math.max(0, liveSauceBalance + (adjustments.SAUCE || 0)),
    USDT: Math.max(0, 5000 + (adjustments.USDT || 0)), // Mock stablecoin USDT
    RHEO: Math.max(0, liveRheoBalance + (adjustments.RHEO || 0)),
    DAI: Math.max(0, liveDaiBalance + (adjustments.DAI || 0)),
    HBARX: Math.max(0, liveHbarxBalance + (adjustments.HBARX || 0)),
    LP: liveLpBalance,
  };

  const connect = useCallback(async (providerId: WalletProviderId) => {
    console.warn("HederaWalletProvider.connect: Wallet connection is managed via Reown AppKit (<appkit-button>)");
  }, []);

  const disconnect = useCallback(() => {
    wagmiDisconnect();
  }, [wagmiDisconnect]);

  const deductBalance = useCallback((token: string, amount: number) => {
    setAdjustments(prev => ({
      ...prev,
      [token]: (prev[token] || 0) - amount
    }));
  }, []);

  const addBalance = useCallback((token: string, amount: number) => {
    setAdjustments(prev => ({
      ...prev,
      [token]: (prev[token] || 0) + amount
    }));
  }, []);

  const mintMockTokens = useCallback(async (tokenName: string, amount: number) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    setAdjustments(prev => ({
      ...prev,
      [tokenName]: (prev[tokenName] || 0) + amount
    }));
  }, []);


  return (
    <HederaWalletContext.Provider value={{
      address,
      hederaId,
      balances,
      isConnected,
      isConnecting,
      connect,
      disconnect,
      deductBalance,
      addBalance,
      mintMockTokens
    }}>
      {children}
    </HederaWalletContext.Provider>
  );
}

export function useHederaWallet() {
  const context = useContext(HederaWalletContext);
  if (context === undefined) {
    throw new Error('useHederaWallet must be used within a HederaWalletProvider');
  }
  return context;
}


