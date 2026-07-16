/**
 * HeroSection.tsx — Institutional Hero Layer (Viewport 1)
 * 50/50 desktop split: left copy block + right 3D canvas placeholder
 */

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, BookOpen, ChevronDown } from 'lucide-react'
import { BRAND, PROTOCOL_METRICS } from '../config/protocolData'

/* ── Animated counter hook ── */
function useCountUp(target: number, duration = 1800, delay = 300) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true) },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    const timeout = setTimeout(() => {
      const start    = performance.now()
      const tick     = (now: number) => {
        const elapsed  = now - start
        const progress = Math.min(elapsed / duration, 1)
        const ease     = 1 - Math.pow(1 - progress, 3)
        setCount(Math.floor(ease * target))
        if (progress < 1) requestAnimationFrame(tick)
        else setCount(target)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(timeout)
  }, [started, target, duration, delay])

  return { count, ref }
}

/* ── 3D Canvas Placeholder ── */
function Canvas3DPlaceholder() {
  return (
    /**
     * [3D INTEGRATION POINT]
     * Replace the contents of this div with your React Three Fiber <Canvas> or
     * <Spline scene="https://prod.spline.design/YOUR_SCENE_ID/scene.splinecode" />
     *
     * Required packages:
     *   npm install @react-three/fiber @react-three/drei three
     *   — OR —
     *   npm install @splinetool/react-spline @splinetool/runtime
     *
     * The container is already sized, positioned, and styled.
     */
    <div className="relative w-full h-full min-h-[480px] rounded-3xl overflow-hidden geo-mesh">

      {/* Ambient glow layers */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full animate-glow-pulse"
          style={{ background: 'radial-gradient(ellipse, rgba(0,229,255,0.18) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full animate-pulse-slow"
          style={{ background: 'radial-gradient(ellipse, rgba(26,111,255,0.14) 0%, transparent 65%)' }}
        />
      </div>

      {/* Rotating outer ring */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="relative w-72 h-72">

          {/* Outer slow ring */}
          <div
            className="absolute inset-0 rounded-full border border-white/[0.06] animate-spin-slow"
            style={{ borderStyle: 'dashed' }}
          />

          {/* Mid ring */}
          <div className="absolute inset-8 rounded-full border border-azure/20 animate-spin-slow"
            style={{ animationDirection: 'reverse', animationDuration: '15s' }}
          />

          {/* Inner ring */}
          <div className="absolute inset-16 rounded-full border border-cyan-electric/30" />

          {/* Core orb */}
          <div className="absolute inset-[4.5rem] rounded-full bg-gradient-to-br from-azure/40 to-cyan-electric/30 backdrop-blur-sm border border-cyan-electric/40 shadow-cyan-glow flex items-center justify-center animate-float">
            <div className="text-cyan-electric text-center">
              <svg viewBox="0 0 40 40" className="w-10 h-10" fill="none">
                <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2" />
                <path d="M10 20 Q20 8 30 20 Q20 32 10 20Z" stroke="currentColor" strokeWidth="1.5" fill="rgba(0,229,255,0.08)" />
                <circle cx="20" cy="20" r="3" fill="currentColor" />
              </svg>
            </div>
          </div>

          {/* Orbiting node 1 */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 animate-orbit"
            style={{ transformOrigin: '50% 50%' }}
          >
            <div className="w-3 h-3 rounded-full bg-azure shadow-azure-glow" />
          </div>

          {/* Orbiting node 2 */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 animate-orbit"
            style={{ transformOrigin: '50% 50%', animationDelay: '-6s', animationDuration: '8s' }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-electric shadow-cyan-glow" />
          </div>

          {/* Orbiting node 3 */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 animate-orbit"
            style={{ transformOrigin: '50% 50%', animationDelay: '-3s', animationDuration: '16s', transform: 'rotate(120deg) translateX(110px) rotate(-120deg)' }}
          >
            <div className="w-2 h-2 rounded-full bg-white/50" />
          </div>
        </div>
      </div>

      {/* Stat cards floating in the canvas */}
      <div className="absolute top-6 right-6 z-20 animate-float" style={{ animationDelay: '0.5s' }}>
        <div className="glass-card px-4 py-3 text-right">
          <p className="text-xs text-slate-ash font-medium">Total Harvests</p>
          <p className="text-xl font-bold text-cyan-electric metric-value">{PROTOCOL_METRICS[1].label}</p>
        </div>
      </div>

      <div className="absolute bottom-10 left-6 z-20 animate-float-delay">
        <div className="glass-card px-4 py-3">
          <p className="text-xs text-slate-ash font-medium">Current APY</p>
          <p className="text-xl font-bold text-cyan-electric metric-value">{PROTOCOL_METRICS[2].label}</p>
        </div>
      </div>

      <div className="absolute bottom-10 right-6 z-20 animate-float" style={{ animationDelay: '1s' }}>
        <div className="glass-card px-4 py-3 text-right">
          <p className="text-xs text-slate-ash font-medium">Gas per Harvest</p>
          <p className="text-xl font-bold text-emerald-400 font-mono">$0.0001</p>
        </div>
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 z-[1]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(255,255,255,0.02)' stroke-width='1'/%3E%3C/svg%3E")`
      }} />

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 w-6 h-6 border-t border-l border-azure/30 rounded-tl-lg z-20" />
      <div className="absolute bottom-4 right-4 w-6 h-6 border-b border-r border-cyan-electric/30 rounded-br-lg z-20" />
    </div>
  )
}

/* ── Main Hero ── */
export default function HeroSection() {
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  const handleScrollDown = () => {
    const el = document.getElementById('analytics')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      id="vaults"
      className="relative min-h-screen flex items-center pt-16 overflow-hidden"
      aria-label="Hero — Continuous Yield, Automated Execution"
    >
      {/* ── Background atmospherics ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cpath d='M 80 0 L 0 0 0 80' fill='none' stroke='rgba(255,255,255,0.025)' stroke-width='1'/%3E%3C/svg%3E")`
        }} />

        {/* Hero glow */}
        <div
          className="absolute top-1/4 right-1/3 w-[600px] h-[600px] rounded-full opacity-30 animate-pulse-slow"
          style={{ background: 'radial-gradient(ellipse, rgba(0,229,255,0.15) 0%, transparent 65%)' }}
        />
        <div
          className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(ellipse, rgba(26,111,255,0.18) 0%, transparent 60%)' }}
        />

        {/* Horizontal line accent */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* ── Left: Copy Block ── */}
          <div className={`space-y-8 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

            {/* Tag */}
            <div className="flex items-center gap-3">
              <span className="tag-pill">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-electric animate-pulse" />
                Built on Hedera · Powered by SaucerSwap
              </span>
            </div>

            {/* Headline */}
            <h1
              ref={headlineRef}
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight"
            >
              <span className="text-slate-platinum">Continuous Yield.</span>
              <br />
              <span className="gradient-text">Automated</span>
              <br />
              <span className="text-slate-platinum">Execution.</span>
            </h1>

            {/* Sub-Headline */}
            <p className="text-slate-ash text-base sm:text-lg leading-relaxed max-w-lg">
              {BRAND.mission}
            </p>

            {/* CTA Group */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
              <button
                className="btn-primary text-base px-8 py-3.5"
                onClick={() => {
                  const el = document.getElementById('mechanics')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
                id="hero-explore-pools"
              >
                {BRAND.explorePools}
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                className="btn-outline text-base px-8 py-3.5"
                onClick={() => {
                  const el = document.getElementById('docs')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
                id="hero-read-docs"
              >
                <BookOpen className="h-4 w-4" />
                {BRAND.readDocs}
              </button>
            </div>

            {/* Proof stats row */}
            <div className="flex items-center gap-6 pt-4 border-t border-white/[0.05]">
              <div>
                <p className="text-cyan-electric font-bold text-xl tabular-nums">{PROTOCOL_METRICS[0].label}</p>
                <p className="text-slate-muted text-xs mt-0.5">{PROTOCOL_METRICS[0].subLabel}</p>
              </div>
              <div className="w-px h-8 bg-white/[0.08]" />
              <div>
                <p className="text-cyan-electric font-bold text-xl tabular-nums">{PROTOCOL_METRICS[1].label}</p>
                <p className="text-slate-muted text-xs mt-0.5">{PROTOCOL_METRICS[1].subLabel}</p>
              </div>
              <div className="w-px h-8 bg-white/[0.08]" />
              <div>
                <p className="text-cyan-electric font-bold text-xl tabular-nums">{PROTOCOL_METRICS[2].label}</p>
                <p className="text-slate-muted text-xs mt-0.5">{PROTOCOL_METRICS[2].subLabel}</p>
              </div>
            </div>
          </div>

          {/* ── Right: 3D Canvas ── */}
          <div
            className={`relative transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <Canvas3DPlaceholder />
          </div>
        </div>

        {/* ── Scroll Indicator ── */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-muted">
          <button
            onClick={handleScrollDown}
            className="flex flex-col items-center gap-2 hover:text-slate-ash transition-colors duration-200 group"
            aria-label="Scroll to analytics"
          >
            <span className="text-xs font-medium tracking-widest uppercase opacity-50 group-hover:opacity-80 transition-opacity">
              Scroll
            </span>
            <ChevronDown className="h-4 w-4 animate-bounce opacity-50 group-hover:opacity-80 transition-opacity" />
          </button>
        </div>
      </div>
    </section>
  )
}
