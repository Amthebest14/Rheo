import { useState, useEffect } from 'react';
import { useHederaWallet } from '../hooks/useHederaWallet';
import { usePoints } from '../context/PointsContext';
import { AlertCircle, Droplets, Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useWriteContract, useReadContract } from 'wagmi';
import { FAUCET_ADDRESS } from '../config/contracts';

const FAUCET_ABI = [{
  name: 'claim',
  type: 'function',
  stateMutability: 'nonpayable',
  inputs: [],
  outputs: []
}] as const;

const TOKENS = ['HBAR', 'USDC', 'SAUCE', 'DAI', 'HBARX', 'RHEO'];

const HTS_PRECOMPILE = '0x0000000000000000000000000000000000000167';
const HTS_ABI = [{
  inputs: [
    { internalType: "address", name: "account", type: "address" },
    { internalType: "address[]", name: "tokens", type: "address[]" }
  ],
  name: "associateTokens",
  outputs: [{ internalType: "int64", name: "responseCode", type: "int64" }],
  stateMutability: "nonpayable",
  type: "function"
}] as const;

// Token EVM addresses on Testnet
const TOKEN_ADDRESSES: Record<string, string> = {
  'WHBAR': '0x00000000000000000000000000000000008e4ca6',
  'USDC': '0x00000000000000000000000000000000008e4ca7',
  'DAI': '0x00000000000000000000000000000000008e4ca9',
  'HBARX': '0x00000000000000000000000000000000008e4caa',
  'SAUCE': '0x00000000000000000000000000000000008e4cac'
};

export default function FaucetView() {
  const { balances, isConnected, address } = useHederaWallet();
  const { awardPoints } = usePoints();
  const { writeContractAsync } = useWriteContract();
  const [mintingAll, setMintingAll] = useState(false);
  const [claimedAll, setClaimedAll] = useState(false);
  const [claimedRheo, setClaimedRheo] = useState(false);
  const [countdownAll, setCountdownAll] = useState<string>('');
  const [countdownRheo, setCountdownRheo] = useState<string>('');
  const [isAssociating, setIsAssociating] = useState(false);

  // On-chain reads for Faucet Cooldown
  const { data: canClaimOnChain, refetch: refetchCanClaim } = useReadContract({
    address: FAUCET_ADDRESS as `0x${string}`,
    abi: [...FAUCET_ABI, {
      name: 'canClaim',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'user', type: 'address' }],
      outputs: [{ name: '', type: 'bool' }]
    }] as const,
    functionName: 'canClaim',
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address,
    }
  });

  const { data: lastClaimedOnChain, refetch: refetchLastClaimed } = useReadContract({
    address: FAUCET_ADDRESS as `0x${string}`,
    abi: [...FAUCET_ABI, {
      name: 'lastClaimed',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: '', type: 'address' }],
      outputs: [{ name: '', type: 'uint256' }]
    }] as const,
    functionName: 'lastClaimed',
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address,
    }
  });

  const getUTCPlus1DateString = () => {
    const now = new Date();
    // UTC+1 is 1 hour ahead of UTC
    const utcPlus1Time = new Date(now.getTime() + 1 * 60 * 60 * 1000);
    const year = utcPlus1Time.getUTCFullYear();
    const month = String(utcPlus1Time.getUTCMonth() + 1).padStart(2, '0');
    const day = String(utcPlus1Time.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMsUntilNextReset = () => {
    const now = new Date();
    // 12:00 AM UTC+1 is 11:00 PM UTC
    const target = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23, 0, 0, 0
    ));
    if (now.getTime() >= target.getTime()) {
      target.setUTCDate(target.getUTCDate() + 1);
    }
    return target.getTime() - now.getTime();
  };

  // Load claimed statuses from localStorage on mount and when address changes
  useEffect(() => {
    if (!address) {
      setClaimedAll(false);
      setClaimedRheo(false);
      return;
    }

    const today = getUTCPlus1DateString();
    const isClaimedAllLocal = localStorage.getItem(`faucet_claim_${address.toLowerCase()}_all_${today}`) === 'true';
    const isClaimedOnChain = canClaimOnChain === false;
    setClaimedAll(isClaimedAllLocal || isClaimedOnChain);
    setClaimedRheo(localStorage.getItem(`faucet_claim_${address.toLowerCase()}_RHEO_${today}`) === 'true');
  }, [address, canClaimOnChain]);

  // Live countdown timer and day-rollover check
  useEffect(() => {
    if (!address) return;

    const updateCountdowns = () => {
      const today = getUTCPlus1DateString();
      const keyAll = `faucet_claim_${address.toLowerCase()}_all_${today}`;
      const keyRheo = `faucet_claim_${address.toLowerCase()}_RHEO_${today}`;

      let msAll = getMsUntilNextReset();
      let isClaimedAllVal = localStorage.getItem(keyAll) === 'true';

      if (lastClaimedOnChain !== undefined && lastClaimedOnChain !== null) {
        const lastClaimTime = Number(lastClaimedOnChain);
        if (lastClaimTime > 0) {
          const nextClaimTime = (lastClaimTime + 86400) * 1000;
          const nowMs = Date.now();
          const remainingMs = nextClaimTime - nowMs;
          if (remainingMs > 0) {
            msAll = remainingMs;
            isClaimedAllVal = true;
          }
        }
      }

      if (canClaimOnChain === false) {
        isClaimedAllVal = true;
      }

      const hrsAll = Math.floor(msAll / (1000 * 60 * 60));
      const minsAll = Math.floor((msAll % (1000 * 60 * 60)) / (1000 * 60));
      const secsAll = Math.floor((msAll % (1000 * 60)) / 1000);
      const cdStrAll = `${hrsAll.toString().padStart(2, '0')}:${minsAll.toString().padStart(2, '0')}:${secsAll.toString().padStart(2, '0')}`;

      setCountdownAll(cdStrAll);
      setClaimedAll(isClaimedAllVal);

      // RHEO (api-based) cooldown using local storage day rollover
      const msRheo = getMsUntilNextReset();
      const hrsRheo = Math.floor(msRheo / (1000 * 60 * 60));
      const minsRheo = Math.floor((msRheo % (1000 * 60 * 60)) / (1000 * 60));
      const secsRheo = Math.floor((msRheo % (1000 * 60)) / 1000);
      const cdStrRheo = `${hrsRheo.toString().padStart(2, '0')}:${minsRheo.toString().padStart(2, '0')}:${secsRheo.toString().padStart(2, '0')}`;

      if (localStorage.getItem(keyRheo) === 'true') {
        setCountdownRheo(cdStrRheo);
        setClaimedRheo(true);
      } else {
        setClaimedRheo(false);
      }
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);
    return () => clearInterval(interval);
  }, [address, canClaimOnChain, lastClaimedOnChain]);

  const handleAssociate = async () => {
    if (!isConnected || !address) {
      toast.error('Connect your wallet first');
      return;
    }

    setIsAssociating(true);
    try {
      const addressesToAssociate = [
        TOKEN_ADDRESSES['WHBAR'],
        TOKEN_ADDRESSES['USDC'],
        TOKEN_ADDRESSES['DAI'],
        TOKEN_ADDRESSES['HBARX'],
        TOKEN_ADDRESSES['SAUCE']
      ] as `0x${string}`[];

      const hash = await writeContractAsync({
        address: HTS_PRECOMPILE,
        abi: HTS_ABI,
        functionName: 'associateTokens',
        args: [address as `0x${string}`, addressesToAssociate],
        gas: 2000000n,
        type: 'legacy',
        value: 0n,
      } as any);

      toast.success('Tokens Associated Successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(`Association failed: ${err.message || err}`);
    } finally {
      setIsAssociating(false);
    }
  };

  const handleMintAllTokens = async () => {
    if (!isConnected || !address) {
      toast.error('Connect your wallet first');
      return;
    }

    const today = getUTCPlus1DateString();
    const keyAll = `faucet_claim_${address.toLowerCase()}_all_${today}`;
    const keyRheo = `faucet_claim_${address.toLowerCase()}_RHEO_${today}`;

    // TEMPORARILY DISABLED COOLDOWN FOR TESTING
    // if (claimedAll && claimedRheo) {
    //   toast.error('Already claimed all tokens today. Cooldown is active.');
    //   return;
    // }

    setMintingAll(true);

    try {
      if (!claimedAll && canClaimOnChain !== false) {
        const hash = await writeContractAsync({
          address: FAUCET_ADDRESS as `0x${string}`,
          abi: FAUCET_ABI,
          functionName: 'claim',
          args: [],
          gas: 2000000n,
          type: 'legacy',
          value: 0n,
        } as any);

        localStorage.setItem(keyAll, 'true');
        setClaimedAll(true);
        awardPoints(50, "Testnet Mint");

        try {
          await Promise.all([refetchCanClaim?.(), refetchLastClaimed?.()]);
        } catch (refetchErr) {}
        
        toast.success('Core tokens minted successfully!');
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || '';
      if (errMsg.includes('Cooldown active') || errMsg.includes('Missing or invalid parameters')) {
        toast.error('Core Faucet: Cooldown is active.');
      } else {
        toast.error(`Core Faucet request failed.`);
      }
    }

    try {
      if (!claimedRheo) {
        const response = await fetch('http://localhost:3001/api/faucet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          localStorage.setItem(keyRheo, 'true');
          setClaimedRheo(true);
          awardPoints(100, "RHEO Faucet Claim");
          toast.success('RHEO tokens minted successfully!');
        } else {
          if (data.error === 'RATE_LIMIT_EXCEEDED') {
            localStorage.setItem(keyRheo, 'true');
            setClaimedRheo(true);
          } else if (data.error !== 'TOKEN_NOT_ASSOCIATED') {
            toast.error(data.message || 'RHEO claim failed.');
          }
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setMintingAll(false);
    }
  };

  return (
    <div className="flex flex-col rounded-2xl border border-white/[0.05] bg-white/[0.015] backdrop-blur-sm shadow-[0_4px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)] overflow-hidden animate-in fade-in duration-500">
      <div className="p-5 flex flex-col gap-6">
        
        <div className="flex flex-col gap-4 p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-slate-platinum">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-cyan-electric flex-shrink-0 mt-0.5" />
            <div className="flex flex-col gap-2">
              <p className="text-sm leading-relaxed">
                <span className="font-bold uppercase tracking-wider block mb-1 text-cyan-electric">1. Associate Test Tokens</span>
                On Hedera, your wallet must be "associated" with an HTS token before you can receive it. Click the button below to associate the testnet tokens (WHBAR, USDC, DAI, HBARX, SAUCE) with your wallet. <b>You only need to do this once.</b>
              </p>
              <button
                onClick={handleAssociate}
                disabled={isAssociating || !isConnected}
                className="self-start mt-2 px-6 py-2 rounded-lg font-bold text-sm bg-cyan-electric/10 text-cyan-electric border border-cyan-electric/30 hover:bg-cyan-electric hover:text-[#0A0F1C] transition-all flex items-center gap-2"
              >
                {isAssociating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isAssociating ? 'Associating...' : 'Associate Tokens'}
              </button>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="flex flex-col gap-2 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed">
              <span className="font-bold uppercase tracking-wider block mb-1">2. Claim Tokens</span>
              These tokens hold zero real-world value and are strictly for testing smart contract flows within the Rheo Finance interface.
            </p>
          </div>
          
          <div className="mt-2 text-xs opacity-80 pl-8 font-mono">
            <p>Token Contracts (EVM):</p>
            <p>USDC: {TOKEN_ADDRESSES['USDC']}</p>
            <p>WHBAR: {TOKEN_ADDRESSES['WHBAR']}</p>
            <p>SAUCE: {TOKEN_ADDRESSES['SAUCE']}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {TOKENS.map(token => {
            let logoSrc = '';
            switch(token) {
              case 'HBAR': logoSrc = '/src/assets/hedera-logo.png.png'; break;
              case 'USDC': logoSrc = '/src/assets/usdc.png'; break;
              case 'SAUCE': logoSrc = '/src/assets/saucerswap-logo.png.png'; break;
              case 'DAI': logoSrc = '/src/assets/DAI.png'; break;
              case 'HBARX': logoSrc = '/src/assets/HBARX.png'; break;
              case 'RHEO': logoSrc = '/src/assets/rheo.png'; break;
            }
            return (
              <div key={token} className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between hover:border-white/[0.1] transition-all shadow-card group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center p-1 shadow-cyan-glow/10">
                    {logoSrc ? <img src={logoSrc} alt={token} className="w-full h-full object-contain" /> : <Droplets className="h-5 w-5 text-cyan-electric" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-platinum">{token}</h3>
                    <p className="text-xs text-slate-muted font-mono">Testnet Asset</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-muted font-bold uppercase tracking-wider mb-1">Wallet Balance</p>
                  <p className="text-lg font-bold text-slate-platinum font-mono">
                    {(balances[token] || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={handleMintAllTokens}
            disabled={mintingAll || !isConnected}
            className={`w-full py-4 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-card
              ${mintingAll ? 'bg-cyan-electric/20 text-cyan-electric border border-cyan-electric/40 cursor-wait' 
                : !isConnected ? 'bg-white/[0.02] text-slate-muted border border-white/[0.05] cursor-not-allowed'
                : 'bg-[#050A14] text-cyan-electric border border-cyan-electric/30 hover:bg-cyan-electric hover:text-[#0A0F1C] hover:shadow-cyan-glow'
              }
            `}
          >
            {mintingAll ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Minting All Tokens...</>
            ) : (
              <><Droplets className="h-4 w-4" /> Claim All Test Tokens</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
