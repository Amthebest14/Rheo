/**
 * DashboardTerminal.tsx — Rheo Finance Web3 Dashboard Engine
 * Route: /app
 *
 * Layout: 100vh locked terminal — no outer scroll.
 * Master Architecture:
 *   - Grid View (Default): Utility bar + VaultCards
 *   - Vault Detail Workspace: High-fidelity 2-column deep dive
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Settings,
  Loader2,
  Wallet,
  ChevronDown,
  TrendingUp,
  DollarSign,
  Droplets,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Clock,
  Zap,
  Sprout,
  Search,
  SlidersHorizontal,
  Activity,
  GitMerge,
  ShieldCheck,
  Code2
} from 'lucide-react'
import { VAULTS, SLIPPAGE_OPTIONS, formatTVL, type VaultRow, type SlippageOption } from '../config/vaultData'

/* ═══════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════ */
type TabId          = 'markets' | 'portfolio'
type WalletState    = 'idle' | 'connecting' | 'connected'
type DepositStep    = 'idle' | 'approve' | 'signing' | 'success' | 'error'
type SortConfig     = 'apy-desc' | 'apy-asc' | 'tvl-desc' | 'balance-desc'

/* ═══════════════════════════════════════════════════════════
   SUBCOMPONENT: SLIPPAGE POPOVER
═══════════════════════════════════════════════════════════ */
function SlippagePopover({
  selected,
  onChange,
  onClose,
}: {
  selected: SlippageOption
  onChange: (v: SlippageOption) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute right-0 bottom-12 z-50 w-52 rounded-xl border border-white/[0.08] bg-[#0D1526]/95 backdrop-blur-xl shadow-card p-3"
    >
      <p className="text-slate-ash text-xs font-semibold uppercase tracking-widest mb-2.5 px-1">
        Slippage Tolerance
      </p>
      <div className="flex gap-2">
        {SLIPPAGE_OPTIONS.map(opt => (
          <button
            key={opt}
            onClick={() => { onChange(opt); onClose() }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              selected === opt
                ? 'bg-azure text-white shadow-azure-glow'
                : 'bg-white/[0.04] text-slate-ash hover:bg-white/[0.08] hover:text-slate-platinum'
            }`}
          >
            {opt}%
          </button>
        ))}
      </div>
      <p className="text-slate-muted text-[10px] mt-2.5 px-1 leading-relaxed">
        Higher tolerance increases the chance of successful transactions on volatile pairs.
      </p>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SUBCOMPONENT: UTILITY BAR
═══════════════════════════════════════════════════════════ */
function DashboardUtilityBar({
  searchQuery, setSearchQuery,
  showMyPositions, setShowMyPositions,
  sortBy, setSortBy
}: {
  searchQuery: string
  setSearchQuery: (v: string) => void
  showMyPositions: boolean
  setShowMyPositions: (v: boolean) => void
  sortBy: SortConfig
  setSortBy: (v: SortConfig) => void
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 py-4 border-b border-white/[0.05] bg-white/[0.01] flex-shrink-0">
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-muted pointer-events-none" />
        <input
          type="text"
          placeholder="Search Assets or Pools..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-[#0A0F1C]/60 border border-white/[0.05] rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-platinum placeholder:text-slate-muted outline-none focus:border-azure/50 transition-colors"
        />
      </div>
      <div className="flex items-center gap-5 w-full sm:w-auto justify-between sm:justify-end">
        <label className="flex items-center gap-2 cursor-pointer group select-none" onClick={() => setShowMyPositions(!showMyPositions)}>
          <div className={`relative w-10 h-6 rounded-full transition-colors duration-300 ${showMyPositions ? 'bg-azure' : 'bg-white/[0.05] border border-white/[0.1]'}`}>
            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${showMyPositions ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
          <span className="text-sm font-medium text-slate-ash group-hover:text-slate-platinum transition-colors">
            My Positions
          </span>
        </label>
        <div className="w-px h-5 bg-white/[0.08]" />
        <div className="relative flex items-center gap-2 border border-white/[0.05] rounded-xl bg-[#0A0F1C]/60 px-3 py-2 hover:border-white/[0.1] transition-colors">
          <SlidersHorizontal className="h-4 w-4 text-slate-muted" />
          <select 
            value={sortBy} 
            onChange={e => setSortBy(e.target.value as SortConfig)}
            className="bg-transparent text-sm text-slate-platinum font-medium outline-none appearance-none cursor-pointer pr-5"
          >
            <option value="apy-desc" className="bg-navy-900">APY (High to Low)</option>
            <option value="apy-asc" className="bg-navy-900">APY (Low to High)</option>
            <option value="tvl-desc" className="bg-navy-900">TVL (High to Low)</option>
            <option value="balance-desc" className="bg-navy-900">Position Size (High to Low)</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-muted pointer-events-none" />
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SUBCOMPONENT: VAULT CARD (LIST ITEM)
═══════════════════════════════════════════════════════════ */
function VaultCard({ vault, onManageClick }: { vault: VaultRow, onManageClick: () => void }) {
  const userUsdValue = vault.userBalance * 0.0742

  return (
    <div className="flex flex-col rounded-2xl border border-white/[0.05] bg-[#0A0F1C]/60 overflow-hidden transition-all duration-300 flex-shrink-0 hover:border-white/[0.1]">
      <div className="p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        
        {/* Left Core: Asset Identity */}
        <div className="flex items-center gap-4 xl:w-64">
          <div className="relative w-11 h-7 flex-shrink-0">
            <div className="absolute left-0 top-0 w-7 h-7 rounded-full border border-navy-950 flex items-center justify-center overflow-hidden bg-white/[0.05]">
              <img src={vault.tokenAIcon} alt={vault.tokenA} className="w-full h-full object-cover" />
            </div>
            <div className="absolute left-4 top-0 w-7 h-7 rounded-full border border-navy-950 flex items-center justify-center overflow-hidden bg-white/[0.05]">
              <img src={vault.tokenBIcon} alt={vault.tokenB} className="w-full h-full object-cover" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-slate-platinum text-base font-bold">{vault.pairLabel}</p>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                TESTNET
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-white/[0.04] text-slate-ash border border-white/[0.05]">{vault.version}</span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-cyan-electric/10 text-cyan-electric border border-cyan-electric/20">{vault.feeTier}</span>
              {vault.tags.includes('LARI') && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">LARI</span>}
              {vault.tags.includes('AUTO') && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">AUTO</span>}
              {vault.tags.includes('leaf') && (
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Sprout className="h-3 w-3" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center Core: Protocol Metrics */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
          <div className="flex flex-col">
            <span className="text-slate-muted text-[10px] uppercase tracking-wider font-semibold">Rheo APY</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-cyan-electric cyan-glow-text tabular-nums">{vault.rheoApy.toFixed(1)}%</span>
            </div>
            <span className="text-slate-muted text-xs line-through mt-0.5">{vault.baseApr.toFixed(1)}% Base APR</span>
          </div>
          
          <div className="flex flex-col justify-center">
            <span className="text-slate-muted text-[10px] uppercase tracking-wider font-semibold">Total Value Locked</span>
            <span className="text-lg font-bold text-slate-platinum tabular-nums mt-1">{formatTVL(vault.tvlUsd)}</span>
          </div>
        </div>

        {/* Right Core: Personal Yield Accounting */}
        <div className="flex items-center justify-between xl:justify-end gap-6 w-full xl:w-auto border-t border-white/[0.05] xl:border-t-0 pt-4 xl:pt-0">
          <div className="flex gap-6">
            <div className="flex flex-col">
              <span className="text-slate-muted text-[10px] uppercase tracking-wider font-semibold">My Balance</span>
              <span className="text-sm font-semibold text-slate-platinum tabular-nums mt-1">${userUsdValue.toFixed(2)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-muted text-[10px] uppercase tracking-wider font-semibold">Pending Yield</span>
              <span className="text-sm font-bold text-emerald-400 tabular-nums mt-1">$0.00</span>
            </div>
          </div>
          
          <button 
            onClick={onManageClick} 
            className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 bg-azure hover:bg-azure-light text-white shadow-azure-glow hover:-translate-y-0.5 border border-azure-light/30"
          >
            Manage
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SUBCOMPONENT: VAULT WORKSPACE (DETAIL VIEW)
═══════════════════════════════════════════════════════════ */
function VaultWorkspace({ vault, onClose }: { vault: VaultRow, onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit')
  const [amount, setAmount] = useState('')
  const [slippage, setSlippage] = useState<SlippageOption>('0.5')
  const [showSlippage, setShowSlippage] = useState(false)
  const [depositStep, setDepositStep] = useState<DepositStep>('idle')
  const [chartMode, setChartMode] = useState<'tvl' | 'apy'>('tvl')

  const parsedAmount  = parseFloat(amount) || 0
  const hasAmount     = parsedAmount > 0
  const isMaxed       = parsedAmount >= vault.userBalance
  const receiveShares = (parsedAmount * 0.9732).toFixed(4)
  const userUsdValue  = vault.userBalance * 0.0742

  const handleAction = async () => {
    if (!hasAmount || depositStep !== 'idle') return
    setDepositStep('approve')
    await new Promise(r => setTimeout(r, 1800))
    setDepositStep('signing')
    await new Promise(r => setTimeout(r, 2200))
    setDepositStep('success')
  }

  const actionConfig = {
    idle:    { label: 'Review Parameters',           disabled: !hasAmount },
    approve: { label: 'Approve Protocol Allowance…', disabled: true       },
    signing: { label: 'Awaiting Hashpack Signature…',disabled: true       },
    success: { label: 'Success Toast Notification',  disabled: false      },
    error:   { label: 'Transaction Failed',          disabled: false      },
  }[depositStep]

  const fractionOptions = [0.25, 0.50, 0.75, 1.0]

  return (
    <div className="flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onClose} className="flex items-center gap-2 text-slate-ash hover:text-white transition-colors group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-semibold text-sm">Return to Markets</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── COLUMN A: ANALYTICS & STRATEGY (Main Panel) ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Identity Header */}
          <div className="p-6 rounded-2xl border border-white/[0.05] bg-[#0A0F1C]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-9 flex-shrink-0">
                <div className="absolute left-0 top-0 w-9 h-9 rounded-full border border-navy-950 flex items-center justify-center overflow-hidden bg-white/[0.05] shadow-lg">
                  <img src={vault.tokenAIcon} alt={vault.tokenA} className="w-full h-full object-cover" />
                </div>
                <div className="absolute left-5 top-0 w-9 h-9 rounded-full border border-navy-950 flex items-center justify-center overflow-hidden bg-white/[0.05] shadow-lg">
                  <img src={vault.tokenBIcon} alt={vault.tokenB} className="w-full h-full object-cover" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-platinum">{vault.pairLabel} Vault</h2>
                <p className="text-slate-muted text-xs mt-0.5 font-medium">SaucerSwap V2 Automated Liquidity</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 text-xs font-bold">Active Automated Yield</span>
            </div>
          </div>

          {/* Analytics Chart Block */}
          <div className="p-6 rounded-2xl border border-white/[0.05] bg-[#0A0F1C]/60 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-slate-platinum font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-electric" /> Performance Analytics
              </h3>
              <div className="flex bg-white/[0.03] rounded-lg p-1 border border-white/[0.05]">
                <button 
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${chartMode === 'tvl' ? 'bg-white/[0.1] text-white shadow-sm' : 'text-slate-ash hover:text-slate-platinum'}`}
                  onClick={() => setChartMode('tvl')}
                >
                  TVL Growth
                </button>
                <button 
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${chartMode === 'apy' ? 'bg-white/[0.1] text-white shadow-sm' : 'text-slate-ash hover:text-slate-platinum'}`}
                  onClick={() => setChartMode('apy')}
                >
                  Historical APY
                </button>
              </div>
            </div>

            {/* Mock Chart Area */}
            <div className="relative h-64 w-full rounded-xl overflow-hidden bg-gradient-to-b from-white/[0.02] to-transparent border border-white/[0.02] flex items-end">
              <svg viewBox="0 0 800 200" className="w-full h-full opacity-70" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path 
                  d={chartMode === 'tvl' 
                    ? "M0,180 C100,160 200,170 300,120 C400,70 500,100 600,50 C700,0 800,20 800,20 L800,200 L0,200 Z"
                    : "M0,100 C150,150 250,50 400,80 C500,100 600,30 800,60 L800,200 L0,200 Z"
                  } 
                  fill="url(#chartGradient)" 
                />
                <path 
                  d={chartMode === 'tvl'
                    ? "M0,180 C100,160 200,170 300,120 C400,70 500,100 600,50 C700,0 800,20"
                    : "M0,100 C150,150 250,50 400,80 C500,100 600,30 800,60"
                  }
                  fill="none" 
                  stroke="#00E5FF" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                />
                {/* Simulated Data Coordinate Points */}
                <circle cx="300" cy={chartMode === 'tvl' ? "120" : "75"} r="4" fill="#0A0F1C" stroke="#00E5FF" strokeWidth="2" />
                <circle cx="600" cy={chartMode === 'tvl' ? "50" : "30"} r="4" fill="#0A0F1C" stroke="#00E5FF" strokeWidth="2" />
              </svg>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.03]">
                <p className="text-[10px] text-slate-muted uppercase font-bold tracking-wider">Current TVL</p>
                <p className="text-xl text-slate-platinum font-bold mt-1 tabular-nums">{formatTVL(vault.tvlUsd)}</p>
              </div>
              <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.03]">
                <p className="text-[10px] text-slate-muted uppercase font-bold tracking-wider">Rheo APY</p>
                <p className="text-xl text-cyan-electric cyan-glow-text font-bold mt-1 tabular-nums">{vault.rheoApy.toFixed(1)}%</p>
              </div>
              <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.03]">
                <p className="text-[10px] text-slate-muted uppercase font-bold tracking-wider">Base APR</p>
                <p className="text-xl text-slate-ash font-bold mt-1 tabular-nums">{vault.baseApr.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Protocol Strategy Matrix */}
          <div className="p-6 rounded-2xl border border-white/[0.05] bg-[#0A0F1C]/60 flex flex-col">
             <h3 className="text-slate-platinum font-semibold flex items-center gap-2 mb-6">
                <GitMerge className="h-4 w-4 text-azure" /> Protocol Strategy Matrix
             </h3>
             
             <div className="flex flex-col gap-6">
               <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#050A14] p-5 rounded-xl border border-white/[0.03]">
                 <div className="text-center">
                   <div className="w-10 h-10 rounded-full bg-white/[0.05] flex items-center justify-center mx-auto mb-2 border border-white/[0.1]">
                     <Wallet className="h-4 w-4 text-slate-ash" />
                   </div>
                   <p className="text-[10px] text-slate-ash font-bold uppercase tracking-wider">Deposit Asset</p>
                 </div>
                 <div className="hidden md:block h-px flex-1 bg-gradient-to-r from-transparent via-azure/50 to-transparent relative">
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#050A14] px-2 text-[10px] text-azure font-mono">STEP 1</div>
                 </div>
                 <div className="text-center">
                   <div className="w-10 h-10 rounded-full bg-white/[0.05] flex items-center justify-center mx-auto mb-2 border border-azure/30">
                     <img src="/src/assets/saucerswap-logo.png.png" className="h-5 w-5" alt="Saucer" />
                   </div>
                   <p className="text-[10px] text-slate-ash font-bold uppercase tracking-wider">SaucerSwap LP</p>
                 </div>
                 <div className="hidden md:block h-px flex-1 bg-gradient-to-r from-transparent via-cyan-electric/50 to-transparent relative">
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#050A14] px-2 text-[10px] text-cyan-electric font-mono">YIELD</div>
                 </div>
                 <div className="text-center">
                   <div className="w-10 h-10 rounded-full bg-white/[0.05] flex items-center justify-center mx-auto mb-2 border border-cyan-electric/30">
                     <TrendingUp className="h-4 w-4 text-cyan-electric" />
                   </div>
                   <p className="text-[10px] text-slate-ash font-bold uppercase tracking-wider">Auto-Reinvest</p>
                 </div>
               </div>

               <div className="bg-[#050A14] rounded-xl border border-white/[0.03] overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/[0.05] bg-white/[0.02] flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-slate-muted" />
                    <span className="text-xs font-mono text-slate-ash">Contract Properties</span>
                  </div>
                  <div className="p-4 space-y-3 font-mono text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-muted">Token ID (Receipt)</span>
                      <span className="text-azure">0.0.4589211</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-muted">Vault Router</span>
                      <span className="text-slate-platinum">{vault.contractAddress}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-muted">Security Audit</span>
                      <span className="flex items-center gap-1 text-emerald-400"><ShieldCheck className="h-3 w-3" /> Halborn Verified</span>
                    </div>
                  </div>
               </div>
             </div>
          </div>

        </div>

        {/* ── COLUMN B: TRANSACTION ENGINE (Side Panel) ── */}
        <div className="lg:col-span-1 flex flex-col gap-6 h-full">
          <div className="rounded-2xl border border-white/[0.05] bg-[#0A0F1C]/60 flex flex-col h-full overflow-hidden shadow-card sticky top-6">
            
            {/* Dual Tab Interface */}
            <div className="flex items-center border-b border-white/[0.05] bg-white/[0.01]">
              <button 
                onClick={() => setActiveTab('deposit')}
                className={`flex-1 py-4 text-sm font-bold transition-colors relative ${activeTab === 'deposit' ? 'text-cyan-electric' : 'text-slate-muted hover:text-slate-platinum'}`}
              >
                Deposit Assets
                {activeTab === 'deposit' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-electric shadow-[0_-2px_10px_rgba(0,229,255,0.5)]" />}
              </button>
              <button 
                onClick={() => setActiveTab('withdraw')}
                className={`flex-1 py-4 text-sm font-bold transition-colors relative ${activeTab === 'withdraw' ? 'text-azure' : 'text-slate-muted hover:text-slate-platinum'}`}
              >
                Withdraw Liquidity
                {activeTab === 'withdraw' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-azure shadow-[0_-2px_10px_rgba(26,111,255,0.5)]" />}
              </button>
            </div>

            {/* Terminal Body */}
            <div className="p-6 flex flex-col flex-1">
              
              {/* Asset Input Terminal */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-ash uppercase tracking-wider">Amount</span>
                  <span className="text-xs text-slate-muted">
                    Balance: <span className="font-mono text-slate-platinum">{vault.userBalance.toLocaleString()} {vault.tokenA}</span>
                  </span>
                </div>
                
                <div className={`flex items-center gap-2 px-4 py-3.5 rounded-xl border transition-all duration-200 ${
                  hasAmount ? (activeTab === 'deposit' ? 'border-cyan-electric/40 bg-cyan-electric/5' : 'border-azure/40 bg-azure/5') : 'border-white/[0.08] bg-[#050A14]'
                }`}>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => { if (depositStep !== 'success') setAmount(e.target.value) }}
                    className="flex-1 bg-transparent text-slate-platinum text-xl font-bold placeholder:text-slate-muted outline-none tabular-nums min-w-0"
                    disabled={depositStep !== 'idle'}
                  />
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <img src={vault.tokenAIcon} className="w-5 h-5 rounded-full" alt={vault.tokenA} />
                    <span className="text-slate-platinum text-sm font-bold">{vault.tokenA}</span>
                  </div>
                </div>

                {/* Fraction Pill Row */}
                <div className="flex items-center gap-2 mt-3">
                  {fractionOptions.map(pct => (
                    <button
                      key={pct}
                      onClick={() => handleFraction(pct)}
                      disabled={depositStep !== 'idle'}
                      className="flex-1 py-1.5 rounded-lg border border-white/[0.05] bg-white/[0.02] text-slate-ash hover:bg-white/[0.05] hover:text-slate-platinum transition-colors text-[10px] font-bold"
                    >
                      {pct === 1.0 ? 'MAX' : `${pct * 100}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transaction Receipt */}
              <div className="flex-1">
                <div className="rounded-xl border border-white/[0.03] bg-[#050A14] p-4 space-y-4 mb-6">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-muted font-medium">Shares to {activeTab === 'deposit' ? 'Mint' : 'Burn'}</span>
                    <span className="text-slate-platinum font-mono font-bold">{hasAmount ? receiveShares : '0.0000'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs relative">
                    <span className="text-slate-muted font-medium flex items-center gap-1.5">
                      Slippage Tolerance 
                      <button onClick={() => setShowSlippage(!showSlippage)} className="hover:text-white transition-colors">
                        <Settings className="h-3.5 w-3.5" />
                      </button>
                      {showSlippage && <SlippagePopover selected={slippage} onChange={setSlippage} onClose={() => setShowSlippage(false)} />}
                    </span>
                    <span className="text-slate-platinum font-mono font-bold">{slippage}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-t border-white/[0.05] pt-4 mt-2">
                    <span className="text-slate-muted font-medium">Hedera Gas Allocation</span>
                    <span className="text-emerald-400 font-mono font-bold">$0.0001</span>
                  </div>
                </div>
              </div>

              {/* Multi-Stage Execution Button */}
              <button
                onClick={handleAction}
                disabled={actionConfig.disabled}
                className={`w-full py-4 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2
                  ${depositStep === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                    : !hasAmount
                      ? 'bg-white/[0.02] text-slate-muted border border-white/[0.05] cursor-not-allowed'
                      : activeTab === 'deposit' 
                        ? 'bg-cyan-electric hover:bg-cyan-electric/90 text-[#0A0F1C] shadow-cyan-glow border border-cyan-electric'
                        : 'bg-azure hover:bg-azure-light text-white shadow-azure-glow border border-azure'
                  }
                  ${(depositStep === 'approve' || depositStep === 'signing') ? 'opacity-70 cursor-wait' : ''}
                `}
              >
                {(depositStep === 'approve' || depositStep === 'signing') && <Loader2 className="h-4 w-4 animate-spin" />}
                {depositStep === 'success' && <CheckCircle2 className="h-4 w-4" />}
                {actionConfig.label}
              </button>

            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SUBCOMPONENT: PORTFOLIO VIEW
═══════════════════════════════════════════════════════════ */
function PortfolioView({ isConnected }: { isConnected: boolean }) {
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 text-center px-8">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-2">
          <Wallet className="h-7 w-7 text-slate-muted" />
        </div>
        <h3 className="text-slate-platinum font-semibold text-lg">Connect your wallet</h3>
        <p className="text-slate-ash text-sm max-w-xs leading-relaxed">
          Connect your Hedera wallet to view your active vault positions, pending yields, and compounding history.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5 border-b border-white/[0.05]">
        {[
          { label: 'Total Deposited', value: '$0.00',  icon: DollarSign,  cyan: false },
          { label: 'Pending Yield',   value: '0.000',  icon: TrendingUp,  cyan: true  },
          { label: 'Total Earned',    value: '$0.00',  icon: BarChart3,   cyan: false },
        ].map(({ label, value, icon: Icon, cyan }) => (
          <div key={label} className="flex flex-col gap-1.5 p-4 rounded-xl border border-white/[0.05] bg-white/[0.02]">
            <div className="flex items-center gap-1.5 text-slate-muted">
              <Icon className="h-3.5 w-3.5" />
              <span className="text-xs">{label}</span>
            </div>
            <span className={`text-xl font-bold tabular-nums ${cyan ? 'text-cyan-electric cyan-glow-text' : 'text-slate-platinum'}`}>
              {value}
            </span>
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8 py-10">
        <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
          <Droplets className="h-5 w-5 text-slate-muted" />
        </div>
        <p className="text-slate-ash text-sm">No active positions yet.</p>
        <p className="text-slate-muted text-xs max-w-xs">
          Deposit into a vault from the Markets tab to start earning compounded yield.
        </p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SUBCOMPONENT: DASHBOARD HEADER
═══════════════════════════════════════════════════════════ */
function DashHeader({
  activeTab,
  onTabChange,
  walletState,
  walletAddress,
  onConnectWallet,
}: {
  activeTab:       TabId
  onTabChange:     (t: TabId) => void
  walletState:     WalletState
  walletAddress:   string
  onConnectWallet: () => void
}) {
  const navigate     = useNavigate()
  const [imgError, setImgError] = useState(false)

  return (
    <header className="flex-shrink-0 h-16 flex items-center justify-between px-5 border-b border-white/[0.05] bg-navy-950/80 backdrop-blur-md relative z-20">
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-muted hover:text-slate-ash transition-colors" title="Back to home">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="w-px h-5 bg-white/[0.08]" />
        {!imgError ? (
          <img
            src="/src/assets/HASHPILOT (1).png"
            alt="Rheo Finance"
            className="w-32 h-auto object-contain cursor-pointer"
            onClick={() => navigate('/')}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-azure to-cyan-electric flex items-center justify-center">
              <Droplets className="h-3 w-3 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-slate-platinum font-bold text-sm">Rheo Finance</span>
          </div>
        )}
      </div>

      {/* Center: Tabs */}
      <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center p-1 rounded-xl border border-white/[0.06] bg-white/[0.02]">
        {(['markets', 'portfolio'] as TabId[]).map(tab => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`px-6 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all duration-200 ${
              activeTab === tab ? 'bg-azure text-white shadow-azure-glow' : 'text-slate-ash hover:text-slate-platinum'
            }`}
          >
            {tab === 'markets' ? 'Markets' : 'Portfolio'}
          </button>
        ))}
      </div>

      {/* Right: Wallet */}
      <div className="flex items-center gap-3">
        <select 
          className="md:hidden bg-white/[0.02] border border-white/[0.06] text-slate-platinum text-xs rounded-lg px-2 py-2 outline-none appearance-none"
          value={activeTab}
          onChange={(e) => onTabChange(e.target.value as TabId)}
        >
          <option value="markets" className="bg-navy-900">Markets</option>
          <option value="portfolio" className="bg-navy-900">Portfolio</option>
        </select>

        <button
          onClick={onConnectWallet}
          disabled={walletState === 'connecting'}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
            walletState === 'connected' ? 'border border-cyan-electric/40 bg-cyan-electric/5 text-cyan-electric shadow-cyan-glow' : walletState === 'connecting' ? 'border border-white/[0.08] bg-white/[0.04] text-slate-ash cursor-wait' : 'border border-azure/30 bg-azure/10 text-azure hover:bg-azure/15 hover:border-azure/50'
          }`}
        >
          {walletState === 'connecting' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {walletState === 'connected' && <span className="w-2 h-2 rounded-full bg-cyan-electric animate-pulse" />}
          {walletState === 'idle' && <Wallet className="h-3.5 w-3.5" />}
          <span className="font-mono hidden sm:inline">
            {walletState === 'idle' && 'Connect Wallet'}
            {walletState === 'connecting' && 'Connecting…'}
            {walletState === 'connected' && walletAddress}
          </span>
        </button>
      </div>
    </header>
  )
}

/* ═══════════════════════════════════════════════════════════
   ROOT: DASHBOARD TERMINAL
═══════════════════════════════════════════════════════════ */
export default function DashboardTerminal() {
  const [activeTab,       setActiveTab]       = useState<TabId>('markets')
  const [walletState,     setWalletState]     = useState<WalletState>('idle')
  const [walletAddress,   setWalletAddress]   = useState('')
  
  const [searchQuery,     setSearchQuery]     = useState('')
  const [showMyPositions, setShowMyPositions] = useState(false)
  const [sortBy,          setSortBy]          = useState<SortConfig>('tvl-desc')
  
  // STATE REFUSAL: Main layout controller
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null)

  const handleConnectWallet = async () => {
    if (walletState === 'connected') {
      setWalletState('idle')
      setWalletAddress('')
      return
    }
    if (walletState === 'connecting') return
    setWalletState('connecting')
    await new Promise(r => setTimeout(r, 2000))
    setWalletAddress('0.0.1245...8af2')
    setWalletState('connected')
  }

  const processedVaults = useMemo(() => {
    let result = [...VAULTS]
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase()
      result = result.filter(v => v.pairLabel.toLowerCase().includes(q) || v.tokenA.toLowerCase().includes(q) || v.tokenB.toLowerCase().includes(q))
    }
    if (showMyPositions) {
      result = result.filter(v => v.userBalance > 0)
    }
    result.sort((a, b) => {
      switch (sortBy) {
        case 'apy-desc': return b.rheoApy - a.rheoApy
        case 'apy-asc':  return a.rheoApy - b.rheoApy
        case 'tvl-desc': return b.tvlUsd - a.tvlUsd
        case 'balance-desc': return b.userBalance - a.userBalance
        default: return 0
      }
    })
    return result
  }, [searchQuery, showMyPositions, sortBy])

  // Locate current vault object if active
  const activeVault = VAULTS.find(v => v.id === selectedVaultId)

  return (
    <div
      className="h-screen w-screen flex flex-col bg-navy-950 text-slate-platinum font-sans antialiased overflow-hidden relative"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cpath d='M 80 0 L 0 0 0 80' fill='none' stroke='rgba(255,255,255,0.018)' stroke-width='1'/%3E%3C/svg%3E")`
      }}
    >
      <DashHeader
        activeTab={activeTab}
        onTabChange={(t) => { setActiveTab(t); setSelectedVaultId(null); }}
        walletState={walletState}
        walletAddress={walletAddress}
        onConnectWallet={handleConnectWallet}
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col relative z-10 pb-20">
        <div className="pointer-events-none fixed top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(ellipse, rgba(26,111,255,0.15) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">

          {/* ── WORKSPACE VIEW ── */}
          {activeVault ? (
             <VaultWorkspace vault={activeVault} onClose={() => setSelectedVaultId(null)} />
          ) : (
            /* ── MAIN LIST VIEW ── */
            <>
              {activeTab === 'markets' && (
                <div className="flex flex-col rounded-2xl border border-white/[0.05] bg-white/[0.015] backdrop-blur-sm shadow-[0_4px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)] overflow-hidden animate-in fade-in duration-500">
                  <DashboardUtilityBar 
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    showMyPositions={showMyPositions}
                    setShowMyPositions={setShowMyPositions}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                  />
                  <div className="flex flex-col gap-4 p-5 bg-[#050A14]/40 min-h-[400px]">
                    {processedVaults.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-48 text-slate-muted">
                        <Search className="h-8 w-8 mb-3 opacity-50" />
                        <p>No vaults found matching your filters.</p>
                      </div>
                    ) : (
                      processedVaults.map(vault => (
                        <VaultCard 
                          key={vault.id} 
                          vault={vault} 
                          onManageClick={() => setSelectedVaultId(vault.id)}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'portfolio' && (
                <div className="flex flex-col rounded-2xl border border-white/[0.05] bg-white/[0.015] backdrop-blur-sm shadow-[0_4px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)] overflow-hidden animate-in fade-in">
                  <PortfolioView isConnected={walletState === 'connected'} />
                </div>
              )}

              {/* Bottom status strip */}
              <div className="flex items-center justify-between text-[11px] text-slate-muted px-2">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-azure/60" /> {VAULTS.length} vaults · SaucerSwap V2</span>
                  <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-cyan-electric/60" /> Keeper: ACTIVE</span>
                </div>
                <span className="font-mono">v1.2.0-beta · Chain 0x128</span>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
