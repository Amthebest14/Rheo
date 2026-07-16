/**
 * Header.tsx — Floating Glass Navigation (Landing Page)
 * Sticky fixed nav with glass blur, brand logo, nav links, network pill, and Launch App CTA.
 * "Launch App" navigates to /app via react-router-dom useNavigate (no hard refresh).
 */

import { useState, useEffect } from 'react'
import { Menu, X, ArrowUpRight, Droplets } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { NAV_LINKS, NETWORK_STATUS, BRAND } from '../config/protocolData'
import HederaConnectButton from './HederaConnectButton'
import hashpilotLogo from '../assets/HASHPILOT (1).png'

// ── Logo component: loads the brand logo asset.
//    Falls back to an SVG icon mark if the file is missing.
function BrandLogo() {
  const [imgError, setImgError] = useState(false)

  return (
    <a href="/" className="flex items-center" aria-label="Rheo Finance Home">
      {!imgError ? (
        <img
          src={hashpilotLogo}
          alt="Rheo Finance Logo"
          className="w-48 h-auto object-contain"
          onError={() => setImgError(true)}
          /* Adding style overrides to handle case where CSS properties require explicit heights */
        />
      ) : (
        /* Fallback SVG icon mark + wordmark when image is unavailable */
        <div className="flex items-center gap-3 group">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-azure to-cyan-electric flex items-center justify-center shadow-azure-glow flex-shrink-0">
            <Droplets className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-slate-platinum font-bold text-lg tracking-tight group-hover:text-white transition-colors duration-200">
            Rheo Finance
          </span>
        </div>
      )}
    </a>
  )
}

export default function Header() {
  const navigate = useNavigate()

  const [scrolled, setScrolled]           = useState(false)
  const [mobileOpen, setMobileOpen]       = useState(false)
  const [activeSection, setActiveSection] = useState('')

  /* ── Scroll detection for header opacity ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ── Active section highlighting via IntersectionObserver ── */
  useEffect(() => {
    const sections = NAV_LINKS.map(l => l.href.slice(1))
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSection(entry.target.id)
        })
      },
      { threshold: 0.3, rootMargin: '-80px 0px 0px 0px' }
    )
    sections.forEach(id => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const handleNavClick = (href: string) => {
    setMobileOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const handleLaunchApp = () => {
    setMobileOpen(false)
    navigate('/app')
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-navy-950/90 backdrop-blur-md shadow-[0_1px_0_rgba(255,255,255,0.05)]'
          : 'bg-navy-950/70 backdrop-blur-sm'
      } border-b border-white/[0.05]`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Left: Brand ── */}
          <BrandLogo />

          {/* ── Center: Desktop Nav Links ── */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Primary navigation">
            {NAV_LINKS.map(({ label, href }) => (
              <button
                key={label}
                onClick={() => handleNavClick(href)}
                className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeSection === href.slice(1)
                    ? 'text-white bg-white/[0.06]'
                    : 'text-slate-ash hover:text-slate-platinum hover:bg-white/[0.04]'
                }`}
              >
                {activeSection === href.slice(1) && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-azure" />
                )}
                {label}
              </button>
            ))}
          </nav>

          {/* ── Right: Status Pill + CTA ── */}
          <div className="hidden md:flex items-center gap-3">
            {/* Network Status Pill */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-xs font-bold text-emerald-400"
              title={`Chain ID: ${NETWORK_STATUS.chainId} · RPC: ${NETWORK_STATUS.rpcUrl}`}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              {NETWORK_STATUS.label}
            </div>

            <HederaConnectButton size="sm" />

            {/* Launch App — uses react-router navigate, no hard refresh */}
            <button
              className="btn-primary"
              onClick={handleLaunchApp}
              id="header-launch-app"
            >
              {BRAND.launchApp}
              <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>

          {/* ── Mobile: Hamburger ── */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-ash hover:text-slate-platinum hover:bg-white/[0.06] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Drawer ── */}
      <div
        className={`md:hidden transition-all duration-300 overflow-hidden ${
          mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4 pt-2 space-y-1 border-t border-white/[0.05] bg-navy-950/95 backdrop-blur-md">
          {NAV_LINKS.map(({ label, href }) => (
            <button
              key={label}
              onClick={() => handleNavClick(href)}
              className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-ash hover:text-slate-platinum hover:bg-white/[0.05] rounded-lg transition-colors"
            >
              {label}
            </button>
          ))}

          <div className="pt-2 space-y-3">
            <div className="flex items-center gap-2 px-4 py-1 text-xs font-bold text-emerald-400">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              {NETWORK_STATUS.label}
            </div>
            <div className="px-4">
              <HederaConnectButton size="md" />
            </div>
            <button
              className="btn-primary w-full justify-center"
              onClick={handleLaunchApp}
              id="mobile-launch-app"
            >
              {BRAND.launchApp}
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
