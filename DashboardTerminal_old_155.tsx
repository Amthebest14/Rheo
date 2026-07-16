/**
 * DashboardTerminal.tsx — Rheo Finance Web3 Dashboard Engine
 * Route: /app
 *
 * Layout: 100vh locked terminal — no outer scroll.
 * Sections:
 *   - DashHeader:    logo | Markets/Portfolio tabs | stateful Connect Wallet
 *   - MarketsGrid:   vault data table with hover states
 *   - PortfolioView: user positions placeholder
 *   - VaultDrawer:   glassmorphic slide-in modal with deposit flow
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Settings,
  Loader2,
  Wallet,
  X,
  ChevronDown,
  TrendingUp,
  DollarSign,
  Droplets,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Clock,
  Zap,
} from 'lucide-react'
import { VAULTS, SLIPPAGE_OPTIONS, formatTVL, type VaultRow, type SlippageOption } from '../config/vaultData'

/* ═══════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════ */
type TabId          = 'markets' | 'portfolio'
type WalletState    = 'idle' | 'connecting' | 'connected'
type DepositStep    = 'idle' | 'approve' | 'signing' | 'success' | 'error'

/* ═══════════════════════════════════════════════════════════
   SUBCOMPONENT: TOKEN PAIR ICON
═══════════════════════════════════════════════════════════ */
function TokenPair({ vault }: { vault: VaultRow }) {
  return (
    <div className="flex items-center gap-3">
      {/* Stacked circles */}
      <div className="relative w-10 h-6 flex-shrink-0">
        <div
          className="absolute left-0 top-0 w-6 h-6 rounded-full border-2 border-[#0A0F1C] flex items-center justify-center text-[9px] font-black"
          style={{ backgroundColor: vault.colorA + '30', borderColor: vault.colorA + '50', color: vault.colorA }}
        >
          {vault.tokenA.slice(0, 1)}
        </div>
        <div
          className="absolute left-3.5 top-0 w-6 h-6 rounded-full border-2 border-[#0A0F1C] flex items-center justify-center text-[9px] font-black"
          style={{ backgroundColor: vault.colorB + '30', borderColor: vault.colorB + '50', color: vault.colorB }}
        >
          {vault.tokenB.slice(0, 1)}
        </div>
      </div>
      <div>
        <p className="text-slate-platinum text-sm font-semibold leading-none">
          {vault.pairLabel}
        </p>
        <p className="text-slate-muted text-xs mt-0.5">SaucerSwap V2</p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SUBCOMPONENT: APY BADGE
═══════════════════════════════════════════════════════════ */
function ApyBadge({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-cyan-electric font-bold text-sm tabular-nums cyan-glow-text">
      <TrendingUp className="h-3.5 w-3.5" />
      {value.toFixed(1)}%
    </span>
  )
}

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

  /* Close on outside click */
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
      className="absolute right-0 top-8 z-50 w-52 rounded-xl border border-white/[0.08] bg-[#0D1526]/95 backdrop-blur-xl shadow-card p-3"
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
            id={`slippage-${opt}`}
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
   SUBCOMPONENT: DEPOSIT DRAWER / MODAL
═══════════════════════════════════════════════════════════ */
function VaultDrawer({
  vault,
  onClose,
}: {
  vault: VaultRow
  onClose: () => void
}) {
  const [amount, setAmount]               = useState('')
  const [slippage, setSlippage]           = useState<SlippageOption>('0.5')
  const [showSlippage, setShowSlippage]   = useState(false)
  const [depositStep, setDepositStep]     = useState<DepositStep>('idle')
  const [mounted, setMounted]             = useState(false)

  /* Slide-in animation */
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(t)
  }, [])

  /* Close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const parsedAmount  = parseFloat(amount) || 0
  const hasAmount     = parsedAmount > 0
  const isMaxed       = parsedAmount >= vault.userBalance
  const receiveShares = (parsedAmount * 0.9732).toFixed(4) // simulated share price

  /* Async deposit state machine */
  const handleAction = async () => {
    if (!hasAmount || depositStep !== 'idle') return

    // Step 1: Approve
    setDepositStep('approve')
    await new Promise(r => setTimeout(r, 1800))

    // Step 2: Awaiting signature
    setDepositStep('signing')
    await new Promise(r => setTimeout(r, 2200))

    // Step 3: Success
    setDepositStep('success')
  }

  const handleReset = () => {
    setDepositStep('idle')
    setAmount('')
  }

  /* Action button config */
  const actionConfig = {
    idle:    { label: 'Approve Token',       color: 'btn-primary', disabled: !hasAmount },
    approve: { label: 'Approving…',          color: 'btn-primary', disabled: true       },
    signing: { label: 'Awaiting Signature…', color: 'btn-primary', disabled: true       },
    success: { label: 'Deposit Successful',  color: 'btn-primary', disabled: false      },
    error:   { label: 'Transaction Failed',  color: 'btn-outline', disabled: false      },
  }[depositStep]

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-end"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Dim overlay */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Drawer panel */}
      <div
        className={`relative z-10 h-full w-full max-w-md flex flex-col
          border-l border-white/[0.06] bg-[#080D1A]/95 backdrop-blur-xl
          transition-transform duration-300 ease-out
          ${mounted ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* ── Drawer Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <TokenPair vault={vault} />
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-muted hover:text-slate-ash hover:bg-white/[0.05] transition-all"
            id="drawer-close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Vault stats summary */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Rheo APY',  value: `${vault.rheoApy.toFixed(1)}%`, highlight: true },
              { label: 'Base APR',  value: `${vault.baseApr.toFixed(1)}%`,  highlight: false },
              { label: 'TVL',       value: formatTVL(vault.tvlUsd),          highlight: false },
            ].map(({ label, value, highlight }) => (
              <div
                key={label}
                className="flex flex-col items-center p-3 rounded-xl border border-white/[0.05] bg-white/[0.02] text-center"
              >
                <span className={`text-base font-bold tabular-nums ${highlight ? 'text-cyan-electric cyan-glow-text' : 'text-slate-platinum'}`}>
                  {value}
                </span>
                <span className="text-slate-muted text-[10px] mt-0.5">{label}</span>
              </div>
            ))}
          </div>

          {/* Compound frequency badge */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-azure/5 border border-azure/10">
            <Zap className="h-3.5 w-3.5 text-azure flex-shrink-0" />
            <p className="text-xs text-slate-ash">
              Auto-compounded every <span className="text-azure font-semibold">60 minutes</span> · $0.0001 gas per cycle
            </p>
          </div>

          {/* ── Amount Input ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-slate-ash text-xs font-semibold uppercase tracking-wider">
                Deposit Amount
              </label>
              <span className="text-slate-muted text-xs">
                Balance:{' '}
                <button
                  className="text-azure hover:text-azure-light transition-colors font-mono font-semibold"
                  onClick={() => setAmount(vault.userBalance.toFixed(2))}
                  id="max-balance-btn"
                >
                  {vault.userBalance.toLocaleString()} {vault.tokenA}
                </button>
              </span>
            </div>

            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200 ${
              hasAmount
                ? 'border-azure/40 bg-azure/5 shadow-azure-glow/20'
                : 'border-white/[0.08] bg-white/[0.02]'
            }`}>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={e => {
                  if (depositStep === 'success') return
                  const v = e.target.value
                  if (v === '' || parseFloat(v) >= 0) setAmount(v)
                }}
                className="flex-1 bg-transparent text-slate-platinum text-lg font-semibold placeholder:text-slate-muted outline-none tabular-nums min-w-0"
                id="deposit-amount-input"
                disabled={depositStep !== 'idle'}
              />
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-slate-ash text-sm font-medium">{vault.tokenA}</span>
                <button
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-150 ${
                    isMaxed
                      ? 'bg-azure/20 text-azure'
                      : 'bg-white/[0.06] text-slate-ash hover:bg-azure/15 hover:text-azure'
                  }`}
                  onClick={() => setAmount(vault.userBalance.toFixed(2))}
                  id="max-btn"
                  disabled={depositStep !== 'idle'}
                >
                  MAX
                </button>
              </div>
            </div>

            {/* USD estimate */}
            {hasAmount && (
              <p className="text-slate-muted text-xs mt-1.5 ml-1 font-mono">
                ≈ ${(parsedAmount * 0.0742).toFixed(2)} USD
                {/* [LIVE] Replace 0.0742 with live HBAR/USD price from Hedera Mirror Node price feed */}
              </p>
            )}
          </div>

          {/* ── Receive estimate ── */}
          {hasAmount && (
            <div className="p-3.5 rounded-xl border border-white/[0.05] bg-white/[0.015] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-ash">You receive (rHBAR-USDC shares)</span>
                <span className="text-slate-platinum font-mono font-semibold">{receiveShares}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-ash">Slippage tolerance</span>
                <span className="text-slate-platinum font-mono">{slippage}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-ash">Network fee (est.)</span>
                <span className="text-emerald-400 font-mono">$0.0001</span>
              </div>
            </div>
          )}

          {/* ── Success State ── */}
          {depositStep === 'success' && (
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col items-center gap-3 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              <div>
                <p className="text-emerald-400 font-bold text-sm">Deposit Successful!</p>
                <p className="text-slate-ash text-xs mt-1">
                  Your position is now auto-compounding at{' '}
                  <span className="text-cyan-electric font-semibold">{vault.rheoApy.toFixed(1)}% APY</span>.
                </p>
              </div>
              <div className="text-xs text-slate-muted font-mono">
                {/* [LIVE] Replace with actual Hedera transaction hash from receipt */}
                Tx: <span className="text-slate-ash">[ PLUG IN: Hedera TX hash ]</span>
              </div>
              <button
                onClick={handleReset}
                className="btn-outline text-xs px-4 py-2"
                id="deposit-again-btn"
              >
                Deposit Again
              </button>
            </div>
          )}

          {/* ── Error State ── */}
          {depositStep === 'error' && (
            <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-semibold text-sm">Transaction Failed</p>
                <p className="text-slate-ash text-xs mt-1">
                  The transaction was rejected or timed out. Check your wallet and try again.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Drawer Footer: Slippage + Action ── */}
        <div className="px-6 py-4 border-t border-white/[0.06] space-y-3">

          {/* Slippage row */}
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-muted">
              <Clock className="h-3.5 w-3.5" />
              <span>Slippage: <span className="text-slate-ash font-semibold">{slippage}%</span></span>
            </div>
            <button
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-ash hover:text-slate-platinum hover:bg-white/[0.05] transition-all text-xs"
              onClick={() => setShowSlippage(v => !v)}
              id="slippage-settings-btn"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
              <ChevronDown className={`h-3 w-3 transition-transform ${showSlippage ? 'rotate-180' : ''}`} />
            </button>
            {showSlippage && (
              <SlippagePopover
                selected={slippage}
                onChange={setSlippage}
                onClose={() => setShowSlippage(false)}
              />
            )}
          </div>

          {/* Primary action button */}
          <button
            onClick={handleAction}
            disabled={actionConfig.disabled}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2
              ${depositStep === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                : !hasAmount
                  ? 'bg-white/[0.04] text-slate-muted border border-white/[0.06] opacity-50 grayscale cursor-not-allowed'
                  : 'bg-azure hover:bg-azure-light text-white border border-azure-light/30 hover:shadow-azure-glow hover:-translate-y-0.5'
              }
              ${(depositStep === 'approve' || depositStep === 'signing') ? 'opacity-70 cursor-wait' : ''}
            `}
            id="deposit-action-btn"
          >
            {(depositStep === 'approve' || depositStep === 'signing') && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {depositStep === 'success' && <CheckCircle2 className="h-4 w-4" />}
            {actionConfig.label}
          </button>

          {/* Contract address reference */}
          <p className="text-center text-[10px] text-slate-muted font-mono truncate">
            Vault: <span className="text-slate-border/60">{vault.contractAddress}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SUBCOMPONENT: MARKETS TABLE
═══════════════════════════════════════════════════════════ */
function MarketsGrid({ onSelectVault }: { onSelectVault: (v: VaultRow) => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Table header */}
      <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/[0.05]">
        <span className="col-span-4 text-slate-muted text-xs font-semibold uppercase tracking-widest">Vault</span>
        <span className="col-span-2 text-slate-muted text-xs font-semibold uppercase tracking-widest text-right">Base APR</span>
        <span className="col-span-3 text-slate-muted text-xs font-semibold uppercase tracking-widest text-right">Rheo APY</span>
        <span className="col-span-3 text-slate-muted text-xs font-semibold uppercase tracking-widest text-right">TVL</span>
      </div>

      {/* Table rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
        {VAULTS.map((vault, i) => (
          <button
            key={vault.id}
            className="w-full grid grid-cols-12 gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors duration-150 group text-left"
            onClick={() => onSelectVault(vault)}
            id={`vault-row-${vault.id}`}
          >
            {/* Asset pair */}
            <div className="col-span-4 flex items-center">
              <TokenPair vault={vault} />
            </div>

            {/* Base APR */}
            <div className="col-span-2 flex items-center justify-end">
              <span className="text-slate-ash text-sm tabular-nums font-medium">
                {vault.baseApr.toFixed(1)}%
              </span>
            </div>

            {/* Rheo APY (highlighted) */}
            <div className="col-span-3 flex items-center justify-end">
              <ApyBadge value={vault.rheoApy} />
            </div>

            {/* TVL */}
            <div className="col-span-3 flex items-center justify-end gap-2">
              <span className="text-slate-platinum text-sm tabular-nums font-semibold">
                {formatTVL(vault.tvlUsd)}
              </span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-azure text-xs font-semibold">
                Deposit →
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Table footer info */}
      <div className="px-5 py-3 border-t border-white/[0.04] flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {VAULTS.length} active vaults · Hedera Testnet
        </div>
        <p className="text-slate-muted text-xs">
          {/* [LIVE] Replace with real-time last-updated block from Hedera Mirror Node */}
          APY computed hourly
        </p>
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
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-2">
          <Wallet className="h-7 w-7 text-slate-muted" />
        </div>
        <h3 className="text-slate-platinum font-semibold text-lg">Connect your wallet</h3>
        <p className="text-slate-ash text-sm max-w-xs leading-relaxed">
          Connect your Hedera wallet to view your active vault positions, pending yields,
          and compounding history.
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-muted mt-2">
          <AlertCircle className="h-3.5 w-3.5" />
          HashPack, Blade, and MetaMask Snap supported
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Portfolio summary row */}
      <div className="grid grid-cols-3 gap-3 p-5 border-b border-white/[0.05]">
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

      {/* Empty positions state */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
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
    <header className="flex-shrink-0 h-14 flex items-center justify-between px-5 border-b border-white/[0.05] bg-navy-950/80 backdrop-blur-md">

      {/* ── Left: Logo ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-muted hover:text-slate-ash transition-colors"
          id="dash-back-home"
          title="Back to home"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="w-px h-5 bg-white/[0.08]" />
        {!imgError ? (
          <img
            src="/src/assets/HASHPILOT (1).png"
            alt="Rheo Finance"
            className="w-32 h-auto object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-azure to-cyan-electric flex items-center justify-center">
              <Droplets className="h-3 w-3 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-slate-platinum font-bold text-sm">Rheo Finance</span>
          </div>
        )}
      </div>

      {/* ── Center: Tab Switcher ── */}
      <div className="flex items-center p-1 rounded-xl border border-white/[0.06] bg-white/[0.02]">
        {(['markets', 'portfolio'] as TabId[]).map(tab => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`px-5 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all duration-200 ${
              activeTab === tab
                ? 'bg-azure text-white shadow-azure-glow'
                : 'text-slate-ash hover:text-slate-platinum'
            }`}
            id={`tab-${tab}`}
          >
            {tab === 'markets' ? 'Markets' : 'Portfolio'}
          </button>
        ))}
      </div>

      {/* ── Right: Wallet Connect ── */}
      <button
        onClick={onConnectWallet}
        disabled={walletState === 'connecting'}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
          walletState === 'connected'
            ? 'border border-cyan-electric/40 bg-cyan-electric/5 text-cyan-electric shadow-cyan-glow'
            : walletState === 'connecting'
              ? 'border border-white/[0.08] bg-white/[0.04] text-slate-ash cursor-wait'
              : 'border border-azure/30 bg-azure/10 text-azure hover:bg-azure/15 hover:border-azure/50'
        }`}
        id="connect-wallet-btn"
      >
        {walletState === 'connecting' && (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        )}
        {walletState === 'connected' && (
          <span className="w-2 h-2 rounded-full bg-cyan-electric animate-pulse" />
        )}
        {walletState === 'idle' && (
          <Wallet className="h-3.5 w-3.5" />
        )}
        <span className="font-mono">
          {walletState === 'idle'       && 'Connect Wallet'}
          {walletState === 'connecting' && 'Connecting…'}
          {walletState === 'connected'  && walletAddress}
        </span>
      </button>
    </header>
  )
}

/* ═══════════════════════════════════════════════════════════
   ROOT: DASHBOARD TERMINAL
═══════════════════════════════════════════════════════════ */
export default function DashboardTerminal() {
  const [activeTab,     setActiveTab]     = useState<TabId>('markets')
  const [walletState,   setWalletState]   = useState<WalletState>('idle')
  const [walletAddress, setWalletAddress] = useState('')
  const [selectedVault, setSelectedVault] = useState<VaultRow | null>(null)

  /* ── Wallet connection simulation ── */
  const handleConnectWallet = async () => {
    if (walletState === 'connected') {
      /* Disconnect */
      setWalletState('idle')
      setWalletAddress('')
      return
    }
    if (walletState === 'connecting') return

    setWalletState('connecting')
    await new Promise(r => setTimeout(r, 2000))
    /* [LIVE] Replace this setTimeout with actual HashPack / Blade wallet connector:
     *   import { HashConnect } from 'hashconnect'
     *   const hashconnect = new HashConnect()
     *   const appData = { name: 'Rheo Finance', ... }
     *   await hashconnect.init(appData, 'testnet', false)
     *   const { topic, pairingString } = await hashconnect.connect()
     */
    setWalletAddress('0.0.1245...8af2')
    setWalletState('connected')
  }

  return (
    /* 100vh locked — no outer page scroll */
    <div
      className="h-screen w-screen flex flex-col bg-navy-950 text-slate-platinum font-sans antialiased overflow-hidden"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cpath d='M 80 0 L 0 0 0 80' fill='none' stroke='rgba(255,255,255,0.018)' stroke-width='1'/%3E%3C/svg%3E")`
      }}
    >
      {/* ── Dashboard Header ── */}
      <DashHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        walletState={walletState}
        walletAddress={walletAddress}
        onConnectWallet={handleConnectWallet}
      />

      {/* ── Main Content Area ── */}
      <div className="flex-1 overflow-hidden flex flex-col">

        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(ellipse, rgba(26,111,255,0.15) 0%, transparent 70%)' }}
          />
        </div>

        {/* Content panel */}
        <div className="relative z-10 flex-1 overflow-hidden max-w-5xl w-full mx-auto px-4 sm:px-6 py-5 flex flex-col gap-4">

          {/* Panel card */}
          <div className="flex-1 overflow-hidden rounded-2xl border border-white/[0.05] bg-white/[0.015] backdrop-blur-sm flex flex-col"
            style={{ boxShadow: '0 4px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)' }}
          >
            {/* Panel header bar */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                {activeTab === 'markets'
                  ? <BarChart3 className="h-4 w-4 text-azure" />
                  : <Wallet className="h-4 w-4 text-azure" />
                }
                <span className="text-slate-platinum text-sm font-semibold">
                  {activeTab === 'markets' ? 'Active Vaults' : 'Your Portfolio'}
                </span>
              </div>

              {/* Live indicator */}
              <div className="flex items-center gap-2 text-xs text-slate-muted">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Live · Hedera Testnet
              </div>
            </div>

            {/* Tab content — overflows internally */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'markets' && (
                <MarketsGrid onSelectVault={setSelectedVault} />
              )}
              {activeTab === 'portfolio' && (
                <PortfolioView isConnected={walletState === 'connected'} />
              )}
            </div>
          </div>

          {/* Bottom status strip */}
          <div className="flex items-center justify-between text-[11px] text-slate-muted px-1">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-azure/60" />
                {VAULTS.length} vaults · SaucerSwap V2
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-cyan-electric/60" />
                Keeper: ACTIVE
              </span>
            </div>
            <span className="font-mono">
              {/* [LIVE] Replace with injected build version from CI/CD */}
              v1.0.0-beta · Chain 0x128
            </span>
          </div>
        </div>
      </div>

      {/* ── Vault Deposit Drawer ── */}
      {selectedVault && (
        <VaultDrawer
          vault={selectedVault}
          onClose={() => setSelectedVault(null)}
        />
      )}
    </div>
  )
}
