const { ethers } = require('ethers');

const RPC_URL = 'https://testnet.hashio.io/api';
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY.trim();
const ROUTER_ADDRESS = '0x0000000000000000000000000000000000004b40'; // SaucerSwap Router
const WHBAR = '0x0000000000000000000000000000000000003ad2';
const USDC = '0x0000000000000000000000000000000000001549'; // 0.0.5449

const ROUTER_ABI = [
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)"
];
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, wallet);
  const usdcToken = new ethers.Contract(USDC, ERC20_ABI, wallet);

  console.log("1. Swapping HBAR for USDC...");
  const swapTx = await router.swapExactETHForTokens(
    0,
    [WHBAR, USDC],
    wallet.address,
    Math.floor(Date.now() / 1000) + 1000,
    { value: ethers.parseEther("5"), type: 0, gasLimit: 1000000 }
  );
  await swapTx.wait();
  console.log("Swap successful.");

  const usdcBalance = await usdcToken.balanceOf(wallet.address);
  console.log("USDC Balance:", usdcBalance.toString());

  console.log("2. Approving USDC for Router...");
  const approveTx = await usdcToken.approve(ROUTER_ADDRESS, usdcBalance, { type: 0, gasLimit: 500000 });
  await approveTx.wait();
  console.log("Approve successful.");

  console.log("3. Adding Liquidity...");
  const addLiqTx = await router.addLiquidityETH(
    USDC,
    usdcBalance,
    0,
    0,
    wallet.address,
    Math.floor(Date.now() / 1000) + 1000,
    { value: ethers.parseEther("5"), type: 0, gasLimit: 2000000 }
  );
  await addLiqTx.wait();
  console.log("Add Liquidity successful.");
}

main().catch(console.error);
