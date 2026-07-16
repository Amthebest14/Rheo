import React from 'react';
import { Target, Sparkles, Trophy, CheckCircle2, Circle } from 'lucide-react';
import { usePoints } from '../context/PointsContext';
import { useHederaWallet } from '../hooks/useHederaWallet';
import { usePortfolio } from '../context/PortfolioContext';

export default function PointsView() {
  const { userPoints } = usePoints();
  const { isConnected, address } = useHederaWallet();
  const { activePositions, stakedRheo } = usePortfolio();

  const quests = [
    {
      id: 'connect',
      title: 'Connect Hedera Wallet',
      description: 'Link your Web3 identity to start earning.',
      points: 100,
      completed: isConnected,
      icon: <Target className="h-5 w-5 text-azure" />
    },
    {
      id: 'deploy',
      title: 'Deploy Capital',
      description: 'Deposit assets into any SaucerSwap Vault.',
      points: 500,
      completed: activePositions.length > 0,
      icon: <Sparkles className="h-5 w-5 text-cyan-electric" />
    },
    {
      id: 'stake',
      title: 'Secure the Protocol',
      description: 'Stake $RHEO in the Governance Module.',
      points: 300,
      completed: stakedRheo > 0,
      icon: <Trophy className="h-5 w-5 text-yellow-400" />
    }
  ];

  const mockLeaderboard = [
    { rank: 1, id: '0.0.84921', tier: 'Top 1%', points: 125400 },
    { rank: 2, id: '0.0.31142', tier: 'Top 1%', points: 98200 },
    { rank: 3, id: '0.0.99302', tier: 'Top 1%', points: 87500 },
    { rank: 4, id: '0.0.12404', tier: 'Top 5%', points: 64100 },
    { rank: 5, id: '0.0.76211', tier: 'Top 5%', points: 51200 },
    { rank: 6, id: '0.0.44211', tier: 'Top 5%', points: 48900 },
    { rank: 7, id: '0.0.51222', tier: 'Top 10%', points: 41200 },
  ];

  const getRankStyles = (rank: number) => {
    if (rank === 1) return 'text-[#D4AF37]/80 border-[#D4AF37]/20 bg-[#D4AF37]/[0.02]'; // Muted Gold
    if (rank === 2) return 'text-slate-300 border-slate-300/20 bg-slate-300/[0.02]';     // Muted Silver
    if (rank === 3) return 'text-[#B87333]/80 border-[#B87333]/20 bg-[#B87333]/[0.02]'; // Muted Bronze
    return 'text-slate-400 border-transparent';
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto w-full pb-20">
      
      {/* Hero Section */}
      <div className="p-8 lg:p-12 rounded-3xl border border-white/[0.05] bg-[#0A0F1C]/80 relative overflow-hidden flex flex-col justify-end text-right min-h-[280px]">
        {/* Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-electric/10 to-transparent opacity-60 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-electric opacity-60"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-electric"></span>
            </span>
            <span className="text-cyan-electric text-xs font-bold uppercase tracking-[0.2em]">Season 1: Protocol Allocation</span>
          </div>

          <div className="flex flex-col items-end">
            <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em] mb-2">Total Accumulated Points</p>
            <div className="text-6xl md:text-8xl font-black font-mono tracking-tight text-slate-platinum tabular-nums leading-none">
              {userPoints.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-10">
        
        {/* The Missions Revert ("Active Missions") */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-2 px-2">
            <div className="w-1.5 h-4 bg-azure" />
            <h2 className="text-lg font-mono font-bold text-slate-300 tracking-wider uppercase">Active Missions</h2>
          </div>
          {quests.map(quest => (
            <div 
              key={quest.id} 
              className={`p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between ${
                quest.completed 
                  ? 'bg-emerald-500/5 border-emerald-500/20' 
                  : 'bg-[#0A0F1C]/60 border-white/[0.05] hover:border-white/[0.1]'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  quest.completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.05] border border-white/[0.05]'
                }`}>
                  {quest.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-platinum">{quest.title}</h3>
                  <p className="text-xs text-slate-muted mt-0.5">{quest.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-yellow-400">+{quest.points}</span>
                  <span className="text-[10px] text-slate-muted uppercase font-bold tracking-wider">PTS</span>
                </div>
                {quest.completed ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                ) : (
                  <Circle className="h-6 w-6 text-white/[0.1]" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* The Leaderboard Refactor ("Global Rankings") */}
        <div className="flex flex-col relative w-full h-full min-h-[500px]">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-1.5 h-4 bg-cyan-electric" />
            <h2 className="text-lg font-mono font-bold text-slate-300 tracking-wider uppercase">Global Rankings</h2>
          </div>

          <div className="flex flex-col border border-white/[0.05] rounded-xl bg-[#0A0F1C]/40 flex-1 overflow-hidden relative">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/[0.05] bg-white/[0.02] text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest sticky top-0 z-10">
              <div className="col-span-2">Rank</div>
              <div className="col-span-4">Address</div>
              <div className="col-span-3">Tier</div>
              <div className="col-span-3 text-right">Total Allocation</div>
            </div>

            {/* Scrollable Body */}
            <div className="flex flex-col pb-[72px]">
              {mockLeaderboard.map((user) => {
                const style = getRankStyles(user.rank);
                return (
                  <div 
                    key={user.rank} 
                    className={`grid grid-cols-12 gap-4 items-center px-6 py-5 border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors border-l-2 ${style}`}
                  >
                    <div className="col-span-2 font-mono text-sm">
                      #{user.rank}
                    </div>
                    <div className="col-span-4 font-mono text-sm opacity-90">
                      {user.id}
                    </div>
                    <div className="col-span-3">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-white/[0.05] bg-white/[0.02] text-slate-400">
                        {user.tier}
                      </span>
                    </div>
                    <div className="col-span-3 font-mono text-sm text-right tabular-nums">
                      {user.points.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sticky Footer for Active User */}
            <div className="absolute bottom-0 left-0 w-full grid grid-cols-12 gap-4 items-center px-6 py-5 bg-cyan-electric/5 backdrop-blur-md border-t border-cyan-electric/30 border-l-2 border-l-cyan-electric shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
              <div className="col-span-2 font-mono text-sm text-cyan-electric font-bold">
                {userPoints > 0 ? '#12,042' : '—'}
              </div>
              <div className="col-span-4 font-mono text-sm text-white">
                {isConnected ? (address || 'Connected') : 'Not Connected'}
              </div>
              <div className="col-span-3">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-cyan-electric/20 bg-cyan-electric/10 text-cyan-electric">
                  {userPoints > 0 ? 'Top 38%' : 'Unranked'}
                </span>
              </div>
              <div className="col-span-3 font-mono text-sm text-right tabular-nums text-cyan-electric font-bold">
                {userPoints.toLocaleString()}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
