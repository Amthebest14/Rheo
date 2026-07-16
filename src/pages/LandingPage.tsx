/**
 * LandingPage.tsx — wrapper that assembles the full scrollable marketing site.
 * Kept as a named page component so the router can mount it at "/".
 */

import Header          from '../components/Header'
import HeroSection     from '../components/HeroSection'
import TickerBanner    from '../components/TickerBanner'
import BentoGrid       from '../components/BentoGrid'
import EcosystemSection from '../components/EcosystemSection'
import Footer          from '../components/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-navy-950 text-slate-platinum font-sans antialiased">
      <Header />
      <main>
        <HeroSection />
        <TickerBanner />
        <BentoGrid />
        <EcosystemSection />
      </main>
      <Footer />
    </div>
  )
}
