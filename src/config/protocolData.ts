/**
 * =========================================================
 *  Rheo Finance — Protocol Data Configuration
 *  src/config/protocolData.ts
 *
 *  ⚠  DATA BINDING GUIDE FOR DEVELOPERS ⚠
 *  All values marked with [LIVE] require a real-time data
 *  source. See inline comments for the exact variable or
 *  contract ABI parameter that must be wired in.
 * =========================================================
 */

/* ── Navigation Links ──────────────────────────────────── */
export interface NavLink {
  label: string;
  href: string;
}

export const NAV_LINKS: NavLink[] = [
  { label: 'Vaults',     href: '#vaults'    },
  { label: 'Analytics',  href: '#analytics'  },
  { label: 'Mechanics',  href: '#mechanics'  },
  { label: 'Docs',       href: '#docs'       },
];

/* ── Network Status ────────────────────────────────────── */
export interface NetworkStatus {
  label: string;
  network: string;
  isLive: boolean;
  chainId: string;
  rpcUrl: string;
}

export const NETWORK_STATUS: NetworkStatus = {
  label:     'Live on Hedera Testnet',
  network:   'Hedera Testnet',
  isLive:    true,
  chainId:   '0x128',    // Hedera Testnet chain ID (296 decimal)
  /**
   * [LIVE] Replace with the Hedera JSON-RPC relay endpoint.
   * Mainnet: https://mainnet.hashio.io/api
   * Testnet: https://testnet.hashio.io/api
   */
  rpcUrl:    'https://testnet.hashio.io/api',
};

/* ── Protocol Metrics (Hero Ticker) ────────────────────── */
export interface ProtocolMetric {
  id:          string;
  label:       string;
  subLabel:    string;
  /**
   * [LIVE] Each `value` below must be replaced with a live
   * state variable populated from the on-chain read:
   *
   * TVL         → vault.totalAssets() → format to USD string
   * Harvests    → emitted HarvestExecuted event count from keeper subgraph
   * APY         → computed off-chain: ((1 + r/n)^n - 1) × 100
   *               where r = reward rate per block, n = compounding intervals/year
   */
  value:       string;
  unit:        string;
  description: string;
}

export const PROTOCOL_METRICS: ProtocolMetric[] = [
  {
    id:          'tvl',
    label:       '$24.7M',
    subLabel:    'Total Value Locked',
    // [LIVE] → vault.totalAssets() via ethers.js / viem — format with Intl.NumberFormat
    value:       '24700000',
    unit:        'USD',
    description: 'Protocol-managed liquidity across all active vaults',
  },
  {
    id:          'harvests',
    label:       '186,420',
    subLabel:    'Automated Harvests',
    // [LIVE] → Query HarvestExecuted event count from your Hedera Mirror Node subgraph
    // GET https://testnet.mirrornode.hedera.com/api/v1/contracts/{contractId}/results
    value:       '186420',
    unit:        'cycles',
    description: 'Total on-chain compound cycles executed by keeper bots',
  },
  {
    id:          'apy',
    label:       '94.3%',
    subLabel:    'Avg APY Optimized',
    // [LIVE] → Computed: ((1 + weeklyRate)^52 - 1) × 100
    // weeklyRate sourced from SaucerSwap pool emissions ABI: getRewardForDuration()
    value:       '94.3',
    unit:        '%',
    description: 'Annualized yield amplified by hourly compounding frequency',
  },
];

/* ── Feature Cards (Bento Box) ─────────────────────────── */
export interface FeatureCard {
  id:         string;
  step:       string;
  title:      string;
  body:       string;
  icon:       string;
  accentColor: 'azure' | 'cyan' | 'purple';
  size:       'normal' | 'wide' | 'tall';
}

export const FEATURE_CARDS: FeatureCard[] = [
  {
    id:    'deposit',
    step:  '01',
    title: 'Advanced Execution Terminal',
    body:  'Deposit assets into the vault using precision fractional controls (25% / 50% / 75% / MAX) and configurable Slippage Tolerance protections. The vault contract autonomously handles all underlying SaucerSwap position management on your behalf.',
    icon:  'Wallet',
    accentColor: 'azure',
    size:  'normal',
  },
  {
    id:    'automation',
    step:  '02',
    title: 'Deep Analytics & Execution',
    body:  "Off-chain keeper bots call the vault's harvest() function every 60 minutes with surgical precision. Track your growth through the Deep Analytics charting capabilities built directly into the workspace, completely economically viable via Hedera's fixed $0.0001 gas fee.",
    icon:  'Timer',
    accentColor: 'cyan',
    size:  'wide',
  },
  {
    id:    'compound',
    step:  '03',
    title: 'Exponential Growth Curve',
    body:  'Claimed rewards are programmatically split 50/50, converted via the SaucerSwap Router, and instantly re-staked. Monitor your exact gains via dual-yield tracking, comparing Base DEX APR directly against the Rheo Compounded APY in real-time.',
    icon:  'TrendingUp',
    accentColor: 'azure',
    size:  'normal',
  },
];

/* ── Ecosystem Partners ─────────────────────────────────── */
export interface EcosystemPartner {
  id:       string;
  name:     string;
  tagline:  string;
  color:    string;
  /**
   * logoPath: local asset path imported and passed in from the component.
   * Drop in your downloaded partner logo PNG to src/assets/ and update here.
   */
  logoPath: string;
}

export const ECOSYSTEM_PARTNERS: EcosystemPartner[] = [
  {
    id:       'hedera',
    name:     'Hedera Hashgraph',
    tagline:  'Layer-1 Infrastructure',
    color:    '#00D1A1',
    logoPath: '/src/assets/hedera-logo.png.png',
  },
  {
    id:       'saucerswap',
    name:     'SaucerSwap',
    tagline:  'Liquidity & Emissions',
    color:    '#FF6B35',
    logoPath: '/src/assets/saucerswap-logo.png.png',
  },
];

/* ── Architecture Data ──────────────────────────────────── */
export interface ArchStep {
  id:    string;
  label: string;
  desc:  string;
}

export const ARCH_STEPS: ArchStep[] = [
  {
    id:    'hts',
    label: 'Hedera Token Service (HTS)',
    desc:  'Native token operations — transfers, associations, and approvals — executed at fixed $0.0001 per transaction.',
  },
  {
    id:    'vault',
    label: 'ERC-4626 Vault Contract',
    desc:  'Standard yield-bearing vault interface. deposit(), withdraw(), totalAssets(), and convertToShares() are fully ABI-compatible.',
  },
  {
    id:    'router',
    label: 'SaucerSwap V2 Router',
    desc:  'swapExactTokensForTokens() called during each harvest cycle to convert SAUCE emissions into LP-pair underlying assets.',
  },
  {
    id:    'keeper',
    label: 'Keeper Automation Network',
    desc:  'Off-chain bots monitor block timestamps and call harvest() on a fixed 60-minute interval. No Chainlink dependency required on Hedera.',
  },
];

/* ── Footer Links ───────────────────────────────────────── */
export interface FooterColumn {
  heading: string;
  links:   { label: string; href: string }[];
}

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: 'Developers',
    links: [
      { label: 'GitHub',           href: 'https://github.com/rheo-finance' },
      { label: 'Smart Contracts',  href: '#docs' },
      { label: 'ABI Reference',    href: '#docs' },
      { label: 'Audit Reports',    href: '#docs' },
    ],
  },
  {
    heading: 'Community',
    links: [
      { label: 'X (Twitter)', href: 'https://twitter.com/rheofinance' },
      { label: 'Discord',     href: 'https://discord.gg/rheofinance'  },
      { label: 'Blog',        href: '#blog'                           },
      { label: 'Newsletter',  href: '#newsletter'                     },
    ],
  },
  {
    heading: 'Protocol',
    links: [
      { label: 'Documentation', href: '#docs'     },
      { label: 'Analytics',     href: '#analytics' },
      { label: 'Governance',    href: '#governance'},
      { label: 'Bug Bounty',    href: '#security'  },
    ],
  },
];

/* ── Brand Copy ─────────────────────────────────────────── */
export const BRAND = {
  name:        'Rheo Finance',
  tagline:     'Continuous Yield. Automated Execution.',
  mission:     'The premier auto-compounding engine built natively for the Hedera network. Rheo Finance pools capital to automate the harvesting, swapping, and reinvesting of SaucerSwap emissions every single hour — maximizing your APY without the manual friction.',
  disclaimer:  'Rheo Finance is a non-custodial protocol. Smart contract interactions carry inherent risk including, but not limited to, smart contract bugs, liquidation risk, and market volatility. This interface does not constitute financial advice. Users interact with on-chain contracts directly at their own discretion and risk. Always conduct your own due diligence.',
  launchApp:   'Launch App',
  explorePools:'Explore Pools',
  readDocs:    'Read Technical Docs',
};
