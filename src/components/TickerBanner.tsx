/**
 * TickerBanner.tsx — Real-Time Protocol Ticker
 * Full-width horizontal metrics banner with Electric Cyan numbers.
 */

import { useEffect, useRef, useState } from 'react'
import { TrendingUp, Activity, DollarSign } from 'lucide-react'
import { PROTOCOL_METRICS } from '../config/protocolData'

/* ── Animated number counter ── */
function AnimatedMetric({ value, prefix = '', suffix = '' }: {
  value: string
  prefix?: string
  suffix?: string
}) {
  const [displayValue, setDisplayValue] = useState('0')
  const [hasAnimated, setHasAnimated]   = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          const numericTarget = parseFloat(value.replace(/[^0-9.]/g, ''))
          const isDecimal     = value.includes('.')
          const hasComma      = numericTarget > 999

          const duration = 2000
          const start    = performance.now()

          const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1)
            const ease     = 1 - Math.pow(1 - progress, 4)
            const current  = ease * numericTarget

            let formatted: string
            if (isDecimal) {
              formatted = current.toFixed(1)
            } else if (hasComma) {
              formatted = Math.floor(current).toLocaleString()
            } else {
              formatted = Math.floor(current).toString()
            }

            setDisplayValue(formatted)
            if (progress < 1) requestAnimationFrame(tick)
          }

          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value, hasAnimated])

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{displayValue}{suffix}
    </span>
  )
}

/* ── Single Metric Block ── */
function MetricBlock({
  metric,
  icon: Icon,
  prefix,
  suffix,
  separator,
}: {
  metric: typeof PROTOCOL_METRICS[0]
  icon: React.ElementType
  prefix?: string
  suffix?: string
  separator?: boolean
}) {
  return (
    <div className="flex items-center gap-8">
      <div className="flex items-start gap-4 flex-1 min-w-0">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-azure/10 border border-azure/20 flex items-center justify-center">
          <Icon className="h-5 w-5 text-azure" />
        </div>

        {/* Data */}
        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-3xl sm:text-4xl font-extrabold text-cyan-electric cyan-glow-text leading-none"
              id={`metric-${metric.id}`}
            >
              <AnimatedMetric value={metric.value} prefix={prefix} suffix={suffix} />
            </span>
            <span className="text-slate-muted text-xs font-medium uppercase tracking-wider">
              {metric.unit}
            </span>
          </div>
          <p className="text-slate-ash text-sm font-medium mt-1 leading-tight">
            {metric.subLabel}
          </p>
          <p className="text-slate-muted text-xs mt-0.5 hidden sm:block truncate max-w-[200px]">
            {metric.description}
          </p>
        </div>
      </div>

      {/* Separator */}
      {separator && (
        <div className="hidden lg:block w-px h-16 bg-gradient-to-b from-transparent via-white/[0.08] to-transparent flex-shrink-0" />
      )}
    </div>
  )
}

/* ── Live Dot ── */
function LiveIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.06] bg-white/[0.02]">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span className="text-xs font-medium text-slate-ash whitespace-nowrap">Live Data</span>
    </div>
  )
}

/* ── Main Ticker ── */
export default function TickerBanner() {
  const METRIC_ICONS = [DollarSign, Activity, TrendingUp]
  const PREFIXES     = ['$', '', '']
  const SUFFIXES     = ['', '', '%']

  return (
    <section
      id="analytics"
      className="relative py-12 overflow-hidden border-y border-white/[0.05]"
      aria-label="Protocol Metrics Ticker"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-[#0D1526] to-navy-950" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(255,255,255,0.025)' stroke-width='1'/%3E%3C/svg%3E")`
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-ash">
              Protocol Performance
            </h2>
            <p className="text-slate-muted text-xs mt-1">
              {/* [LIVE] Replace with real-time last-updated timestamp from your indexer */}
              Updated every block · Hedera Testnet
            </p>
          </div>
          <LiveIndicator />
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-0">
          {PROTOCOL_METRICS.map((metric, i) => (
            <MetricBlock
              key={metric.id}
              metric={metric}
              icon={METRIC_ICONS[i]}
              prefix={PREFIXES[i]}
              suffix={SUFFIXES[i]}
              separator={i < PROTOCOL_METRICS.length - 1}
            />
          ))}
        </div>

        {/* Bottom micro-ticker strip */}
        <div className="mt-10 pt-6 border-t border-white/[0.04] overflow-hidden ticker-wrapper">
          <div className="ticker-inner gap-8">
            {/* Duplicated for seamless loop */}
            {[...Array(2)].map((_, dupIdx) => (
              <div key={dupIdx} className="flex items-center gap-8 pr-8">
                {[
                  'SAUCE/HBAR pool: +2.4%',
                  'USDC/HBAR pool: +1.1%',
                  'ETH/HBAR pool: +3.7%',
                  'BTC/HBAR pool: +0.9%',
                  'Last harvest: 12s ago',
                  'Keeper bot: ACTIVE',
                  'Vault health: OPTIMAL',
                  'Fee tier: 0.30%',
                ].map((item, i) => (
                  <span key={`${dupIdx}-${i}`} className="flex items-center gap-2 text-xs text-slate-muted whitespace-nowrap">
                    <span className="w-1 h-1 rounded-full bg-cyan-electric/50" />
                    {item}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
