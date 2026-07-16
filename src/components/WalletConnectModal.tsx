import React from 'react';
import { X, QrCode } from 'lucide-react';
import type { WalletProviderId } from '../hooks/useHederaWallet';

interface WalletProvider {
  id: WalletProviderId;
  name: string;
  icon: React.ReactNode;
  tag?: string;
}

const PROVIDERS: WalletProvider[] = [
  {
    id: 'hashpack',
    name: 'HashPack',
    tag: 'Preferred',
    icon: <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center font-bold text-white tracking-tighter">H</div>
  },
  {
    id: 'blade',
    name: 'Blade Wallet',
    icon: <div className="w-8 h-8 rounded-lg bg-[#00E5FF] flex items-center justify-center font-bold text-black tracking-tighter">B</div>
  },
  {
    id: 'kabila',
    name: 'Kabila',
    icon: <div className="w-8 h-8 rounded-lg bg-[#5C24FF] flex items-center justify-center font-bold text-white tracking-tighter">K</div>
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: <div className="w-8 h-8 rounded-lg bg-[#3396FF] flex items-center justify-center text-white"><QrCode className="w-5 h-5" /></div>
  }
];

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (providerId: WalletProviderId) => void;
  isConnecting: boolean;
}

export default function WalletConnectModal({ isOpen, onClose, onConnect, isConnecting }: WalletConnectModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#0A0F1C]/80 backdrop-blur-xl transition-opacity animate-in fade-in duration-300"
        onClick={!isConnecting ? onClose : undefined}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-sm bg-[#0A0F1C] border border-white/[0.05] rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.05]">
          <h2 className="text-slate-platinum font-semibold text-lg">Connect Wallet</h2>
          <button 
            onClick={onClose}
            disabled={isConnecting}
            className="p-2 -mr-2 rounded-full text-slate-muted hover:text-slate-platinum hover:bg-white/[0.05] transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-3 flex flex-col gap-1.5">
          {PROVIDERS.map((provider) => (
            <button
              key={provider.id}
              onClick={() => onConnect(provider.id)}
              disabled={isConnecting}
              className="group relative flex items-center justify-between w-full p-4 rounded-2xl bg-white/[0.02] border border-transparent hover:border-cyan-electric/40 hover:bg-cyan-electric/5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-4">
                {provider.icon}
                <span className="text-slate-platinum font-semibold">{provider.name}</span>
              </div>
              {provider.tag && (
                <span className="px-2 py-0.5 rounded-md bg-cyan-electric/10 text-cyan-electric text-[10px] font-bold uppercase tracking-wider">
                  {provider.tag}
                </span>
              )}
            </button>
          ))}
        </div>
        
        <div className="p-4 text-center bg-white/[0.01]">
          <p className="text-xs text-slate-muted">
            New to Hedera? <a href="#" className="text-cyan-electric hover:underline">Learn about wallets</a>
          </p>
        </div>
      </div>
    </div>
  );
}
