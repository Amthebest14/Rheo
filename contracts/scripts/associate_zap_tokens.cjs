// Script to associate HTS tokens with the new ZapRouter contract
// Run with: node scripts/associate_zap_tokens.cjs

const { ethers } = require('ethers');

const ZAP_ROUTER_ADDRESS = '0xd67e23f9089cf25400368ae90a054d5032ba1584';
const RPC_URL = 'https://testnet.hashio.io/api';
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

// Token addresses (EVM format)
const WHBAR   = '0x0000000000000000000000000000000000003ad2'; // 0.0.15058
const USDC    = '0x0000000000000000000000000000000000068cda'; // 0.0.429274
const LP_TOKEN = '0xfe7cc3ceb7b1128bfc3889184e2d5561bf74bfb3'; // SaucerSwap LP

const ZAP_ABI = [
  {
    "name": "associateTokens",
    "type": "function",
    "stateMutability": "nonpayable",
    "inputs": [{"name": "tokens", "type": "address[]"}],
    "outputs": []
  }
];

async function main() {
  if (!PRIVATE_KEY) {
    console.error('ERROR: Set DEPLOYER_PRIVATE_KEY environment variable');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const zapRouter = new ethers.Contract(ZAP_ROUTER_ADDRESS, ZAP_ABI, wallet);

  console.log('Associating tokens with ZapRouter:', ZAP_ROUTER_ADDRESS);
  console.log('Tokens:', [WHBAR, USDC, LP_TOKEN]);

  const tx = await zapRouter.associateTokens([WHBAR, USDC, LP_TOKEN], {
    gasLimit: 500000,
    type: 0, // legacy
    gasPrice: ethers.parseUnits('1200', 'gwei'),
  });

  console.log('Transaction sent:', tx.hash);
  const receipt = await tx.wait();
  console.log('Confirmed! Status:', receipt.status === 1 ? 'SUCCESS' : 'FAILED');
  console.log('ZapRouter is now associated with WHBAR, USDC, and LP tokens.');
}

main().catch(console.error);
