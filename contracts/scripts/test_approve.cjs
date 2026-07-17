const { ethers } = require('ethers');

const RPC_URL = 'https://testnet.hashio.io/api';
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY.trim();
const USDC = '0xfe7cc3ceb7b1128bfc3889184e2d5561bf74bfb3';
const ROUTER_ADDRESS = '0x0000000000000000000000000000000000004b40'; // SaucerSwap Router

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const usdcToken = new ethers.Contract(USDC, ERC20_ABI, wallet);

  console.log("Checking allowance...");
  const allowance = await usdcToken.allowance(wallet.address, ROUTER_ADDRESS);
  console.log("Current allowance:", allowance.toString());

  console.log("Approving 0...");
  try {
      const approve0Tx = await usdcToken.approve(ROUTER_ADDRESS, 0, { type: 0, gasLimit: 500000 });
      await approve0Tx.wait();
      console.log("Approve 0 successful.");
  } catch (e) {
      console.log("Approve 0 failed:", e.message);
  }

  console.log("Approving 100...");
  try {
      const approveTx = await usdcToken.approve(ROUTER_ADDRESS, 100, { type: 0, gasLimit: 500000 });
      await approveTx.wait();
      console.log("Approve 100 successful.");
  } catch (e) {
      console.log("Approve 100 failed:", e.message);
  }
}

main().catch(console.error);
