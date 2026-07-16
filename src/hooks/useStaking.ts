import { useState } from 'react';
import { useWriteContract, useReadContract } from 'wagmi';
import { STAKING_CONTRACT_ADDRESS, STAKING_CONTRACT_ABI, RHEO_TOKEN_ADDRESS } from '../config/contracts';
import { parseUnits } from 'viem';

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
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const;

export function useStaking(userAddress: `0x${string}` | null) {
  const { writeContractAsync } = useWriteContract();
  const [isPending, setIsPending] = useState(false);
  const [statusText, setStatusText] = useState('');

  // Read current allowance of RHEO tokens for the Staking contract
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: RHEO_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: userAddress && STAKING_CONTRACT_ADDRESS ? [userAddress, STAKING_CONTRACT_ADDRESS] : undefined,
    query: {
      enabled: !!userAddress,
    }
  });

  const stake = async (amount: number) => {
    if (!userAddress) throw new Error('Wallet not connected');
    setIsPending(true);
    
    const amountRaw = parseUnits(amount.toString(), 8); // RHEO has 8 decimals

    try {
      // 1. Check if allowance is sufficient, otherwise trigger approve transaction
      const currentAllowance = allowance || 0n;
      if (currentAllowance < amountRaw) {
        setStatusText('Approving $RHEO...');
        const approveHash = await writeContractAsync({
          address: RHEO_TOKEN_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [STAKING_CONTRACT_ADDRESS, amountRaw],
        });
        console.log(`[Staking] Approved RHEO. Hash: ${approveHash}`);
        
        // Wait briefly for network indexing
        await new Promise(resolve => setTimeout(resolve, 3000));
        await refetchAllowance();
      }

      // 2. Perform Stake transaction
      setStatusText('Staking $RHEO...');
      const stakeHash = await writeContractAsync({
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_CONTRACT_ABI,
        functionName: 'stake',
        args: [amountRaw],
      });
      
      setIsPending(false);
      setStatusText('');
      return stakeHash;
    } catch (err) {
      setIsPending(false);
      setStatusText('');
      throw err;
    }
  };

  const withdraw = async (amount: number) => {
    if (!userAddress) throw new Error('Wallet not connected');
    setIsPending(true);
    setStatusText('Unstaking $RHEO...');
    const amountRaw = parseUnits(amount.toString(), 8); // RHEO has 8 decimals

    try {
      const hash = await writeContractAsync({
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_CONTRACT_ABI,
        functionName: 'withdraw',
        args: [amountRaw],
      });
      setIsPending(false);
      setStatusText('');
      return hash;
    } catch (err) {
      setIsPending(false);
      setStatusText('');
      throw err;
    }
  };

  const claimRewards = async () => {
    if (!userAddress) throw new Error('Wallet not connected');
    setIsPending(true);
    setStatusText('Claiming USDC dividends...');

    try {
      const hash = await writeContractAsync({
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_CONTRACT_ABI,
        functionName: 'claimRewards',
        args: [],
      });
      setIsPending(false);
      setStatusText('');
      return hash;
    } catch (err) {
      setIsPending(false);
      setStatusText('');
      throw err;
    }
  };

  return {
    stake,
    withdraw,
    claimRewards,
    isPending,
    statusText,
  };
}
