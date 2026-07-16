/**
 * EcosystemSection.tsx — Ecosystem Integration & Security
 * Architecture walkthrough + real partner logo cards (horizontal layout) + security callouts.
 * Thrive Protocol removed. Partner cards now show logo image left, name + tagline right.
 */

import { useRef, useEffect, useState } from 'react'
import { Shield, Link2, Cpu, GitBranch, ExternalLink, CheckCircle } from 'lucide-react'
import { ECOSYSTEM_PARTNERS, ARCH_STEPS } from '../config/protocolData'

/* ── Intersection observer hook ── */
function useVisible(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
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

/* ── Architecture pipeline ── */
function ArchPipeline() {
  const { ref, visible } = useVisible()
  const icons = [Cpu, Shield, Link2, GitBranch]

  return (
    <div ref={ref} className="space-y-3">
      {ARCH_STEPS.map((step, i) => {
        const Icon = icons[i]
        return (
          <div
            key={step.id}
            className={`group flex items-start gap-4 p-4 rounded-xl border border-white/[0.05]
              bg-white/[0.02] transition-all duration-500
              hover:border-azure/20 hover:bg-white/[0.04]
              ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
            style={{ transitionDelay: `${i * 120}ms` }}
          >
            {/* Icon + connector line */}
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className="w-9 h-9 rounded-lg bg-azure/10 border border-azure/20 flex items-center justify-center group-hover:bg-azure/15 transition-colors">
                <Icon className="h-4 w-4 text-azure" />
              </div>
              {i < ARCH_STEPS.length - 1 && (
                <div
                  className="w-px bg-gradient-to-b from-azure/20 to-transparent"
                  style={{ minHeight: '16px' }}
                />
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0 pt-0.5">
              <h4 className="text-slate-platinum text-sm font-semibold mb-1">
                {step.label}
              </h4>
              <p className="text-slate-ash text-xs leading-relaxed">
                {step.desc}
              </p>
            </div>

            {/* ABI badge */}
            <div className="flex-shrink-0 hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.05] text-slate-muted text-xs font-mono">
              ABI
              <ExternalLink className="h-2.5 w-2.5" />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Partner Card — horizontal: logo LEFT, name + tagline RIGHT ── */
function PartnerCard({
  partner,
  delay = 0,
}: {
  partner: typeof ECOSYSTEM_PARTNERS[0]
  delay?: number
}) {
  const { ref, visible } = useVisible()
  const [imgError, setImgError] = useState(false)

  return (
    <div
      ref={ref}
      className={`group glass-card flex items-center gap-5 p-5
        transition-all duration-500 hover:-translate-y-0.5 hover:border-white/10 cursor-default
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* ── Logo column ── */}
      <div
        className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105"
        style={{
          backgroundColor: `${partner.color}15`,
          border: `1px solid ${partner.color}28`,
        }}
      >
        {!imgError ? (
          <img
            src={partner.logoPath}
            alt={`${partner.name} logo`}
            className="w-10 h-10 object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          /* Fallback initial letter mark when logo file is missing */
          <span
            className="text-2xl font-black select-none"
            style={{ color: partner.color }}
          >
            {partner.name.slice(0, 1)}
          </span>
        )}
      </div>

      {/* ── Text column ── */}
      <div className="flex-1 min-w-0">
        <p className="text-slate-platinum text-sm font-semibold leading-tight">
          {partner.name}
        </p>
        <p className="text-slate-muted text-xs mt-0.5">
          {partner.tagline}
        </p>

        {/* Integrated badge */}
        <div className="flex items-center gap-1.5 mt-2">
          <CheckCircle className="h-3 w-3 text-emerald-400 flex-shrink-0" />
          <span className="text-emerald-400 text-xs font-medium">Integrated</span>
        </div>
      </div>

      {/* Right-side color accent line */}
      <div
        className="flex-shrink-0 w-0.5 h-10 rounded-full opacity-40 group-hover:opacity-70 transition-opacity"
        style={{ backgroundColor: partner.color }}
      />
    </div>
  )
}

/* ── Security Badge ── */
function SecurityBadge({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.05] bg-white/[0.02]">
      <Shield className="h-4 w-4 text-emerald-400 flex-shrink-0" />
      <div>
        <p className="text-slate-platinum text-xs font-semibold">{label}</p>
        <p className="text-slate-muted text-xs">{detail}</p>
      </div>
    </div>
  )
}

/* ── Main Section ── */
export default function EcosystemSection() {
  const { ref: titleRef, visible: titleVisible } = useVisible(0.1)

  return (
    <section
      id="docs"
      className="relative py-24 overflow-hidden"
      aria-label="Ecosystem Integration and Security"
    >
      {/* ── Background atmospherics ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950 via-[#080C18] to-navy-950" />
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[600px]"
          style={{ background: 'radial-gradient(ellipse, rgba(26,111,255,0.05) 0%, transparent 65%)' }}
        />
        <div
          className="absolute left-0 bottom-1/4 w-[400px] h-[400px]"
          style={{ background: 'radial-gradient(ellipse, rgba(0,229,255,0.04) 0%, transparent 65%)' }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Section header ── */}
        <div
          ref={titleRef}
          className={`text-center mb-16 transition-all duration-700 ${titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          <span className="tag-pill mb-4 inline-flex">
            <Link2 className="h-3 w-3" />
            Architecture
          </span>
          <h2 className="section-title mt-4 mb-4">
            Ecosystem Integration
          </h2>
          <p className="text-slate-ash text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Rheo Finance is natively wired into the Hedera ecosystem stack —
            from the HTS token layer up through SaucerSwap liquidity routing
            to the keeper automation layer.
          </p>
        </div>

        {/* ── Two-column: pipeline (left) + partners & security (right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 mb-16">

          {/* Left: Architecture pipeline */}
          <div>
            <h3 className="text-slate-platinum font-semibold text-lg mb-6 flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-azure" />
              Protocol Stack
            </h3>
            <ArchPipeline />
          </div>

          {/* Right: Partner cards + security */}
          <div className="space-y-8">

            {/* ── Integrated Ecosystem heading ── */}
            <div>
              <h3 className="text-slate-platinum font-semibold text-lg mb-6 flex items-center gap-2">
                <Link2 className="h-5 w-5 text-azure" />
                Integrated Ecosystem
              </h3>

              {/*
               * Partner cards — horizontal layout (logo LEFT, text RIGHT).
               * To display real logos: drop hedera-logo.png and saucerswap-logo.png
               * into src/assets/ and the <img> tags will pick them up automatically.
               * If the file is missing the card gracefully shows the partner initial.
               */}
              <div className="flex flex-col gap-3">
                {ECOSYSTEM_PARTNERS.map((partner, i) => (
                  <PartnerCard
                    key={partner.id}
                    partner={partner}
                    delay={i * 90}
                  />
                ))}
              </div>
            </div>

            {/* ── Security & Compliance ── */}
            <div>
              <h3 className="text-slate-platinum font-semibold text-base mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                Security &amp; Compliance
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <SecurityBadge
                  label="ERC-4626 Standard"
                  detail="Yield vault interface compliant"
                />
                <SecurityBadge
                  label="Non-Custodial"
                  detail="Users retain asset ownership"
                />
                <SecurityBadge
                  label="Audited Contracts"
                  detail="Third-party security review pending"
                />
                <SecurityBadge
                  label="Open Source"
                  detail="Fully verified on Hedera Explorer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Full-width SaucerSwap ABI callout ── */}
        <div className="glass-card p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-azure/10 border border-azure/20 flex items-center justify-center">
              <Cpu className="h-6 w-6 text-azure" />
            </div>
            <div className="flex-1">
              <h3 className="text-slate-platinum font-bold text-base mb-1">
                SaucerSwap V2 Router ABI Alignment
              </h3>
              <p className="text-slate-ash text-sm leading-relaxed">
                The vault's{' '}
                <code className="text-cyan-electric font-mono text-xs bg-cyan-electric/10 px-1.5 py-0.5 rounded">
                  harvest()
                </code>{' '}
                function calls{' '}
                <code className="text-azure font-mono text-xs bg-azure/10 px-1.5 py-0.5 rounded">
                  swapExactTokensForTokens()
                </code>{' '}
                on the SaucerSwap V2 Router at the deployed contract address on Hedera.
                Swap path routing, slippage tolerance, and deadline parameters must be
                calibrated at deployment time.
              </p>
              <p className="text-slate-muted text-xs mt-2 font-mono">
                {/* [LIVE] Replace with actual deployed SaucerSwap Router contract address on Hedera mainnet */}
                {/* Router address: GET from https://docs.saucerswap.finance/saucerswap-v2/smart-contracts */}
                Router Address:{' '}
                <span className="text-slate-ash">
                  [ PLUG IN: SaucerSwap V2 Router address ]
                </span>
              </p>
            </div>
            <a
              href="https://docs.saucerswap.finance"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 flex items-center gap-1.5 text-xs text-azure hover:text-azure-light transition-colors font-medium"
            >
              View Docs
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
