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
import { toast } from 'sonner'
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
  Code2,
  History,
  ArrowDownRight,
  ArrowUpRight,
  ExternalLink
} from 'lucide-react'
import { SLIPPAGE_OPTIONS, formatTVL, type VaultRow, type SlippageOption } from '../config/vaultData'
import { usePortfolio } from '../context/PortfolioContext'
import { useProtocol } from '../context/ProtocolContext'
import { useTransactions } from '../context/TransactionContext'
import { usePoints } from '../context/PointsContext'
import VaultChart from '../components/VaultChart'
import { useHederaWallet } from '../hooks/useHederaWallet'
import WalletConnectModal from '../components/WalletConnectModal'
import HederaProfilePill from '../components/HederaProfilePill'

function StreamingYield({ initialYield = 0 }: { initialYield?: number }) {
  const [val, setVal] = useState(initialYield)
  
  useEffect(() => {
    const t = setInterval(() => {
      setVal(prev => prev + 0.0000014)
    }, 3000)
    return () => clearInterval(t)
  }, [])

  return (
    <span className="text-xl font-bold tabular-nums text-cyan-electric cyan-glow-text">
      ${val.toFixed(7)}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════ */
type TabId          = 'markets' | 'portfolio' | 'governance' | 'faucet' | 'points'
type SortConfig     = 'tvl-desc' | 'apy-desc' | 'apy-asc' | 'balance-desc'
type DepositStep    = 'idle' | 'approve' | 'signing' | 'success'

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
  const { activePositions } = usePortfolio()
  const position = activePositions.find(p => p.vaultId === vault.id)
  const userUsdValue = position ? (position.tokenAAmount + position.tokenBAmount) * 0.5 : 0;

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
function VaultWorkspace({ vault, onClose }: { vault: VaultRow, onClose: () => void }) {
  const { deposit, withdraw, activePositions } = usePortfolio()
  const { balances, deductBalance, addBalance } = useHederaWallet()
  const { addTransaction } = useTransactions()
  const { awardPoints } = usePoints()
  const { tokenPrices } = useProtocol()
  const position = activePositions.find(p => p.vaultId === vault.id)
  
  const userVaultBalanceTokenA = position ? position.tokenAAmount : 0
  const userVaultBalanceTokenB = position ? position.tokenBAmount : 0

  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit')
  const [depositMode, setDepositMode] = useState<'standard' | 'zap'>('standard')
  const [zapToken, setZapToken] = useState<string>(vault.tokenA)
  const [zapAmount, setZapAmount] = useState('')
  const [withdrawPercent, setWithdrawPercent] = useState<number>(0)
  const [withdrawMode, setWithdrawMode] = useState<'dual' | 'zap'>('dual')
  const [withdrawZapToken, setWithdrawZapToken] = useState<string>(vault.tokenA)
  const [amountA, setAmountA] = useState('')
  const [amountB, setAmountB] = useState('')
  const [slippage, setSlippage] = useState<SlippageOption>('0.5')
  const [showSlippage, setShowSlippage] = useState(false)
  const [depositStep, setDepositStep] = useState<DepositStep>('idle')
  const [chartMode, setChartMode] = useState<'tvl' | 'apy'>('tvl')

  const parsedAmountA = parseFloat(amountA) || 0
  const parsedAmountB = parseFloat(amountB) || 0
  const parsedZapAmount = parseFloat(zapAmount) || 0
  const isZapMode = activeTab === 'deposit' && depositMode === 'zap'
  const isWithdrawZapMode = activeTab === 'withdraw' && withdrawMode === 'zap'
  
  // Math for Zap Mode
  const isZapTokenA = zapToken === vault.tokenA
  const retainedAmount = parsedZapAmount / 2
  const swapAmount = parsedZapAmount / 2
  const swapOutputRaw = isZapTokenA ? swapAmount * vault.ratio! : swapAmount / vault.ratio!
  const swapFee = swapOutputRaw * 0.003
  const swapOutputFinal = swapOutputRaw - swapFee

  const finalDepositA = isZapTokenA ? retainedAmount : swapOutputFinal
  const finalDepositB = isZapTokenA ? swapOutputFinal : retainedAmount
  
  const tokenAWalletBalance = balances[vault.tokenA] || 0;
  const tokenBWalletBalance = balances[vault.tokenB] || 0;
  
  // Ratio = Token B amount per 1 Token A
  // If we have live tokenPrices from Mainnet, use them. Otherwise fallback to mock vault.ratio
  let ratio = vault.ratio || 1.0;
  if (tokenPrices && tokenPrices[vault.tokenA] && tokenPrices[vault.tokenB]) {
    ratio = tokenPrices[vault.tokenA] / tokenPrices[vault.tokenB];
  }
  
  const maxUsableAForWallet = Math.min(tokenAWalletBalance, tokenBWalletBalance / ratio);
  
  // Withdraw Math
  const msElapsed = position ? Date.now() - position.depositTimestamp : 0;
  const hoursElapsed = msElapsed / (1000 * 60 * 60);
  const principalUsd = (userVaultBalanceTokenA + userVaultBalanceTokenB) * 0.5; // Mock USD base
  const r = vault.rheoApy / 100;
  const n = 8760;
  const tYears = hoursElapsed / 8760;
  const accrued = position ? (principalUsd * Math.pow(1 + r/n, n * tYears) - principalUsd + (msElapsed / 1000) * 0.0000014) : 0;
  
  const totalPositionValueUsd = principalUsd + accrued;
  const valueToWithdrawUsd = totalPositionValueUsd * withdrawPercent;
  
  const withdrawA = userVaultBalanceTokenA * withdrawPercent;
  const withdrawB = userVaultBalanceTokenB * withdrawPercent;
  
  const isWithdrawZapTokenA = withdrawZapToken === vault.tokenA;
  const withdrawSwapAmount = isWithdrawZapTokenA ? withdrawB : withdrawA;
  const withdrawRetainedAmount = isWithdrawZapTokenA ? withdrawA : withdrawB;
  
  const withdrawSwapOutputRaw = isWithdrawZapTokenA ? withdrawSwapAmount / ratio : withdrawSwapAmount * ratio;
  const withdrawSwapFee = withdrawSwapOutputRaw * 0.003;
  const withdrawSwapOutputFinal = withdrawSwapOutputRaw - withdrawSwapFee;
  
  const finalWithdrawToken = withdrawRetainedAmount + withdrawSwapOutputFinal;

  const hasAmount = activeTab === 'deposit' 
    ? (isZapMode ? parsedZapAmount > 0 : (parsedAmountA > 0 && parsedAmountB > 0)) 
    : withdrawPercent > 0;

  const receiveShares = activeTab === 'deposit' 
    ? (isZapMode ? (parsedZapAmount * 0.9732).toFixed(4) : (parsedAmountA * 0.9732).toFixed(4))
    : (withdrawA * 0.9732).toFixed(4);
  const userUsdValue  = userVaultBalanceTokenA + userVaultBalanceTokenB

  const handleAmountAChange = (val: string) => {
    setAmountA(val);
    if (val === '') {
      setAmountB('');
      return;
    }
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) setAmountB((parsed * ratio).toFixed(4).replace(/\.?0+$/, ''));
  };

  const handleAmountBChange = (val: string) => {
    setAmountB(val);
    if (val === '') {
      setAmountA('');
      return;
    }
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) setAmountA((parsed / ratio).toFixed(4).replace(/\.?0+$/, ''));
  };

  const mockChartData = useMemo(() => {
    const basePrincipal = userVaultBalanceTokenA > 0 ? (userVaultBalanceTokenA + userVaultBalanceTokenB) : 1000;
    const r = vault.rheoApy / 100;
    const n = 8760;

    return Array.from({ length: 30 }).map((_, i) => {
      const days = i + 1;
      const tYears = days / 365;
      const projectedValue = basePrincipal * Math.pow(1 + r/n, n * tYears);

      return {
        timestamp: `Day ${days}`,
        tvl: vault.tvlUsd + (i * (vault.tvlUsd * 0.05)) + (Math.random() * (vault.tvlUsd * 0.02) - (vault.tvlUsd * 0.01)),
        apy: projectedValue
      }
    });
  }, [vault.tvlUsd, vault.rheoApy, userVaultBalanceTokenA, userVaultBalanceTokenB])

  const handleAction = async () => {
    if (!hasAmount || depositStep !== 'idle') return
    setDepositStep('approve')
    await new Promise(r => setTimeout(r, 1800))
    setDepositStep('signing')
    await new Promise(r => setTimeout(r, 2200))
    
    // Simulate transaction success
    setDepositStep('success')
    
    const mockHashId = `0.0.482915@${(Date.now() / 1000).toFixed(9)}`;
    const mockHashLink = `https://hashscan.io/testnet/transaction/${mockHashId}`;

    // Apply to portfolio context
    if (activeTab === 'deposit') {
      if (isZapMode) {
        deductBalance(zapToken, parsedZapAmount)
        deposit(vault.id, finalDepositA, finalDepositB, vault.rheoApy)
        
        addTransaction({
          id: mockHashId,
          type: 'deposit',
          vaultId: vault.id,
          amounts: [
            { asset: zapToken, quantity: parsedZapAmount }
          ],
          timestamp: Date.now(),
          status: 'success',
          hash: mockHashLink
        })
        awardPoints(500, "Capital Deployed")
      } else {
        deductBalance(vault.tokenA, parsedAmountA)
        deductBalance(vault.tokenB, parsedAmountB)
        deposit(vault.id, parsedAmountA, parsedAmountB, vault.rheoApy)
        
        addTransaction({
          id: mockHashId,
          type: 'deposit',
          vaultId: vault.id,
          amounts: [
            { asset: vault.tokenA, quantity: parsedAmountA },
            { asset: vault.tokenB, quantity: parsedAmountB }
          ],
          timestamp: Date.now(),
          status: 'success',
          hash: mockHashLink
        })
        awardPoints(500, "Capital Deployed")
      }
    } else {
      withdraw(vault.id, withdrawPercent)
      
      if (isWithdrawZapMode) {
        addBalance(withdrawZapToken, finalWithdrawToken)
        
        addTransaction({
          id: mockHashId,
          type: 'withdraw',
          vaultId: vault.id,
          amounts: [
            { asset: withdrawZapToken, quantity: finalWithdrawToken }
          ],
          timestamp: Date.now(),
          status: 'success',
          hash: mockHashLink
        })
      } else {
        addBalance(vault.tokenA, withdrawA)
        addBalance(vault.tokenB, withdrawB)
        
        addTransaction({
          id: mockHashId,
          type: 'withdraw',
          vaultId: vault.id,
          amounts: [
            { asset: vault.tokenA, quantity: withdrawA },
            { asset: vault.tokenB, quantity: withdrawB }
          ],
          timestamp: Date.now(),
          status: 'success',
          hash: mockHashLink
        })
      }
    }

    // Fire premium sonner toast
    toast.custom((t) => (
      <div className="flex flex-col gap-2 p-4 rounded-xl border border-cyan-electric/40 bg-[#050A14]/95 backdrop-blur-md shadow-cyan-glow/20">
        <div className="flex items-center gap-2">
          <span className="text-slate-platinum font-bold text-sm">Yield Engine Activated</span>
        </div>
        <p className="text-slate-ash text-xs mt-1">
          {activeTab === 'deposit' ? 'Successfully routed your liquidity into the SaucerSwap auto-compounding vault.' : 'Successfully withdrawn your liquidity from the vault.'}
        </p>
        <button 
          onClick={() => toast.dismiss(t)} 
          className="text-xs font-semibold text-azure hover:text-cyan-electric mt-2 self-start transition-colors"
        >
          View on Hashscan ↗
        </button>
      </div>
    ))

    // Reset after toast
    setAmountA('')
    setAmountB('')
    setWithdrawPercent(0)
    setTimeout(() => setDepositStep('idle'), 2000)
  }

  const handleFraction = (pct: number) => {
    if (activeTab === 'deposit') {
      handleAmountAChange((maxUsableAForWallet * pct).toString());
    } else {
      setWithdrawPercent(pct);
    }
  }

  const isAInsufficient = activeTab === 'deposit' && (isZapMode ? (isZapTokenA && parsedZapAmount > tokenAWalletBalance) : parsedAmountA > tokenAWalletBalance);
  const isBInsufficient = activeTab === 'deposit' && (isZapMode ? (!isZapTokenA && parsedZapAmount > tokenBWalletBalance) : parsedAmountB > tokenBWalletBalance);

  let idleLabel = 'Review Parameters';
  let idleDisabled = !hasAmount;

  if (activeTab === 'deposit' && hasAmount) {
    if (isAInsufficient) {
      idleLabel = `Insufficient ${vault.tokenA} Balance`;
      idleDisabled = true;
    } else if (isBInsufficient) {
      idleLabel = `Insufficient ${vault.tokenB} Balance`;
      idleDisabled = true;
    }
  }

  const actionConfigMap: any = {
    idle:    { label: idleLabel,                     disabled: idleDisabled },
    approve: { label: 'Approve Protocol Allowance...', disabled: true       },
    signing: { label: 'Awaiting Hashpack Signature...',disabled: true       },
    success: { label: 'Success Toast Notification',  disabled: false      },
    error:   { label: 'Transaction Failed',          disabled: false      },
  };
  const actionConfig = actionConfigMap[depositStep];

  const fractionOptions = [0.25, 0.50, 0.75, 1.0];

  return (
    <div className="flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onClose} className="flex items-center gap-2 text-slate-ash hover:text-white transition-colors group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-semibold text-sm">Return to Markets</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  30-Day Projection
                </button>
              </div>
            </div>

            {/* Chart Area */}
            <div className="relative h-64 w-full rounded-xl overflow-hidden bg-gradient-to-b from-white/[0.02] to-transparent border border-white/[0.02]">
              <VaultChart data={mockChartData} dataKey={chartMode} />
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

          {          {/* Live Strategy Routing */}
          <div className="p-6 rounded-2xl border border-white/[0.05] bg-[#0A0F1C]/60 flex flex-col">
             <h3 className="text-slate-platinum font-semibold flex items-center gap-2 mb-6">
                <GitMerge className="h-4 w-4 text-azure" /> Live Strategy Routing
             </h3>
             
             <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-[#050A14] p-5 rounded-xl border border-white/[0.03]">
               {/* Node 1 */}
               <div className="flex flex-col items-center text-center">
                 <div className="w-12 h-12 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-3 shadow-card">
                   <Wallet className="h-5 w-5 text-slate-platinum" />
                 </div>
                 <p className="text-xs font-bold text-slate-platinum">User Deposit</p>
               </div>

               <ArrowDownRight className="lg:hidden h-5 w-5 text-cyan-electric animate-pulse my-2" />
               <div className="hidden lg:flex flex-1 h-px bg-cyan-electric/20 relative items-center justify-center">
                 <ArrowUpRight className="h-4 w-4 text-cyan-electric animate-pulse absolute rotate-45 right-[-8px]" />
               </div>

               {/* Node 2 */}
               <div className="flex flex-col items-center text-center">
                 <div className="w-12 h-12 rounded-xl bg-azure/10 border border-azure/30 flex items-center justify-center mb-3 shadow-azure-glow/20">
                   <Zap className="h-5 w-5 text-azure" />
                 </div>
                 <p className="text-xs font-bold text-slate-platinum">Zap Engine</p>
                 <p className="text-[10px] text-slate-muted mt-1 max-w-[90px]">Auto-splits to 50/50 ratio</p>
               </div>

               <ArrowDownRight className="lg:hidden h-5 w-5 text-cyan-electric animate-pulse my-2" />
               <div className="hidden lg:flex flex-1 h-px bg-cyan-electric/20 relative items-center justify-center">
                 <ArrowUpRight className="h-4 w-4 text-cyan-electric animate-pulse absolute rotate-45 right-[-8px]" />
               </div>

               {/* Node 3 */}
               <div className="flex flex-col items-center text-center">
                 <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center mb-3 shadow-card">
                   <Droplets className="h-5 w-5 text-slate-ash" />
                 </div>
                 <p className="text-xs font-bold text-slate-platinum">Liquidity Pool</p>
                 <p className="text-[10px] text-slate-muted mt-1 max-w-[90px]">Supplied to SaucerSwap</p>
               </div>

               <ArrowDownRight className="lg:hidden h-5 w-5 text-cyan-electric animate-pulse my-2" />
               <div className="hidden lg:flex flex-1 h-px bg-cyan-electric/20 relative items-center justify-center">
                 <ArrowUpRight className="h-4 w-4 text-cyan-electric animate-pulse absolute rotate-45 right-[-8px]" />
               </div>

               {/* Node 4 */}
               <div className="flex flex-col items-center text-center">
                 <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-3">
                   <Sprout className="h-5 w-5 text-emerald-400" />
                 </div>
                 <p className="text-xs font-bold text-slate-platinum">Yield Farm</p>
                 <p className="text-[10px] text-slate-muted mt-1 max-w-[90px]">Earns $SAUCE Rewards</p>
               </div>

               <ArrowDownRight className="lg:hidden h-5 w-5 text-cyan-electric animate-pulse my-2" />
               <div className="hidden lg:flex flex-1 h-px bg-cyan-electric/20 relative items-center justify-center">
                 <ArrowUpRight className="h-4 w-4 text-cyan-electric animate-pulse absolute rotate-45 right-[-8px]" />
               </div>

               {/* Node 5 */}
               <div className="flex flex-col items-center text-center">
                 <div className="w-12 h-12 rounded-xl bg-cyan-electric/10 border border-cyan-electric/30 flex items-center justify-center mb-3 shadow-cyan-glow">
                   <Settings className="h-5 w-5 text-cyan-electric animate-[spin_4s_linear_infinite]" />
                 </div>
                 <p className="text-xs font-bold text-slate-platinum">Rheo Auto-Compounder</p>
                 <p className="text-[10px] text-slate-muted mt-1 max-w-[90px]">Sells rewards, reinvests hourly</p>
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

            {/* Zap Switcher */}
            {activeTab === 'deposit' && (
              <div className="p-4 pb-0">
                <div className="flex bg-[#050A14] p-1 rounded-xl border border-white/[0.05]">
                  <button 
                    onClick={() => { setDepositMode('standard'); setZapAmount(''); }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${depositMode === 'standard' ? 'bg-white/[0.1] text-white shadow-sm' : 'text-slate-muted hover:text-slate-ash'}`}
                  >
                    Standard Layout
                  </button>
                  <button 
                    onClick={() => { setDepositMode('zap'); setAmountA(''); setAmountB(''); }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${depositMode === 'zap' ? 'bg-cyan-electric/20 text-cyan-electric shadow-sm border border-cyan-electric/30' : 'text-slate-muted hover:text-slate-ash'}`}
                  >
                    <Zap className="h-3.5 w-3.5" /> Single-Asset Zap
                  </button>
                </div>
              </div>
            )}

            {/* Terminal Body */}
            <div className="p-6 flex flex-col flex-1">
              
              {activeTab === 'deposit' ? (
                /* Asset Input Terminal (Deposit) */
                <div className="mb-6 space-y-3">
                  {isZapMode ? (
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-muted uppercase">Zap Deposit</span>
                        <span className="text-[10px] text-slate-muted font-mono">
                          Bal: {(isZapTokenA ? tokenAWalletBalance : tokenBWalletBalance).toLocaleString()}
                        </span>
                      </div>
                      <div className={`flex items-center gap-2 px-4 py-3.5 rounded-xl border transition-all duration-200 ${
                        parsedZapAmount > 0 ? ((isZapTokenA && isAInsufficient) || (!isZapTokenA && isBInsufficient) ? 'border-red-500/40 bg-red-500/5' : 'border-cyan-electric/40 bg-cyan-electric/5') : 'border-white/[0.08] bg-[#050A14]'
                      }`}>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={zapAmount}
                          onChange={e => { if (depositStep !== 'success') setZapAmount(e.target.value) }}
                          className={`flex-1 bg-transparent text-xl font-bold placeholder:text-slate-muted outline-none tabular-nums min-w-0 ${((isZapTokenA && isAInsufficient) || (!isZapTokenA && isBInsufficient)) ? 'text-red-400' : 'text-slate-platinum'}`}
                          disabled={depositStep !== 'idle'}
                        />
                        <div className="flex items-center gap-2 flex-shrink-0 border-l border-white/[0.1] pl-3 ml-2">
                          <select 
                            value={zapToken} 
                            onChange={(e) => setZapToken(e.target.value)}
                            className="bg-transparent text-slate-platinum text-sm font-bold outline-none cursor-pointer appearance-none pr-4"
                            disabled={depositStep !== 'idle'}
                          >
                            <option value={vault.tokenA} className="bg-navy-900">{vault.tokenA}</option>
                            <option value={vault.tokenB} className="bg-navy-900">{vault.tokenB}</option>
                          </select>
                          <ChevronDown className="absolute right-4 h-3.5 w-3.5 text-slate-muted pointer-events-none" />
                        </div>
                      </div>

                      {/* Zap Math Preview */}
                      {parsedZapAmount > 0 && (
                        <div className="mt-4 p-4 rounded-xl bg-[#0A0F1C]/50 border border-white/[0.05] flex flex-col gap-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-muted font-medium">Auto-Split (50%)</span>
                            <span className="text-slate-platinum font-mono">{retainedAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {zapToken}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-muted font-medium">DEX Swap (50%)</span>
                            <span className="text-slate-ash font-mono">{swapAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {zapToken} → {swapOutputRaw.toLocaleString(undefined, { maximumFractionDigits: 4 })} {isZapTokenA ? vault.tokenB : vault.tokenA}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-muted font-medium">Protocol Fee (0.3%)</span>
                            <span className="text-red-400 font-mono">-{swapFee.toLocaleString(undefined, { maximumFractionDigits: 4 })} {isZapTokenA ? vault.tokenB : vault.tokenA}</span>
                          </div>
                          <div className="h-px w-full bg-white/[0.05] my-1" />
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-cyan-electric">Final Pool Entry</span>
                            <span className="text-cyan-electric font-mono text-[10px]">
                              {finalDepositA.toLocaleString(undefined, { maximumFractionDigits: 4 })} {vault.tokenA} + {finalDepositB.toLocaleString(undefined, { maximumFractionDigits: 4 })} {vault.tokenB}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                {activeTab === 'withdraw' && (  <>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-ash uppercase tracking-wider">LP Pair Ratios</span>
                        <span className="text-xs text-slate-muted font-mono bg-white/[0.05] px-2 py-0.5 rounded-md">
                          1 {vault.tokenA} = {ratio} {vault.tokenB}
                        </span>
                      </div>
                      
                      {/* Token A Input */}
                      <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-slate-muted uppercase">Token A</span>
                          <span className="text-[10px] text-slate-muted font-mono">
                            Bal: {activeTab === 'deposit' ? tokenAWalletBalance.toLocaleString() : userVaultBalanceTokenA.toLocaleString()}
                          </span>
                        </div>
                        <div className={`flex items-center gap-2 px-4 py-3.5 rounded-xl border transition-all duration-200 ${
                          parsedAmountA > 0 ? (activeTab === 'deposit' && isAInsufficient ? 'border-red-500/40 bg-red-500/5' : (activeTab === 'deposit' ? 'border-cyan-electric/40 bg-cyan-electric/5' : 'border-azure/40 bg-azure/5')) : 'border-white/[0.08] bg-[#050A14]'
                        }`}>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={amountA}
                            onChange={e => { if (depositStep !== 'success') handleAmountAChange(e.target.value) }}
                            className={`flex-1 bg-transparent text-xl font-bold placeholder:text-slate-muted outline-none tabular-nums min-w-0 ${isAInsufficient ? 'text-red-400' : 'text-slate-platinum'}`}
                            disabled={depositStep !== 'idle'}
                          />
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <img src={vault.tokenAIcon} className="w-5 h-5 rounded-full bg-[#0A0F1C]" alt={vault.tokenA} />
                            <span className="text-slate-platinum text-sm font-bold">{vault.tokenA}</span>
                          </div>
                        </div>
                      </div>

                      {/* Token B Input */}
                      <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-slate-muted uppercase">Token B</span>
                          <span className="text-[10px] text-slate-muted font-mono">
                            Bal: {activeTab === 'deposit' ? tokenBWalletBalance.toLocaleString() : userVaultBalanceTokenB.toLocaleString()}
                          </span>
                        </div>
                        <div className={`flex items-center gap-2 px-4 py-3.5 rounded-xl border transition-all duration-200 ${
                          parsedAmountB > 0 ? (activeTab === 'deposit' && isBInsufficient ? 'border-red-500/40 bg-red-500/5' : (activeTab === 'deposit' ? 'border-cyan-electric/40 bg-cyan-electric/5' : 'border-azure/40 bg-azure/5')) : 'border-white/[0.08] bg-[#050A14]'
                        }`}>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={amountB}
                            onChange={e => { if (depositStep !== 'success') handleAmountBChange(e.target.value) }}
                            className={`flex-1 bg-transparent text-xl font-bold placeholder:text-slate-muted outline-none tabular-nums min-w-0 ${isBInsufficient ? 'text-red-400' : 'text-slate-platinum'}`}
                            disabled={depositStep !== 'idle'}
                          />
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <img src={vault.tokenBIcon} className="w-5 h-5 rounded-full bg-[#0A0F1C]" alt={vault.tokenB} />
                            <span className="text-slate-platinum text-sm font-bold">{vault.tokenB}</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  {/* Fraction Pill Row (Deposit) */}
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
              ) : (
                /* Withdrawal Slider Terminal */
                <div className="mb-6 space-y-4 animate-in fade-in">
                  {/* Glowing Metric */}
                  <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#050A14] border border-azure/20 shadow-azure-glow relative overflow-hidden">
                    <div className="absolute inset-0 bg-azure/5 blur-xl"></div>
                    <span className="text-xs font-bold text-azure uppercase tracking-widest mb-1 relative z-10">Value to Withdraw</span>
                    <span className="text-3xl text-slate-platinum font-bold tabular-nums relative z-10">
                      ${valueToWithdrawUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Slider Control */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-muted">
                      <span>0%</span>
                      <span className="text-azure">{Math.round(withdrawPercent * 100)}%</span>
                      <span>100%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="1" step="0.01" 
                      value={withdrawPercent} 
                      onChange={(e) => setWithdrawPercent(parseFloat(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none bg-white/[0.05] outline-none cursor-pointer"
                      disabled={depositStep !== 'idle'}
                      style={{
                        background: `linear-gradient(to right, #1A6FFF ${withdrawPercent * 100}%, rgba(255,255,255,0.05) ${withdrawPercent * 100}%)`
                      }}
                    />
                    
                    {/* Fraction Pill Row (Withdraw) */}
                    <div className="flex items-center gap-2 mt-2">
                      {fractionOptions.map(pct => (
                        <button
                          key={pct}
                          onClick={() => handleFraction(pct)}
                          disabled={depositStep !== 'idle'}
                          className={`flex-1 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${withdrawPercent === pct ? 'border-azure/50 bg-azure/20 text-azure' : 'border-white/[0.05] bg-white/[0.02] text-slate-ash hover:bg-white/[0.05] hover:text-slate-platinum'}`}
                        >
                          {pct === 1.0 ? 'MAX' : `${pct * 100}%`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mode Switcher */}
                  <div className="pt-2">
                    <div className="flex bg-[#050A14] p-1 rounded-xl border border-white/[0.05]">
                      <button 
                        onClick={() => setWithdrawMode('dual')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${withdrawMode === 'dual' ? 'bg-white/[0.1] text-white shadow-sm' : 'text-slate-muted hover:text-slate-ash'}`}
                      >
                        Dual Asset (50/50)
                      </button>
                      <button 
                        onClick={() => setWithdrawMode('zap')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${withdrawMode === 'zap' ? 'bg-azure/20 text-azure shadow-sm border border-azure/30' : 'text-slate-muted hover:text-slate-ash'}`}
                      >
                        <Zap className="h-3.5 w-3.5" /> Single-Asset Zap
                      </button>
                    </div>
                  </div>

                  {/* Withdraw Receipt */}
                  {withdrawPercent > 0 && (
                    <div className="mt-2 p-4 rounded-xl bg-[#0A0F1C]/50 border border-white/[0.05] flex flex-col gap-2">
                      {isWithdrawZapMode ? (
                        <>
                          <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/[0.05]">
                            <span className="text-xs font-bold text-slate-muted">Receive Token</span>
                            <div className="relative">
                              <select 
                                value={withdrawZapToken} 
                                onChange={(e) => setWithdrawZapToken(e.target.value)}
                                className="bg-transparent text-azure text-xs font-bold outline-none cursor-pointer appearance-none pr-4 text-right"
                                disabled={depositStep !== 'idle'}
                              >
                                <option value={vault.tokenA} className="bg-navy-900">{vault.tokenA}</option>
                                <option value={vault.tokenB} className="bg-navy-900">{vault.tokenB}</option>
                              </select>
                              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-azure pointer-events-none" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-muted font-medium">Auto-Split (50%)</span>
                            <span className="text-slate-platinum font-mono">{withdrawRetainedAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {withdrawZapToken}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-muted font-medium">DEX Swap (50%)</span>
                            <span className="text-slate-ash font-mono">{withdrawSwapAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {isWithdrawZapTokenA ? vault.tokenB : vault.tokenA} → {withdrawSwapOutputRaw.toLocaleString(undefined, { maximumFractionDigits: 4 })} {withdrawZapToken}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-muted font-medium">Protocol Fee (0.3%)</span>
                            <span className="text-red-400 font-mono">-{withdrawSwapFee.toLocaleString(undefined, { maximumFractionDigits: 4 })} {withdrawZapToken}</span>
                          </div>
                          <div className="h-px w-full bg-white/[0.05] my-1" />
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-azure">Net Output</span>
                            <span className="text-azure font-mono text-[10px]">
                              {finalWithdrawToken.toLocaleString(undefined, { maximumFractionDigits: 4 })} {withdrawZapToken}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between text-xs font-bold mb-1">
                            <span className="text-slate-ash">Dual Asset Return</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-muted font-medium">{vault.tokenA} Portion</span>
                            <span className="text-slate-platinum font-mono">{withdrawA.toLocaleString(undefined, { maximumFractionDigits: 4 })} {vault.tokenA}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-muted font-medium">{vault.tokenB} Portion</span>
                            <span className="text-slate-platinum font-mono">{withdrawB.toLocaleString(undefined, { maximumFractionDigits: 4 })} {vault.tokenB}</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

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
   SUBCOMPONENT: RECENT ACTIVITY
═══════════════════════════════════════════════════════════ */
function RecentActivity() {
  const { transactions } = useTransactions()

  return (
    <div className="flex flex-col rounded-2xl border border-white/[0.05] bg-[#0A0F1C]/60 overflow-hidden shadow-[0_4px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)] animate-in fade-in mt-6">
      <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
        <h3 className="text-slate-platinum font-semibold flex items-center gap-2 text-sm">
          <History className="h-4 w-4 text-slate-ash" /> Recent Activity
        </h3>
      </div>
      
      <div className="flex flex-col min-h-[120px]">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-10 gap-3">
            <div className="w-12 h-12 rounded-full border border-white/[0.05] bg-white/[0.02] flex items-center justify-center">
              <History className="h-5 w-5 text-slate-muted/50" />
            </div>
            <p className="text-slate-muted text-sm">No recent transactions found on this account.</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-white/[0.03]">
            {transactions.map(tx => {
              const isDeposit = tx.type === 'deposit';
              const vault = vaults.find(v => v.id === tx.vaultId);
              
              const msAgo = Date.now() - tx.timestamp;
              let relativeTime = 'Just now';
              if (msAgo > 60000) relativeTime = `${Math.floor(msAgo / 60000)} mins ago`;
              if (msAgo > 3600000) relativeTime = `${Math.floor(msAgo / 3600000)} hours ago`;

              return (
                <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center border ${isDeposit ? 'bg-cyan-electric/10 border-cyan-electric/20 text-cyan-electric' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                      {isDeposit ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-platinum font-bold text-sm">
                        {isDeposit ? (tx.amounts.length === 1 ? 'Zap Deposit to ' : 'Deposit to ') : 'Withdrawal from '} {vault?.pairLabel}
                      </span>
                      <span className="text-slate-muted text-xs mt-0.5">{tx.id.split('@')[0]}...</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <span className="hidden sm:block text-slate-ash text-xs font-medium">{relativeTime}</span>
                    <div className="flex flex-col items-end">
                      <span className={`font-mono text-sm font-bold ${isDeposit ? 'text-cyan-electric' : 'text-emerald-400'}`}>
                        {isDeposit ? '-' : '+'}{tx.amounts[0].quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })} {tx.amounts[0].asset}
                      </span>
                      {tx.amounts[1] && (
                        <span className={`font-mono text-xs ${isDeposit ? 'text-cyan-electric/70' : 'text-emerald-400/70'}`}>
                          {isDeposit ? '-' : '+'}{tx.amounts[1].quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })} {tx.amounts[1].asset}
                        </span>
                      )}
                    </div>
                    <a href={tx.hash} target="_blank" rel="noreferrer" className="hidden sm:flex flex-shrink-0 items-center justify-center w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.05] text-slate-ash hover:text-white hover:bg-white/[0.08] transition-colors">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SUBCOMPONENT: PORTFOLIO VIEW
═══════════════════════════════════════════════════════════ */
function PortfolioView({ isConnected, onManageClick }: { isConnected: boolean, onManageClick: (id: string) => void }) {
  const { walletBalance, activePositions, totalPendingYield } = usePortfolio()
  
  // Total Value Deposited (Mocking USD value for demo)
  const totalDeposited = activePositions.reduce((sum, pos) => {
    const principalAmount = (Number(pos.tokenAAmount || 0) + Number(pos.tokenBAmount || 0)) * 0.5;
    return sum + principalAmount;
  }, 0);
  
  // Net Compounded APY
  const weightedApy = totalDeposited > 0 
    ? activePositions.reduce((acc, pos) => {
        const principalAmount = (Number(pos.tokenAAmount || 0) + Number(pos.tokenBAmount || 0)) * 0.5;
        return acc + (Number(pos.baseApr || 0) * (principalAmount / totalDeposited));
      }, 0)
    : 0;

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
        <div className="flex flex-col gap-1.5 p-4 rounded-xl border border-white/[0.05] bg-white/[0.02]">
          <div className="flex items-center gap-1.5 text-slate-muted">
            <DollarSign className="h-3.5 w-3.5" />
            <span className="text-xs">Total Value Deposited</span>
          </div>
          <span className="text-xl font-bold tabular-nums text-slate-platinum">
            ${totalDeposited.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex flex-col gap-1.5 p-4 rounded-xl border border-white/[0.05] bg-white/[0.02]">
          <div className="flex items-center gap-1.5 text-slate-muted">
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="text-xs">Net Compounded APY</span>
          </div>
          <span className="text-xl font-bold tabular-nums text-slate-platinum">
            {weightedApy.toFixed(2)}%
          </span>
        </div>
        <div className="flex flex-col gap-1.5 p-4 rounded-xl border border-white/[0.05] bg-white/[0.02]">
          <div className="flex items-center gap-1.5 text-slate-muted">
            <TrendingUp className="h-3.5 w-3.5 text-cyan-electric" />
            <span className="text-xs text-cyan-electric">Real-Time Yield Earned</span>
          </div>
          <StreamingYield initialYield={totalPendingYield} />
        </div>
      </div>

      {activePositions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8 py-10">
          <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
            <Droplets className="h-5 w-5 text-slate-muted" />
          </div>
          <p className="text-slate-ash text-sm">No active positions yet.</p>
          <p className="text-slate-muted text-xs max-w-xs">
            Deposit into a vault from the Markets tab to start earning compounded yield.
          </p>
        </div>
      ) : (
        <div className="flex flex-col p-5 gap-4">
          {activePositions.map(pos => {
            const vault = vaults.find(v => v.id === pos.vaultId)!
            if (!vault) return null
            return (
              <VaultCard 
                key={pos.vaultId} 
                vault={{ ...vault, userBalance: pos.depositedAmount }} 
                onManageClick={() => onManageClick(vault.id)} 
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SUBCOMPONENT: DASHBOARD HEADER
═══════════════════════════════════════════════════════════ */
function DashHeader({
  activeTab,
  onTabChange,
  onOpenModal,
}: {
  activeTab:       TabId
  onTabChange:     (t: TabId) => void
  onOpenModal:     () => void
}) {
  const navigate     = useNavigate()
  const [imgError, setImgError] = useState(false)
  const { isLive } = useProtocol()
  const { isConnected, address, balances, disconnect } = useHederaWallet()

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
        {(['markets', 'portfolio', 'governance', 'points', 'faucet'] as TabId[]).map(tab => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`px-6 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all duration-200 ${
              activeTab === tab ? 'bg-azure text-white shadow-azure-glow' : 'text-slate-ash hover:text-slate-platinum'
            }`}
          >
            {tab === 'points' ? 'Airdrop' : tab}
          </button>
        ))}
      </div>

      {/* Right: Wallet */}
      <div className="flex items-center gap-3">
        {/* Live Network Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.05] bg-white/[0.02]">
          {isLive ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E5FF] opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00E5FF]"></span>
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-300 tracking-widest uppercase mt-0.5">Mainnet Sync: Live</span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              <span className="text-[10px] font-mono font-bold text-slate-400 tracking-widest uppercase mt-0.5">Local Node: Mocked</span>
            </>
          )}
        </div>
        
        <button 
          onClick={() => {
            if (window.confirm('WARNING: This will wipe all saved wallet data. Continue?')) {
              localStorage.clear();
              disconnect();
              window.location.reload();
            }
          }}
          className="hidden lg:flex items-center justify-center p-1.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
          title="Hard Reset Demo"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>

        <select 
          className="md:hidden bg-white/[0.02] border border-white/[0.06] text-slate-platinum text-xs rounded-lg px-2 py-2 outline-none appearance-none"
          value={activeTab}
          onChange={(e) => onTabChange(e.target.value as TabId)}
        >
          <option value="markets" className="bg-navy-900">Markets</option>
          <option value="portfolio" className="bg-navy-900">Portfolio</option>
          <option value="governance" className="bg-navy-900">Governance</option>
          <option value="points" className="bg-navy-900">Airdrop</option>
          <option value="faucet" className="bg-navy-900">Faucet</option>
        </select>

        {isConnected && address ? (
          <HederaProfilePill 
            address={address} 
            hbarBalance={balances.HBAR} 
            onDisconnect={disconnect} 
          />
        ) : (
          <button
            onClick={onOpenModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 border border-azure/30 bg-azure/10 text-azure hover:bg-azure/15 hover:border-azure/50"
          >
            <Wallet className="h-3.5 w-3.5" />
            <span className="font-mono hidden sm:inline">
              Connect Wallet
            </span>
          </button>
        )}
      </div>
    </header>
  )
}

/* ═══════════════════════════════════════════════════════════
   ROOT: DASHBOARD TERMINAL
═══════════════════════════════════════════════════════════ */
import { useLocation } from 'react-router-dom';
import FaucetView from '../components/FaucetView';
import GovernanceView from '../components/GovernanceView';
import PointsView from '../components/PointsView';

export default function DashboardTerminal() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Extract tab from URL (/app/tab)
  const urlTab = location.pathname.split('/')[2] as TabId
  const activeTab: TabId = ['markets', 'portfolio', 'governance', 'faucet', 'points'].includes(urlTab) ? urlTab : 'markets'

  const [isModalOpen,     setIsModalOpen]     = useState(false)
  
  const [searchQuery,     setSearchQuery]     = useState('')
  const [showMyPositions, setShowMyPositions] = useState(false)
  const [sortBy,          setSortBy]          = useState<SortConfig>('tvl-desc')
  
  // STATE REFUSAL: Main layout controller
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null)

  const { isConnected, isConnecting, connect } = useHederaWallet()
  const { activePositions } = usePortfolio()
  const { awardPoints } = usePoints()
  const { vaults } = useProtocol()

  const handleConnect = async (providerId: any) => {
    await connect(providerId)
    setIsModalOpen(false)
    awardPoints(100, "Wallet Connected")
  }

  const processedVaults = useMemo(() => {
    let result = [...vaults]
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase()
      result = result.filter(v => v.pairLabel.toLowerCase().includes(q) || v.tokenA.toLowerCase().includes(q) || v.tokenB.toLowerCase().includes(q))
    }
    if (showMyPositions) {
      result = result.filter(v => {
        const pos = activePositions.find(p => p.vaultId === v.id);
        return pos && (pos.tokenAAmount > 0 || pos.tokenBAmount > 0);
      })
    }
    result.sort((a, b) => {
      switch (sortBy) {
        case 'apy-desc': return b.rheoApy - a.rheoApy
        case 'apy-asc':  return a.rheoApy - b.rheoApy
        case 'tvl-desc': return b.tvlUsd - a.tvlUsd
        case 'balance-desc': {
          const posA = activePositions.find(p => p.vaultId === a.id)
          const posB = activePositions.find(p => p.vaultId === b.id)
          const valA = posA ? (posA.tokenAAmount + posA.tokenBAmount) : 0
          const valB = posB ? (posB.tokenAAmount + posB.tokenBAmount) : 0
          return valB - valA
        }
        default: return 0
      }
    })
    return result
  }, [searchQuery, showMyPositions, sortBy])

  // Locate current vault object if active
  const activeVault = vaults.find(v => v.id === selectedVaultId)

  return (
    <div
      className="h-screen w-screen flex flex-col bg-navy-950 text-slate-platinum font-sans antialiased overflow-hidden relative"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cpath d='M 80 0 L 0 0 0 80' fill='none' stroke='rgba(255,255,255,0.018)' stroke-width='1'/%3E%3C/svg%3E")`
      }}
    >
      <DashHeader
        activeTab={activeTab}
        onTabChange={(t) => { 
          navigate(`/app/${t}`)
          setSelectedVaultId(null) 
        }}
        onOpenModal={() => setIsModalOpen(true)}
      />

      <WalletConnectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnect={handleConnect}
        isConnecting={isConnecting}
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
                  <PortfolioView isConnected={isConnected} onManageClick={setSelectedVaultId} />
                </div>
              )}

              {activeTab === 'faucet' && (
                <FaucetView />
              )}

              {activeTab === 'governance' && (
                <GovernanceView />
              )}

              {activeTab === 'points' && (
                <PointsView />
              )}

              <RecentActivity />

              {/* Bottom status strip */}
            {/* Bottom status strip */}
              <div className="flex items-center justify-between text-[11px] text-slate-muted px-2">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-azure/60" /> {vaults.length} vaults · SaucerSwap V2</span>
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
