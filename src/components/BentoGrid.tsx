/**
 * BentoGrid.tsx — The Mechanical Pipeline (Auto-Compounder Bento Box)
 * Asymmetric bento layout with 3 feature cards detailing the protocol lifecycle.
 */

import { useRef, useEffect, useState } from 'react'
import { Wallet, Timer, TrendingUp, ArrowRight, Zap, RefreshCw, BarChart3 } from 'lucide-react'
import { FEATURE_CARDS } from '../config/protocolData'

/* ── Icon registry ── */
const ICON_MAP: Record<string, React.ElementType> = {
  Wallet,
  Timer,
  TrendingUp,
}

/* ── Compound curve SVG ── */
function CompoundCurve() {
  return (
    <svg
      viewBox="0 0 200 80"
      className="w-full h-16 mt-4"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="curveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1A6FFF" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path
        d="M0,80 L0,70 C20,65 40,55 60,48 C80,41 90,38 110,30 C130,22 145,15 160,10 C175,5 190,3 200,2 L200,80 Z"
        fill="url(#areaGrad)"
      />
      {/* Curve line */}
      <path
        d="M0,70 C20,65 40,55 60,48 C80,41 90,38 110,30 C130,22 145,15 160,10 C175,5 190,3 200,2"
        stroke="url(#curveGrad)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Dots */}
      {[[0,70],[55,48],[110,30],[165,10],[200,2]].map(([x,y], i) => (
        <circle key={i} cx={x} cy={y} r="2.5" fill="#00E5FF" opacity="0.8" />
      ))}
    </svg>
  )
}

/* ── Pipeline flow SVG ── */
function PipelineFlow() {
  return (
    <div className="flex items-center gap-2 mt-5 flex-wrap">
      {['Harvest', 'Swap 50/50', 'Re-stake', 'Compound'].map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-azure/10 border border-azure/20">
            <span className="w-1.5 h-1.5 rounded-full bg-azure" />
            <span className="text-xs font-semibold text-azure">{step}</span>
          </div>
          {i < 3 && <ArrowRight className="h-3 w-3 text-slate-muted flex-shrink-0" />}
        </div>
      ))}
    </div>
  )
}

/* ── Timer display ── */
function HarvestTimer() {
  const [seconds, setSeconds] = useState(47)
  const [minutes, setMinutes] = useState(12)

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(s => {
        if (s <= 0) {
          setMinutes(m => (m <= 0 ? 59 : m - 1))
          return 59
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="mt-5 flex items-center gap-3">
      <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-electric/5 border border-cyan-electric/20">
        <RefreshCw className="h-3.5 w-3.5 text-cyan-electric animate-spin-slow" />
        <span className="text-cyan-electric font-mono font-bold text-lg tabular-nums">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>
      <div>
        <p className="text-slate-ash text-xs font-medium">Until next harvest</p>
        <p className="text-slate-muted text-xs">Keeper bot on standby</p>
      </div>
    </div>
  )
}

/* ── Intersection hook ── */
function useVisible(threshold = 0.15) {
  const ref  = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

/* ── Card 1: Deposit ── */
function DepositCard({ delay = 0 }: { delay?: number }) {
  const { ref, visible } = useVisible()
  const Icon = ICON_MAP[FEATURE_CARDS[0].icon]
  const card = FEATURE_CARDS[0]

  return (
    <div
      ref={ref}
      className={`bento-card group p-7 flex flex-col transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Step badge */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-azure/50 font-mono text-xs font-semibold tracking-widest">
          {card.step} / 03
        </span>
        <div className="w-10 h-10 rounded-xl bg-azure/10 border border-azure/20 flex items-center justify-center">
          <Icon className="h-5 w-5 text-azure" />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-slate-platinum font-bold text-xl leading-snug mb-3">
        {card.title}
      </h3>

      {/* Body */}
      <p className="text-slate-ash text-sm leading-relaxed flex-1">
        {card.body}
      </p>

      {/* Visual: vault deposit bar */}
      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-muted mb-1">
          <span>Vault Capacity</span>
          <span className="text-cyan-electric font-semibold">67.4%</span>
        </div>
        {['HBAR / USDC', 'HBAR / ETH', 'SAUCE / HBAR'].map((pool, i) => {
          const widths = ['67%', '48%', '82%']
          return (
            <div key={pool} className="flex items-center gap-2">
              <span className="text-xs text-slate-muted w-24 truncate">{pool}</span>
              <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-azure to-cyan-electric transition-all duration-1000"
                  style={{ width: visible ? widths[i] : '0%', transitionDelay: `${delay + 300 + i * 100}ms` }}
                />
              </div>
              <span className="text-xs text-slate-ash font-mono">{widths[i]}</span>
            </div>
          )
        })}
      </div>

      {/* Hover glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 30% 80%, rgba(26,111,255,0.06) 0%, transparent 60%)' }}
      />
    </div>
  )
}

/* ── Card 2: Automation (wide) ── */
function AutomationCard({ delay = 0 }: { delay?: number }) {
  const { ref, visible } = useVisible()
  const Icon = ICON_MAP[FEATURE_CARDS[1].icon]
  const card = FEATURE_CARDS[1]

  return (
    <div
      ref={ref}
      className={`bento-card group p-7 col-span-1 lg:col-span-2 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 h-full">
        {/* Text side */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <span className="text-cyan-electric/50 font-mono text-xs font-semibold tracking-widest">
              {card.step} / 03
            </span>
            <div className="w-10 h-10 rounded-xl bg-cyan-electric/10 border border-cyan-electric/20 flex items-center justify-center">
              <Icon className="h-5 w-5 text-cyan-electric" />
            </div>
          </div>

          <h3 className="text-slate-platinum font-bold text-xl leading-snug mb-3">
            {card.title}
          </h3>

          <p className="text-slate-ash text-sm leading-relaxed flex-1">
            {card.body}
          </p>

          <HarvestTimer />
        </div>

        {/* Visual side: gas comparison */}
        <div className="flex flex-col justify-center">
          <p className="text-slate-muted text-xs font-semibold uppercase tracking-widest mb-4">
            The Gas Barrier
          </p>
          
          <div className="flex flex-col gap-4">
            {/* The Problem */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/10">
              <span className="text-sm font-medium text-slate-ash">Legacy Networks (Ethereum)</span>
              <span className="text-lg font-mono font-bold text-red-400/50 line-through">~$45.00</span>
            </div>
            
            {/* The Solution */}
            <div className="flex items-center justify-between p-5 rounded-xl bg-cyan-electric/5 border border-cyan-electric/20 shadow-[0_0_30px_rgba(0,229,255,0.05)] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-electric/10 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-platinum">Hedera Network</span>
                <span className="text-xs text-slate-muted mt-0.5">Fixed predictable execution</span>
              </div>
              <div className="bg-[#00E5FF]/10 border border-[#00E5FF]/30 px-3 py-1 rounded-md z-10">
                <span className="text-2xl font-mono font-black text-[#00E5FF] drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]">
                  $0.0001
                </span>
              </div>
            </div>
            
            <p className="text-xs text-slate-muted mt-1 leading-relaxed">
              This ultra-low fixed fee is the engine behind Rheo Finance. It enables <strong className="text-cyan-electric font-semibold">hourly auto-compounding</strong>, an execution pipeline that is mathematically and financially impossible on other networks due to gas erosion.
            </p>
          </div>

          {/* Frequency badge */}
          <div className="mt-5 flex items-center gap-2 p-3 rounded-xl bg-cyan-electric/5 border border-cyan-electric/10">
            <Zap className="h-4 w-4 text-cyan-electric flex-shrink-0" />
            <p className="text-xs text-slate-ash">
              <span className="text-cyan-electric font-semibold">24× per day</span> — compound frequency impossible on high-fee chains
            </p>
          </div>
        </div>
      </div>

      {/* Hover glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 70% 20%, rgba(0,229,255,0.05) 0%, transparent 60%)' }}
      />
    </div>
  )
}

/* ── Card 3: Compound ── */
function CompoundCard({ delay = 0 }: { delay?: number }) {
  const { ref, visible } = useVisible()
  const Icon = ICON_MAP[FEATURE_CARDS[2].icon]
  const card = FEATURE_CARDS[2]

  return (
    <div
      ref={ref}
      className={`bento-card group p-7 flex flex-col transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-5">
        <span className="text-azure/50 font-mono text-xs font-semibold tracking-widest">
          {card.step} / 03
        </span>
        <div className="w-10 h-10 rounded-xl bg-azure/10 border border-azure/20 flex items-center justify-center">
          <Icon className="h-5 w-5 text-azure" />
        </div>
      </div>

      <h3 className="text-slate-platinum font-bold text-xl leading-snug mb-3">
        {card.title}
      </h3>

      <p className="text-slate-ash text-sm leading-relaxed flex-1">
        {card.body}
      </p>

      {/* Compound curve */}
      <CompoundCurve />
      <p className="text-slate-muted text-xs text-center mt-1">
        Compound frequency vs. projected growth
      </p>

      {/* Pipeline */}
      <PipelineFlow />

      {/* Math badge */}
      <div className="mt-4 p-3 rounded-xl bg-azure/5 border border-azure/10 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-azure flex-shrink-0" />
        <p className="text-xs text-slate-ash font-mono">
          APY = <span className="text-cyan-electric">(1 + r/8760)^8760</span> − 1
          {/* [LIVE] r = hourly reward rate from vault.getRewardRate() */}
        </p>
      </div>

      {/* Hover glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 60% 30%, rgba(26,111,255,0.05) 0%, transparent 60%)' }}
      />
    </div>
  )
}

/* ── Main Grid ── */
export default function BentoGrid() {
  const { ref: titleRef, visible: titleVisible } = useVisible(0.1)

  return (
    <section id="mechanics" className="relative py-24 overflow-hidden" aria-label="Protocol Mechanics">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950 via-[#0A1020] to-navy-950" />
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(26,111,255,0.06) 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div
          ref={titleRef}
          className={`text-center mb-16 transition-all duration-700 ${titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          <span className="tag-pill mb-4 inline-flex">
            <Zap className="h-3 w-3" />
            The Auto-Compounder
          </span>
          <h2 className="section-title mt-4 mb-4">
            How Rheo Works
          </h2>
          <p className="text-slate-ash text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            A three-stage mechanical pipeline that captures, converts, and re-deploys yield
            on a 60-minute cycle — fully autonomous, cryptographically enforced.
          </p>
        </div>

        {/* Bento Grid: asymmetric 3-col layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Row 1: Card 1 (1 col) + Card 2 (2 cols wide) */}
          <DepositCard delay={0} />
          <AutomationCard delay={100} />

          {/* Row 2: Card 3 (full width on mobile, 1.5 on desktop — centered) */}
          <div className="lg:col-start-2 lg:col-span-1">
            <CompoundCard delay={200} />
          </div>

          {/* Extra context card */}
          <div className="bento-card group p-7 lg:col-start-1 lg:col-span-1 lg:row-start-2 flex flex-col gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
              <RefreshCw className="h-5 w-5 text-slate-ash" />
            </div>
            <div>
              <h3 className="text-slate-platinum font-semibold text-base mb-2">
                Continuous, Permissionless
              </h3>
              <p className="text-slate-ash text-sm leading-relaxed">
                No manual intervention required. Once deposited, your capital operates inside
                a self-sustaining loop. Withdraw at any time — the vault is fully non-custodial
                and ERC-4626 compliant.
              </p>
            </div>
            <div className="mt-auto pt-4 border-t border-white/[0.05] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-slate-ash">Non-custodial · Permissionless · Auditable</span>
            </div>
          </div>

          {/* Stats overview card */}
          <div className="bento-card group p-7 lg:col-span-1 lg:col-start-3 lg:row-start-2 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-cyan-electric/10 border border-cyan-electric/20 flex items-center justify-center mb-4">
              <BarChart3 className="h-5 w-5 text-cyan-electric" />
            </div>
            <h3 className="text-slate-platinum font-semibold text-base mb-2">
              Live Vault Statistics
            </h3>
            <div className="space-y-3 mt-auto">
              {[
                { label: 'Share Price',      value: '1.0847 HBAR', live: true  },
                { label: 'Pending Rewards',  value: '12,430 SAUCE', live: true },
                { label: 'Withdrawal Fee',   value: '0.10%',        live: false },
                { label: 'Management Fee',   value: '2.00% APY',    live: false },
              ].map(({ label, value, live }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-slate-muted text-xs">{label}</span>
                  <span className={`text-xs font-mono font-semibold ${live ? 'text-cyan-electric' : 'text-slate-ash'}`}>
                    {/* [LIVE] marked values need real contract reads */}
                    {live && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-1.5 mb-px" />}
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
