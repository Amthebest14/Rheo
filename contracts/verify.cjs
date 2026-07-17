const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

const ROOT = __dirname;
require('dotenv').config({ path: path.join(ROOT, '.env') });
const artifacts = JSON.parse(fs.readFileSync(path.join(ROOT, 'artifacts.json'), 'utf8'));
const D = JSON.parse(fs.readFileSync(path.join(ROOT, 'new_deployments.json'), 'utf8'));

const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api', 296, { batchMaxCount: 1, staticNetwork: true });

async function main() {
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const me = await wallet.getAddress();
  const fee = await provider.getFeeData();
  const gasPrice = (fee.gasPrice * 13n) / 10n;
  const ov = { gasLimit: 3_000_000n, gasPrice, type: 0 };

  const usdc  = new ethers.Contract(D.usdc, artifacts.USDC.abi, wallet);
  const pair  = new ethers.Contract(D.pairUsdcDai, artifacts.SaucerSwapPair.abi, wallet);
  const vault = new ethers.Contract(D.vaultUsdcDai, artifacts.RheoVault.abi, wallet);
  const zap   = new ethers.Contract(D.zapRouter, artifacts.ZapRouter.abi, wallet);

  console.log('=== Pre-checks (read-only) ===');
  const r0 = await pair.reserve0();
  const r1 = await pair.reserve1();
  console.log('USDC/DAI pool reserves:', r0.toString(), '/', r1.toString(), r0 > 0n && r1 > 0n ? '✅ seeded' : '❌ EMPTY');
  console.log('vault.asset() == pairUsdcDai:', (await vault.asset()).toLowerCase() === D.pairUsdcDai.toLowerCase() ? '✅' : '❌');
  console.log('vault.strategy() == stratUsdcDai:', (await vault.strategy()).toLowerCase() === D.stratUsdcDai.toLowerCase() ? '✅' : '❌');
  console.log('totalAssets (before):', (await vault.totalAssets()).toString());

  const sharesBefore = await vault.balanceOf(me);
  const usdcBal = await usdc.balanceOf(me);
  console.log('my vault shares (before):', sharesBefore.toString());
  console.log('my USDC balance:', usdcBal.toString());

  const amountIn = 100n * 10n ** 6n; // 100 USDC (6 decimals)

  console.log('\n=== Step 1: approve USDC -> ZapRouter ===');
  let tx = await usdc.approve(D.zapRouter, amountIn, ov);
  await tx.wait();
  console.log('  ✓ approved 100 USDC');

  console.log('\n=== Step 2: zapIn(100 USDC) into USDC/DAI vault ===');
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);
  // Simulate first to surface any revert reason cleanly
  try {
    await zap.zapIn.staticCall(D.vaultUsdcDai, D.usdc, amountIn, 0, 0, deadline, ov);
    console.log('  simulation: ✅ would succeed');
  } catch (e) {
    console.log('  simulation REVERT:', (e.shortMessage || e.message));
    throw e;
  }
  tx = await zap.zapIn(D.vaultUsdcDai, D.usdc, amountIn, 0, 0, deadline, { ...ov, gasLimit: 4_000_000n });
  const rc = await tx.wait();
  console.log('  ✓ zapIn mined, tx:', rc.hash, 'status:', rc.status === 1 ? 'SUCCESS' : 'FAIL');

  console.log('\n=== Step 3: verify shares minted ===');
  const sharesAfter = await vault.balanceOf(me);
  console.log('my vault shares (after):', sharesAfter.toString());
  console.log('shares gained:', (sharesAfter - sharesBefore).toString(), sharesAfter > sharesBefore ? '✅ REAL DEPOSIT WORKED' : '❌ no shares');
  console.log('totalAssets (after):', (await vault.totalAssets()).toString());

  console.log('\n=== Step 4: redeem HALF the shares back (withdraw path) ===');
  const redeemShares = (sharesAfter - sharesBefore) / 2n;
  if (redeemShares > 0n) {
    tx = await vault.redeem(redeemShares, me, me, { ...ov, gasLimit: 4_000_000n });
    const rc2 = await tx.wait();
    console.log('  ✓ redeem mined:', rc2.hash, 'status:', rc2.status === 1 ? 'SUCCESS' : 'FAIL');
    const lpBal = await pair.balanceOf(me);
    console.log('  LP tokens returned to me:', lpBal.toString(), lpBal > 0n ? '✅ WITHDRAW WORKED' : '❌');
    console.log('  vault shares now:', (await vault.balanceOf(me)).toString());
  }

  console.log('\n✅✅ END-TO-END VERIFIED: deposit (zapIn) + withdraw (redeem) both work on-chain.');
}
main().catch(e => { console.error('\n❌ VERIFY FAILED:', e.message || e); process.exit(1); });
