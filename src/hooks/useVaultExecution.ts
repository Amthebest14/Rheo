import { useState } from 'react';
import { useWriteContract, usePublicClient } from 'wagmi';
import { 
  ZAP_ROUTER_ADDRESS, 
  ZAP_ROUTER_ABI, 
  SAUCERSWAP_ROUTER_ADDRESS, 
  SAUCERSWAP_ROUTER_ABI, 
  VAULT_ABI 
} from '../config/contracts';

const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const;

export function useVaultExecution() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const approveToken = async (
    tokenAddress: `0x${string}`,
    spender: `0x${string}`,
    amount: bigint
  ) => {
    setIsPending(true);
    setTxHash(null);
    try {
      const hash = await writeContractAsync({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spender, amount],
      });
      setTxHash(hash);
      setIsPending(false);
      setIsConfirming(true);
      
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      } else {
        await new Promise(r => setTimeout(r, 6000));
      }
      
      setIsConfirming(false);
      return hash;
    } catch (err) {
      setIsPending(false);
      setIsConfirming(false);
      throw err;
    }
  };

  const executeZapIn = async (
    vaultAddress: `0x${string}`,
    tokenIn: `0x${string}`,
    amountIn: bigint,
    swapAmountOutMin: bigint,
    lpAmountOutMin: bigint,
    deadline: bigint
  ) => {
    setIsPending(true);
    setTxHash(null);
    try {
      const hash = await writeContractAsync({
        address: ZAP_ROUTER_ADDRESS,
        abi: ZAP_ROUTER_ABI as any,
        functionName: 'zapIn',
        args: [vaultAddress, tokenIn, amountIn, swapAmountOutMin, lpAmountOutMin, deadline],
      });
      setTxHash(hash);
      setIsPending(false);
      setIsConfirming(true);
      
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      } else {
        await new Promise(r => setTimeout(r, 6000));
      }
      
      setIsConfirming(false);
      return hash;
    } catch (err) {
      setIsPending(false);
      setIsConfirming(false);
      throw err;
    }
  };

  const executeZapInHBAR = async (
    vaultAddress: `0x${string}`,
    whbarAddress: `0x${string}`,
    amountIn: bigint,
    swapAmountOutMin: bigint,
    lpAmountOutMin: bigint,
    deadline: bigint
  ) => {
    setIsPending(true);
    setTxHash(null);
    try {
      const hash = await writeContractAsync({
        address: ZAP_ROUTER_ADDRESS,
        abi: ZAP_ROUTER_ABI as any,
        functionName: 'zapInHBAR',
        args: [vaultAddress, whbarAddress, swapAmountOutMin, lpAmountOutMin, deadline],
        value: amountIn * 10000000000n, // Convert tinybars (8 dec) to WEI (18 dec). Hedera EVM chain uses 18-decimal wei for native HBAR.
      });
      setTxHash(hash);
      setIsPending(false);
      setIsConfirming(true);
      
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      } else {
        await new Promise(r => setTimeout(r, 6000));
      }
      
      setIsConfirming(false);
      return hash;
    } catch (err) {
      setIsPending(false);
      setIsConfirming(false);
      throw err;
    }
  };

  const executeZapOutHBAR = async (
    vaultAddress: `0x${string}`,
    whbarAddress: `0x${string}`,
    shares: bigint,
    swapAmountOutMin: bigint,
    amountOutMin: bigint,
    deadline: bigint
  ) => {
    setIsPending(true);
    setTxHash(null);
    try {
      const hash = await writeContractAsync({
        address: ZAP_ROUTER_ADDRESS,
        abi: ZAP_ROUTER_ABI as any,
        functionName: 'zapOutHBAR',
        args: [vaultAddress, whbarAddress, shares, swapAmountOutMin, amountOutMin, deadline],
      });
      setTxHash(hash);
      setIsPending(false);
      setIsConfirming(true);
      
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      } else {
        await new Promise(r => setTimeout(r, 6000));
      }
      
      setIsConfirming(false);
      return hash;
    } catch (err) {
      setIsPending(false);
      setIsConfirming(false);
      throw err;
    }
  };

  const addLiquidity = async (
    tokenA: `0x${string}`,
    tokenB: `0x${string}`,
    amountADesired: bigint,
    amountBDesired: bigint,
    userAddress: `0x${string}`
  ) => {
    setIsPending(true);
    setTxHash(null);
    try {
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);
      const amountAMin = amountADesired * 95n / 100n; // 5% slippage
      const amountBMin = amountBDesired * 95n / 100n;

      const hash = await writeContractAsync({
        address: SAUCERSWAP_ROUTER_ADDRESS,
        abi: SAUCERSWAP_ROUTER_ABI,
        functionName: 'addLiquidity',
        args: [
          tokenA,
          tokenB,
          amountADesired,
          amountBDesired,
          amountAMin,
          amountBMin,
          userAddress,
          deadline
        ],
      });
      setTxHash(hash);
      setIsPending(false);
      setIsConfirming(true);
      
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      } else {
        await new Promise(r => setTimeout(r, 6000));
      }
      
      setIsConfirming(false);
      return hash;
    } catch (err) {
      setIsPending(false);
      setIsConfirming(false);
      throw err;
    }
  };

  const removeLiquidity = async (
    tokenA: `0x${string}`,
    tokenB: `0x${string}`,
    liquidity: bigint,
    userAddress: `0x${string}`
  ) => {
    setIsPending(true);
    setTxHash(null);
    try {
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);
      const amountAMin = 0n;
      const amountBMin = 0n;

      const hash = await writeContractAsync({
        address: SAUCERSWAP_ROUTER_ADDRESS,
        abi: SAUCERSWAP_ROUTER_ABI,
        functionName: 'removeLiquidity',
        args: [
          tokenA,
          tokenB,
          liquidity,
          amountAMin,
          amountBMin,
          userAddress,
          deadline
        ],
      });
      setTxHash(hash);
      setIsPending(false);
      setIsConfirming(true);
      
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      } else {
        await new Promise(r => setTimeout(r, 6000));
      }
      
      setIsConfirming(false);
      return hash;
    } catch (err) {
      setIsPending(false);
      setIsConfirming(false);
      throw err;
    }
  };

  const depositLP = async (
    vaultAddress: `0x${string}`,
    lpAmount: bigint,
    userAddress: `0x${string}`
  ) => {
    setIsPending(true);
    setTxHash(null);
    try {
      const hash = await writeContractAsync({
        address: vaultAddress,
        abi: VAULT_ABI,
        functionName: 'deposit',
        args: [lpAmount, userAddress],
      });
      setTxHash(hash);
      setIsPending(false);
      setIsConfirming(true);
      
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      } else {
        await new Promise(r => setTimeout(r, 6000));
      }
      
      setIsConfirming(false);
      return hash;
    } catch (err) {
      setIsPending(false);
      setIsConfirming(false);
      throw err;
    }
  };

  const redeemLP = async (
    vaultAddress: `0x${string}`,
    sharesAmount: bigint,
    userAddress: `0x${string}`
  ) => {
    setIsPending(true);
    setTxHash(null);
    try {
      const hash = await writeContractAsync({
        address: vaultAddress,
        abi: VAULT_ABI,
        functionName: 'redeem',
        args: [sharesAmount, userAddress, userAddress],
      });
      setTxHash(hash);
      setIsPending(false);
      setIsConfirming(true);
      
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      } else {
        await new Promise(r => setTimeout(r, 6000));
      }
      
      setIsConfirming(false);
      return hash;
    } catch (err) {
      setIsPending(false);
      setIsConfirming(false);
      throw err;
    }
  };

  const resetStatus = () => {
    setIsPending(false);
    setIsConfirming(false);
    setTxHash(null);
  };

  return {
    approveToken,
    executeZapIn,
    executeZapInHBAR,
    executeZapOutHBAR,
    addLiquidity,
    removeLiquidity,
    depositLP,
    redeemLP,
    isPending,
    isConfirming,
    txHash,
    setTxHash,
    setIsConfirming,
    resetStatus,
  };
}
