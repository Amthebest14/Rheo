import { useState, useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { useHederaWallet } from '../hooks/useHederaWallet';
import { useTransactions } from '../context/TransactionContext';
import { usePoints } from '../context/PointsContext';
import { ShieldCheck, BarChart3, Zap, Loader2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { STAKING_CONTRACT_ADDRESS, STAKING_CONTRACT_ABI } from '../config/contracts';
import { useStaking } from '../hooks/useStaking';

export default function GovernanceView() {
  const { stakedRheo, setStakedRheo, claimableDividends, setClaimableDividends } = usePortfolio();
  const { balances, isConnected, address } = useHederaWallet();
  const { addTransaction } = useTransactions();
  const { awardPoints } = usePoints();
  
  const [activeTab, setActiveTab] = useState<'stake' | 'unstake'>('stake');
  const [amount, setAmount] = useState('');

  // 1. Fetch live total RHEO staked in the contract
  const { data: totalStakedRaw, refetch: refetchTotalStaked } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_CONTRACT_ABI,
    functionName: 'totalStaked',
  });
  const liveTotalStaked = totalStakedRaw ? parseFloat(formatUnits(totalStakedRaw, 8)) : 0;

  // 2. Fetch live user's staked RHEO balance from contract stakers mapping
  const { data: stakerInfo, refetch: refetchStakerInfo } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_CONTRACT_ABI,
    functionName: 'stakers',
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address,
    }
  });
  const liveStakedAmount = stakerInfo ? parseFloat(formatUnits(stakerInfo[0], 8)) : 0;

  // 3. Fetch live user's pending USDC rewards
  const { data: pendingRewardRaw, refetch: refetchPendingReward } = useReadContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_CONTRACT_ABI,
    functionName: 'pendingReward',
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address,
    }
  });
  const livePendingUSDC = pendingRewardRaw ? parseFloat(formatUnits(pendingRewardRaw, 6)) : 0;

  const refetchAll = async () => {
    await Promise.all([
      refetchTotalStaked(),
      refetchStakerInfo(),
      refetchPendingReward(),
    ]);
  };

  // Sync live on-chain values back to context so the rest of the application (like PointsView) updates
  useEffect(() => {
    if (isConnected) {
      setStakedRheo(liveStakedAmount);
    } else {
      setStakedRheo(0);
    }
  }, [liveStakedAmount, setStakedRheo, isConnected]);

  useEffect(() => {
    if (isConnected) {
      setClaimableDividends(livePendingUSDC);
    } else {
      setClaimableDividends(0);
    }
  }, [livePendingUSDC, setClaimableDividends, isConnected]);

  // Hook for executing on-chain staking write transactions
  const { stake, withdraw, claimRewards, isPending, statusText } = useStaking(address as `0x${string}` | null);
  
  const parsedAmount = parseFloat(amount) || 0;
  const rheoBalance = balances.RHEO || 0;
  
  const maxUsable = activeTab === 'stake' ? rheoBalance : stakedRheo;
  const isInsufficient = parsedAmount > maxUsable;
  const hasAmount = parsedAmount > 0;

  const handleFraction = (pct: number) => {
    setAmount((maxUsable * pct).toString());
  };

  const handleAction = async () => {
    if (!hasAmount || isInsufficient || !isConnected) return;
    
    try {
      if (activeTab === 'stake') {
        const hash = await stake(parsedAmount);
        toast.success(`Staking transaction submitted! Hash: ${hash}`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        await refetchAll();
        awardPoints(300, "Governance Staking");
        
        addTransaction({
          id: hash,
          type: 'deposit',
          vaultId: 'governance',
          amounts: [{ asset: 'RHEO', quantity: parsedAmount }],
          timestamp: Date.now(),
          status: 'success',
          hash: `https://hashscan.io/testnet/transaction/${hash}`
        });
      } else {
        const hash = await withdraw(parsedAmount);
        toast.success(`Unstaking transaction submitted! Hash: ${hash}`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        await refetchAll();
        
        addTransaction({
          id: hash,
          type: 'withdraw',
          vaultId: 'governance',
          amounts: [{ asset: 'RHEO', quantity: parsedAmount }],
          timestamp: Date.now(),
          status: 'success',
          hash: `https://hashscan.io/testnet/transaction/${hash}`
        });
      }
      setAmount('');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Transaction failed');
    }
  };

  const handleClaim = async () => {
    if (claimableDividends <= 0 || !isConnected) return;
    
    try {
      const hash = await claimRewards();
      toast.success(`USDC claim transaction submitted! Hash: ${hash}`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      await refetchAll();
      
      addTransaction({
        id: hash,
        type: 'deposit',
        vaultId: 'governance-claim',
        amounts: [{ asset: 'USDC', quantity: livePendingUSDC }],
        timestamp: Date.now(),
        status: 'success',
        hash: `https://hashscan.io/testnet/transaction/${hash}`
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Claim failed');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      
      {/* COLUMN A: Protocol Health */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="p-6 rounded-2xl bg-[#050A14] border border-white/[0.05] flex flex-col gap-6 shadow-card">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-azure" />
            <h2 className="text-xl font-bold text-slate-platinum">Protocol Governance</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5 p-4 rounded-xl border border-white/[0.05] bg-white/[0.02]">
              <div className="flex items-center gap-1.5 text-slate-muted">
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="text-xs">Total $RHEO Staked</span>
              </div>
              <span className="text-2xl font-bold tabular-nums text-slate-platinum">
                {(45250000 + liveTotalStaked).toLocaleString()} <span className="text-sm text-slate-muted font-normal">RHEO</span>
              </span>
            </div>
            
            <div className="flex flex-col gap-1.5 p-4 rounded-xl border border-azure/30 bg-azure/5">
              <div className="flex items-center gap-1.5 text-azure">
                <Zap className="h-3.5 w-3.5" />
                <span className="text-xs font-bold">Staking Rewards Staked</span>
              </div>
              <span className="text-2xl font-bold tabular-nums text-azure">
                ~15.4% APR
              </span>
            </div>

            <div className="flex flex-col gap-1.5 p-4 rounded-xl border border-white/[0.05] bg-white/[0.02]">
              <div className="flex items-center gap-1.5 text-slate-muted">
                <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs text-emerald-400">Total Revenue Distributed</span>
              </div>
              <span className="text-xl font-bold tabular-nums text-slate-platinum">
                $1,204,500.00 <span className="text-sm text-slate-muted font-normal">USDC</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* COLUMN B: Staking Engine */}
      <div className="lg:w-[400px] flex flex-col gap-4">
        <div className="rounded-2xl border border-white/[0.05] bg-[#0A0F1C]/60 flex flex-col overflow-hidden shadow-card">
          <div className="flex items-center border-b border-white/[0.05] bg-white/[0.01]">
            <button 
              onClick={() => setActiveTab('stake')}
              className={`flex-1 py-4 text-sm font-bold transition-colors relative ${activeTab === 'stake' ? 'text-azure' : 'text-slate-muted hover:text-slate-platinum'}`}
            >
              Stake RHEO
              {activeTab === 'stake' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-azure shadow-[0_-2px_10px_rgba(26,111,255,0.5)]" />}
            </button>
            <button 
              onClick={() => setActiveTab('unstake')}
              className={`flex-1 py-4 text-sm font-bold transition-colors relative ${activeTab === 'unstake' ? 'text-slate-platinum' : 'text-slate-muted hover:text-slate-platinum'}`}
            >
              Unstake
              {activeTab === 'unstake' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-platinum shadow-[0_-2px_10px_rgba(255,255,255,0.5)]" />}
            </button>
          </div>

          <div className="p-6">
            <div className="relative mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-muted uppercase">Amount</span>
                <span className="text-[10px] text-slate-muted font-mono">
                  {activeTab === 'stake' ? `Bal: ${rheoBalance.toLocaleString()}` : `Staked: ${stakedRheo.toLocaleString()}`}
                </span>
              </div>
              <div className={`flex items-center gap-2 px-4 py-3.5 rounded-xl border transition-all duration-200 ${
                parsedAmount > 0 ? (isInsufficient ? 'border-red-500/40 bg-red-500/5' : 'border-azure/40 bg-azure/5') : 'border-white/[0.08] bg-[#050A14]'
              }`}>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className={`flex-1 bg-transparent text-xl font-bold placeholder:text-slate-muted outline-none tabular-nums min-w-0 ${isInsufficient ? 'text-red-400' : 'text-slate-platinum'}`}
                  disabled={isPending}
                />
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-slate-platinum text-sm font-bold">$RHEO</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3">
                {[0.25, 0.5, 0.75, 1.0].map(pct => (
                  <button
                    key={pct}
                    onClick={() => handleFraction(pct)}
                    disabled={isPending}
                    className="flex-1 py-1.5 rounded-lg border border-white/[0.05] bg-white/[0.02] text-slate-ash hover:bg-white/[0.05] hover:text-slate-platinum transition-colors text-[10px] font-bold"
                  >
                    {pct === 1.0 ? 'MAX' : `${pct * 100}%`}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAction}
              disabled={!hasAmount || isInsufficient || isPending || !isConnected}
              className={`w-full py-4 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2
                ${!hasAmount || isInsufficient || !isConnected
                  ? 'bg-white/[0.02] text-slate-muted border border-white/[0.05] cursor-not-allowed'
                  : 'bg-azure hover:bg-azure-light text-white shadow-azure-glow border border-azure'
                }
              `}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? (statusText || 'Processing...') : (activeTab === 'stake' ? 'Stake to Earn Protocol Revenue' : 'Unstake $RHEO')}
            </button>
          </div>
        </div>

        {/* Claimable Revenue Box */}
        <div className="p-6 rounded-2xl bg-[#050A14] border border-cyan-electric/30 shadow-cyan-glow/10 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-cyan-electric/5 blur-xl"></div>
          <div className="relative z-10 flex flex-col">
            <span className="text-xs font-bold text-cyan-electric uppercase tracking-widest mb-1">Claimable Revenue</span>
            <span className="text-3xl text-slate-platinum font-bold tabular-nums">
              ${claimableDividends.toFixed(4)} <span className="text-lg text-slate-muted">USDC</span>
            </span>
          </div>
          <button
            onClick={handleClaim}
            disabled={claimableDividends <= 0 || isPending || !isConnected}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all relative z-10 flex items-center justify-center gap-2
              ${claimableDividends > 0 && isConnected && !isPending
                ? 'bg-cyan-electric text-[#0A0F1C] hover:bg-cyan-electric/90 shadow-cyan-glow'
                : 'bg-white/[0.05] text-slate-muted cursor-not-allowed'
              }
            `}
          >
            {isPending && activeTab !== 'stake' && activeTab !== 'unstake' && <Loader2 className="h-4 w-4 animate-spin" />}
            Claim Dividends
          </button>
        </div>
      </div>
      
    </div>
  );
}
