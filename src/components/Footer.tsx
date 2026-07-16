/**
 * Footer.tsx — Structural Footer
 * Multi-column layout: brand + disclaimer, link directories.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Github, Twitter, MessageCircle, ExternalLink, Droplets, ArrowUpRight } from 'lucide-react'
import { BRAND, FOOTER_COLUMNS, NETWORK_STATUS } from '../config/protocolData'

/* ── Social Icon Map ── */
const SOCIAL_LINKS = [
  {
    label: 'GitHub',
    href:  'https://github.com/rheo-finance',
    Icon:  Github,
  },
  {
    label: 'X (Twitter)',
    href:  'https://twitter.com/rheofinance',
    Icon:  Twitter,
  },
  {
    label: 'Discord',
    href:  'https://discord.gg/rheofinance',
    Icon:  MessageCircle,
  },
]

/* ── Brand Column ── */
function BrandColumn() {
  const [imgError, setImgError] = useState(false)

  return (
    <div className="space-y-5 max-w-xs">
      {/* Logo + wordmark */}
      <div className="flex items-center gap-3">
        {!imgError ? (
          <img
            src="/src/assets/HASHPILOT (1).png"
            alt="Rheo Finance"
            className="h-7 w-auto object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-azure to-cyan-electric flex items-center justify-center shadow-azure-glow flex-shrink-0">
            <Droplets className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </div>
        )}
        <span className="text-slate-platinum font-bold text-base tracking-tight">
          {BRAND.name}
        </span>
      </div>

      {/* Mission */}
      <p className="text-slate-muted text-xs leading-relaxed">
        The premier auto-compounding engine built natively for the Hedera network.
        Rheo Finance maximizes APY through automated harvesting and reinvesting of
        SaucerSwap emissions — without manual friction.
      </p>

      {/* Disclaimer */}
      <div className="p-3.5 rounded-xl border border-amber-400/10 bg-amber-400/[0.04]">
        <p className="text-[11px] text-amber-200/60 leading-relaxed">
          ⚠ {BRAND.disclaimer}
        </p>
      </div>

      {/* Network */}
      <div className="flex items-center gap-2 text-xs text-slate-muted">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        {NETWORK_STATUS.label}
      </div>
    </div>
  )
}

/* ── Link Column ── */
function LinkColumn({ column }: { column: typeof FOOTER_COLUMNS[0] }) {
  return (
    <div>
      <h4 className="text-slate-platinum text-xs font-semibold uppercase tracking-widest mb-4">
        {column.heading}
      </h4>
      <ul className="space-y-2.5">
        {column.links.map(({ label, href }) => (
          <li key={label}>
            <a
              href={href}
              className="text-slate-muted text-sm hover:text-slate-ash transition-colors duration-200 flex items-center gap-1.5 group"
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {label}
              {href.startsWith('http') && (
                <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-60 transition-opacity" />
              )}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── Main Footer ── */
export default function Footer() {
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative border-t border-white/[0.05] overflow-hidden" aria-label="Site Footer">

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950 to-[#070B16]" />
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px]"
          style={{ background: 'radial-gradient(ellipse, rgba(26,111,255,0.04) 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Upper: CTA banner */}
        <div className="py-12 border-b border-white/[0.05]">
          <div className="glass-card p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h3 className="text-slate-platinum font-bold text-xl sm:text-2xl mb-2">
                Ready to compound your yield?
              </h3>
              <p className="text-slate-ash text-sm max-w-md">
                Join thousands of Hedera users automating their SaucerSwap LP positions with Rheo Finance.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <button
                className="btn-primary px-7 py-3"
                onClick={() => navigate('/app')}
                id="footer-launch-app"
              >
                {BRAND.launchApp}
                <ArrowUpRight className="h-4 w-4" />
              </button>
              <a
                href="#docs"
                className="btn-outline px-7 py-3"
              >
                Documentation
              </a>
            </div>
          </div>
        </div>

        {/* Main links grid */}
        <div className="py-12 grid grid-cols-2 sm:grid-cols-4 gap-8">
          {/* Brand col (2 cols on sm) */}
          <div className="col-span-2 sm:col-span-1">
            <BrandColumn />
          </div>

          {/* Link columns */}
          {FOOTER_COLUMNS.map(col => (
            <LinkColumn key={col.heading} column={col} />
          ))}
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Copyright */}
          <p className="text-slate-muted text-xs">
            © {currentYear} {BRAND.name}. All rights reserved. Non-custodial DeFi protocol.
          </p>

          {/* Social icons */}
          <div className="flex items-center gap-2">
            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-slate-muted hover:text-slate-ash hover:border-white/15 hover:bg-white/[0.06] transition-all duration-200"
                aria-label={label}
              >
                <Icon className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>

          {/* Version / commit */}
          <div className="hidden sm:flex items-center gap-1.5 text-slate-muted text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-azure/50" />
            {/* [LIVE] Replace with CI/CD injected build version */}
            v1.0.0-beta · Hedera Testnet
          </div>
        </div>
      </div>
    </footer>
  )
}
