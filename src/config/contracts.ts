import zapRouterAbi from './abis/ZapRouter.json';
import rheoVaultAbi from './abis/RheoVault.json';

export function hederaIdToEvmAddress(id: string): `0x${string}` {
  if (!id) return '0x0000000000000000000000000000000000000000';
  if (id.startsWith('0x')) return id as `0x${string}`;
  
  const parts = id.split('.');
  if (parts.length !== 3) return id as `0x${string}`;
  
  const num = parseInt(parts[2], 10);
  if (isNaN(num)) return id as `0x${string}`;
  
  const hex = num.toString(16).padStart(40, '0');
  return `0x${hex}`;
}

// Live Hedera testnet deployment (DeployAll, self-consistent stack, verified end-to-end).
export const ZAP_ROUTER_ADDRESS = hederaIdToEvmAddress(import.meta.env.VITE_ZAP_ROUTER_ADDRESS || '0xAF626340612464c63b82ee1A31a1acbC5801Aa15');
export const FAUCET_ADDRESS = hederaIdToEvmAddress(import.meta.env.VITE_FAUCET_ADDRESS || '0xF39C92680C0A99C993d21c299639Cedf5916115d');
export const SAUCERSWAP_ROUTER_ADDRESS = hederaIdToEvmAddress(import.meta.env.VITE_SAUCERSWAP_ROUTER_ADDRESS || '0xe7bc372D3faf6e906B8E497f20e7625d93364080');

// Tokens
export const WHBAR_ADDRESS = hederaIdToEvmAddress(import.meta.env.VITE_WHBAR_ADDRESS || '0x2b754AEd6BBb60871414aB3faCC201577BCf3120');
export const USDC_ADDRESS = hederaIdToEvmAddress(import.meta.env.VITE_USDC_ADDRESS || '0xA2Cc012e4ACb0f7383e000496Ad1d611e86Ace83');
export const DAI_ADDRESS = hederaIdToEvmAddress(import.meta.env.VITE_DAI_ADDRESS || '0x7d6A4D9E98F07B6cE11Af924ad281f7a8C6a8063');
export const HBARX_ADDRESS = hederaIdToEvmAddress(import.meta.env.VITE_HBARX_ADDRESS || '0x5CCCb7dD02DD3Ca308A39FB7B31Ab1AAa85fd2B7');
export const SAUCE_ADDRESS = hederaIdToEvmAddress(import.meta.env.VITE_SAUCE_ADDRESS || '0xa37e74DDa73c97c8998E73E08F989FeEF58160E4');

// Aliases for useHederaWallet and useStaking backwards compatibility
export const TOKEN_A_ADDRESS = WHBAR_ADDRESS;
export const TOKEN_B_ADDRESS = USDC_ADDRESS;
export const REWARD_TOKEN_ADDRESS = SAUCE_ADDRESS;
export const LP_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000'; // Deprecated global LP token
export const RHEO_TOKEN_ADDRESS = hederaIdToEvmAddress(import.meta.env.VITE_RHEO_TOKEN_ADDRESS || '0x00000000000000000000000000000000008dfe27');
export const STAKING_CONTRACT_ADDRESS = hederaIdToEvmAddress(import.meta.env.VITE_STAKING_CONTRACT_ADDRESS || '0x000000000000000000000000000000000085ae7f');

// Vaults
export const VAULT_USDC_DAI = hederaIdToEvmAddress(import.meta.env.VITE_VAULT_USDC_DAI || '0x9F8fc4ebd1456E2955d61a39eB6A36C911c68F55');
export const VAULT_HBAR_HBARX = hederaIdToEvmAddress(import.meta.env.VITE_VAULT_HBAR_HBARX || '0xA6DFC668715aAAAE4963E0834C19e25DDC57D2AF');
export const VAULT_USDC_HBAR = hederaIdToEvmAddress(import.meta.env.VITE_VAULT_USDC_HBAR || '0xF3e5A14d44CE91A7B742908741EB7469D60Bb554');
export const VAULT_USDC_SAUCE = hederaIdToEvmAddress(import.meta.env.VITE_VAULT_USDC_SAUCE || '0x063687558537ec5031677882D715D2B448580e22');
export const VAULT_DAI_HBAR = hederaIdToEvmAddress(import.meta.env.VITE_VAULT_DAI_HBAR || '0x5c1d6EcDfC68D3105cE280deAA14f1b017030DEc');
export const VAULT_HBAR_SAUCE = hederaIdToEvmAddress(import.meta.env.VITE_VAULT_HBAR_SAUCE || '0xA85B5E0f6c91d9C82944448ca7F50E5Ba246862e');

export const ZAP_ROUTER_ABI = (zapRouterAbi as any).abi || zapRouterAbi;
export const VAULT_ABI = rheoVaultAbi;

export const SAUCERSWAP_ROUTER_ABI = [
  {
    name: 'addLiquidity',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
      { name: 'amountADesired', type: 'uint256' },
      { name: 'amountBDesired', type: 'uint256' },
      { name: 'amountAMin', type: 'uint256' },
      { name: 'amountBMin', type: 'uint256' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ],
    outputs: [
      { name: 'amountA', type: 'uint256' },
      { name: 'amountB', type: 'uint256' },
      { name: 'liquidity', type: 'uint256' }
    ]
  },
  {
    name: 'removeLiquidity',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
      { name: 'liquidity', type: 'uint256' },
      { name: 'amountAMin', type: 'uint256' },
      { name: 'amountBMin', type: 'uint256' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ],
    outputs: [
      { name: 'amountA', type: 'uint256' },
      { name: 'amountB', type: 'uint256' }
    ]
  }
] as const;

export const STAKING_CONTRACT_ABI = [
  {
    name: 'stake',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_amount', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_amount', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'claimRewards',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: []
  },
  {
    name: 'pendingReward',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'totalStaked',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'stakers',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [
      { name: 'stakedAmount', type: 'uint256' },
      { name: 'rewardDebt', type: 'uint256' }
    ]
  }
] as const;

// Real decimals of each deployed token (USDC/DAI: 6, everything else: 8).
// Single source of truth — do not re-guess this from ad-hoc symbol comparisons.
const TOKEN_DECIMALS: Record<string, number> = {
  USDC: 6,
  DAI: 6,
  HBAR: 8,
  WHBAR: 8,
  HBARX: 8,
  SAUCE: 8,
};

export function getTokenDecimals(symbol: string): number {
  return TOKEN_DECIMALS[symbol] ?? 8;
}

