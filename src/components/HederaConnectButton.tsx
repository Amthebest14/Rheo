import React, { useState, useRef, useEffect } from 'react';
import { useBalance, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { useHederaWallet } from '../hooks/useHederaWallet';
import { formatUnits } from 'viem';
import { Copy, ExternalLink, Power, Check, Wallet } from 'lucide-react';

export function formatHederaAddress(address: string | null): string {
  if (!address) return '';
  // Check if it is a long-zero address: 0x0000000000000000000000000000000000xxxxxx
  const match = address.match(/^0x00000000000000000000000000000000([0-9a-fA-F]{8})$/);
  if (match) {
    const num = parseInt(match[1], 16);
    return `0.0.${num}`;
  }
  // Truncate normal EVM hex address
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function HederaConnectButton({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const { open } = useAppKit();
  const { address, isConnected, hederaId } = useHederaWallet();
  const { disconnect } = useDisconnect();
  
  const { data: balanceData } = useBalance({ address: (address as `0x${string}`) || undefined });
  const hbarBalance = balanceData ? parseFloat(formatUnits(balanceData.value, balanceData.decimals)) : 0;

  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(hederaId || address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = () => {
    open();
  };

  if (!isConnected || !address) {
    return (
      <button
        onClick={handleConnect}
        className={`flex items-center gap-2 font-bold transition-all duration-300 rounded-full border border-cyan-electric bg-cyan-electric/10 hover:bg-cyan-electric/25 hover:shadow-[0_0_15px_rgba(0,229,255,0.25)] hover:scale-[1.02] text-cyan-electric active:scale-[0.98] ${
          size === 'sm' ? 'px-4 py-1.5 text-xs' : 'px-5 py-2 text-sm w-full justify-center'
        }`}
      >
        <Wallet className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        Connect Wallet
      </button>
    );
  }

  const displayAddress = hederaId || formatHederaAddress(address);
  const formattedBalance = hbarBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const hashscanLink = `https://hashscan.io/testnet/contract/${address}`;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Connected Profile Pill */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1 pr-3 rounded-full bg-[#050A14] border border-cyan-electric/40 hover:border-cyan-electric/80 transition-all duration-200 shadow-[0_0_10px_rgba(0,229,255,0.05)] hover:shadow-[0_0_15px_rgba(0,229,255,0.15)] group"
      >
        {/* Profile Mark */}
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-electric to-azure flex items-center justify-center shadow-inner group-hover:scale-[1.05] transition-transform duration-200">
          <span className="text-[#050A14] font-extrabold text-[11px]">ℏ</span>
        </div>
        
        {/* Truncated Address */}
        <div className="flex flex-col items-start justify-center">
          <span className="text-xs font-bold text-slate-platinum tracking-wide">{displayAddress}</span>
        </div>

        {/* HBAR Balance */}
        <div className="hidden sm:flex items-center gap-1.5 pl-3 pr-1 ml-1 border-l border-white/[0.08]">
          <span className="text-xs font-mono font-semibold text-emerald-400">{formattedBalance} HBAR</span>
        </div>
      </button>

      {/* Context Menu Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-white/[0.08] bg-[#0A0F1C]/95 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
          <div className="flex flex-col p-1.5">
            <div className="px-3 py-2 text-[10px] font-bold text-slate-muted uppercase tracking-wider">
              Connected Profile
            </div>
            
            <div className="px-3 py-1.5 mb-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div className="text-[10px] text-slate-muted">EVM Address:</div>
              <div className="text-[11px] font-mono text-slate-ash truncate mt-0.5" title={address}>
                {address}
              </div>
            </div>

            <button 
              onClick={handleCopy}
              className="flex items-center justify-between w-full p-2.5 rounded-xl hover:bg-white/[0.05] transition-colors text-sm text-slate-platinum"
            >
              <span className="flex items-center gap-2">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-muted" />}
                Copy Account ID
              </span>
            </button>
            
            <a 
              href={hashscanLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full p-2.5 rounded-xl hover:bg-white/[0.05] transition-colors text-sm text-slate-platinum"
              onClick={() => setIsOpen(false)}
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-slate-muted" />
                View on HashScan
              </span>
            </a>
            
            <div className="h-px bg-white/[0.05] my-1 mx-2" />
            
            <button 
              onClick={() => { setIsOpen(false); disconnect(); }}
              className="flex items-center justify-between w-full p-2.5 rounded-xl hover:bg-red-500/10 transition-colors text-sm text-red-400"
            >
              <span className="flex items-center gap-2 font-medium">
                <Power className="w-4 h-4" />
                Disconnect Wallet
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
