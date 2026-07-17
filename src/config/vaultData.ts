/**
 * vaultData.ts — Dashboard vault configuration
 * All mock/static values are isolated here.
 * [LIVE] comments mark every field requiring a real on-chain read.
 */
import {
  VAULT_USDC_DAI,
  VAULT_HBAR_HBARX,
  VAULT_USDC_HBAR,
  VAULT_USDC_SAUCE,
  VAULT_DAI_HBAR,
  VAULT_HBAR_SAUCE,
  USDC_ADDRESS,
  DAI_ADDRESS,
  WHBAR_ADDRESS,
  HBARX_ADDRESS,
  SAUCE_ADDRESS
} from './contracts';

// Import token icons so Vite fingerprints and emits them in production builds.
// (Raw '/src/assets/...' string paths resolve in dev but 404 in the built site.)
import usdcIcon from '../assets/usdc.png';
import daiIcon from '../assets/DAI.png';
import hbarIcon from '../assets/hedera-logo.png.png';
import hbarxIcon from '../assets/HBARX.png';
import sauceIcon from '../assets/saucerswap-logo.png.png';

export interface VaultRow {
  id:            string
  pairLabel:     string    // e.g. "HBAR / USDC"
  tokenA:        string
  tokenB:        string
  tokenAAddress: string
  tokenBAddress: string
  tokenAIcon:    string    // Path to asset
  tokenBIcon:    string    // Path to asset
  version:       string    // 'V1' | 'V2'
  feeTier:       string    // '0.05%' | '0.30%'
  tags:          string[]  // ['LARI', 'AUTO', 'leaf']
  baseApr:       number    // [LIVE] SaucerSwap pool base APR %
  rheoApy:       number    // [LIVE] Computed compounded APY %
  tvlUsd:        number    // [LIVE] vault.totalAssets() in USD
  userBalance:   number    // [LIVE] user's simulated / wallet balance of tokenA
  userShares:    number    // [LIVE] vault.balanceOf(userAddress)
  colorA:        string    // Brand hex for token A icon fallback
  colorB:        string    // Brand hex for token B icon fallback
  contractAddress: string
  ratio:         number    // Token B amount per 1 Token A
}

export function calculateCompoundedAPY(baseApr: number): number {
  const r = baseApr / 100;
  const n = 8760; // Hourly compounding
  return (Math.pow(1 + r / n, n) - 1) * 100;
}

export const VAULTS: VaultRow[] = [
  {
    id:              'usdc-dai',
    pairLabel:       'USDC / DAI',
    tokenA:          'USDC',
    tokenB:          'DAI',
    tokenAAddress:   USDC_ADDRESS,
    tokenBAddress:   DAI_ADDRESS,
    tokenAIcon:      usdcIcon,
    tokenBIcon:      daiIcon,
    version:         'V2',
    feeTier:         '0.05%',
    tags:            ['LARI', 'AUTO'],
    baseApr:         8.0,
    rheoApy:         calculateCompoundedAPY(8.0),
    tvlUsd:          15_200_000,
    userBalance:     2_500.00,
    userShares:      0,
    colorA:          '#2775CA',
    colorB:          '#F4B731',
    contractAddress: VAULT_USDC_DAI,
    ratio:           1.0,
  },
  {
    id:              'hbar-hbarx',
    pairLabel:       'HBAR / HBARX',
    tokenA:          'HBAR',
    tokenB:          'HBARX',
    tokenAAddress:   WHBAR_ADDRESS,
    tokenBAddress:   HBARX_ADDRESS,
    tokenAIcon:      hbarIcon,
    tokenBIcon:      hbarxIcon,
    version:         'V1',
    feeTier:         '0.30%',
    tags:            ['leaf'],
    baseApr:         12.0,
    rheoApy:         calculateCompoundedAPY(12.0),
    tvlUsd:          22_400_000,
    userBalance:     8_240.00,
    userShares:      0,
    colorA:          '#00D1A1',
    colorB:          '#00D1A1',
    contractAddress: VAULT_HBAR_HBARX,
    ratio:           1.0,
  },
  {
    id:              'usdc-hbar',
    pairLabel:       'USDC / HBAR',
    tokenA:          'USDC',
    tokenB:          'HBAR',
    tokenAAddress:   USDC_ADDRESS,
    tokenBAddress:   WHBAR_ADDRESS,
    tokenAIcon:      usdcIcon,
    tokenBIcon:      hbarIcon,
    version:         'V1',
    feeTier:         '0.30%',
    tags:            ['leaf'],
    baseApr:         18.0,
    rheoApy:         calculateCompoundedAPY(18.0),
    tvlUsd:          12_400_000,
    userBalance:     2_500.00,
    userShares:      0,
    colorA:          '#2775CA',
    colorB:          '#00D1A1',
    contractAddress: VAULT_USDC_HBAR,
    ratio:           10.0,
  },
  {
    id:              'usdc-sauce',
    pairLabel:       'USDC / SAUCE',
    tokenA:          'USDC',
    tokenB:          'SAUCE',
    tokenAAddress:   USDC_ADDRESS,
    tokenBAddress:   SAUCE_ADDRESS,
    tokenAIcon:      usdcIcon,
    tokenBIcon:      sauceIcon,
    version:         'V1',
    feeTier:         '0.30%',
    tags:            [],
    baseApr:         42.0,
    rheoApy:         calculateCompoundedAPY(42.0),
    tvlUsd:          5_100_000,
    userBalance:     2_500.00,
    userShares:      0,
    colorA:          '#2775CA',
    colorB:          '#FF6B35',
    contractAddress: VAULT_USDC_SAUCE,
    ratio:           20.0,
  },
  {
    id:              'dai-hbar',
    pairLabel:       'DAI / HBAR',
    tokenA:          'DAI',
    tokenB:          'HBAR',
    tokenAAddress:   DAI_ADDRESS,
    tokenBAddress:   WHBAR_ADDRESS,
    tokenAIcon:      daiIcon,
    tokenBIcon:      hbarIcon,
    version:         'V1',
    feeTier:         '0.30%',
    tags:            [],
    baseApr:         15.2,
    rheoApy:         82.1,
    tvlUsd:          8_900_000,
    userBalance:     1_000.00,
    userShares:      0,
    colorA:          '#F4B731',
    colorB:          '#00D1A1',
    contractAddress: VAULT_DAI_HBAR,
    ratio:           10.0,
  },
  {
    id:              'hbar-sauce',
    pairLabel:       'HBAR / SAUCE',
    tokenA:          'HBAR',
    tokenB:          'SAUCE',
    tokenAAddress:   WHBAR_ADDRESS,
    tokenBAddress:   SAUCE_ADDRESS,
    tokenAIcon:      hbarIcon,
    tokenBIcon:      sauceIcon,
    version:         'V1',
    feeTier:         '0.30%',
    tags:            ['leaf'],
    baseApr:         26.7,
    rheoApy:         147.8,
    tvlUsd:          7_900_000,
    userBalance:     8_240.00,
    userShares:      0,
    colorA:          '#00D1A1',
    colorB:          '#FF6B35',
    contractAddress: VAULT_HBAR_SAUCE,
    ratio:           2.0,
  },
]

export type SlippageOption = '0.1' | '0.5' | '1.0'
export const SLIPPAGE_OPTIONS: SlippageOption[] = ['0.1', '0.5', '1.0']

/** Format large USD numbers to compact readable strings */
export function formatTVL(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(2)}`
}
