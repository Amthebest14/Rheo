const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const ROOT = __dirname;
require('dotenv').config({ path: path.join(ROOT, '.env') });
const artifacts = JSON.parse(fs.readFileSync(path.join(ROOT, 'artifacts.json'), 'utf8'));
const D = JSON.parse(fs.readFileSync(path.join(ROOT, 'new_deployments.json'), 'utf8'));
const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api', 296, { batchMaxCount: 1, staticNetwork: true });

// vault -> [tokenIn key, decimals of tokenIn]  (pick the non-WHBAR side as ERC-20 zapIn input)
const VAULTS = [
  { name: 'USDC/DAI',   vault: 'vaultUsdcDai',   tokenIn: 'usdc',  dec: 6 },
  { name: 'HBAR/HBARX', vault: 'vaultHbarHbarx', tokenIn: 'hbarx', dec: 8 },
  { name: 'USDC/HBAR',  vault: 'vaultUsdcHbar',  tokenIn: 'usdc',  dec: 6 },
  { name: 'USDC/SAUCE', vault: 'vaultUsdcSauce', tokenIn: 'usdc',  dec: 6 },
  { name: 'DAI/HBAR',   vault: 'vaultDaiHbar',   tokenIn: 'dai',   dec: 6 },
  { name: 'HBAR/SAUCE', vault: 'vaultHbarSauce', tokenIn: 'sauce', dec: 8 },
];

async function main() {
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const me = await wallet.getAddress();
  const fee = await provider.getFeeData();
  const gasPrice = (fee.gasPrice * 13n) / 10n;
  const ov = { gasLimit: 4_000_000n, gasPrice, type: 0 };
  const zap = new ethers.Contract(D.zapRouter, artifacts.ZapRouter.abi, wallet);

  const results = [];
  for (const v of VAULTS) {
    const label = v.name.padEnd(11);
    try {
      const tokenAddr = D[v.tokenIn];
      const token = new ethers.Contract(tokenAddr, artifacts.USDC.abi, wallet);
      const vault = new ethers.Contract(D[v.vault], artifacts.RheoVault.abi, wallet);
      const amountIn = 50n * 10n ** BigInt(v.dec);
      const before = await vault.balanceOf(me);
      let tx = await token.approve(D.zapRouter, amountIn, ov); await tx.wait();
      const dl = BigInt(Math.floor(Date.now()/1000)+600);
      tx = await zap.zapIn(D[v.vault], tokenAddr, amountIn, 0, 0, dl, ov); const rc = await tx.wait();
      const after = await vault.balanceOf(me);
      const ok = after > before && rc.status === 1;
      console.log(`${ok?'✅':'❌'} ${label} zapIn(${v.tokenIn}) shares +${(after-before).toString()}  tx ${rc.hash.slice(0,12)}…`);
      results.push([v.name, ok]);
    } catch (e) {
      console.log(`❌ ${label} FAILED: ${(e.shortMessage||e.message).slice(0,90)}`);
      results.push([v.name, false]);
    }
  }

  // Native HBAR path into HBAR/HBARX vault (whbar is tokenA there)
  console.log('\n=== Native HBAR path: zapInHBAR into HBAR/HBARX ===');
  try {
    const vault = new ethers.Contract(D.vaultHbarHbarx, artifacts.RheoVault.abi, wallet);
    const before = await vault.balanceOf(me);
    const dl = BigInt(Math.floor(Date.now()/1000)+600);
    const hbarValue = ethers.parseEther('2'); // 2 HBAR (18-dec wei at EVM layer)
    // simulate first for a clean revert reason
    try {
      await zap.zapInHBAR.staticCall(D.vaultHbarHbarx, D.whbar, 0, 0, dl, { ...ov, value: hbarValue });
      console.log('  simulation: ✅ would succeed');
    } catch (e) {
      console.log('  simulation REVERT:', (e.shortMessage||e.message).slice(0,140));
    }
    const tx = await zap.zapInHBAR(D.vaultHbarHbarx, D.whbar, 0, 0, dl, { ...ov, gasLimit: 5_000_000n, value: hbarValue });
    const rc = await tx.wait();
    const after = await vault.balanceOf(me);
    const ok = after > before && rc.status === 1;
    console.log(`${ok?'✅':'❌'} zapInHBAR shares +${(after-before).toString()}  tx ${rc.hash.slice(0,12)}… status ${rc.status}`);
    results.push(['zapInHBAR', ok]);
  } catch (e) {
    console.log(`❌ zapInHBAR FAILED: ${(e.shortMessage||e.message).slice(0,140)}`);
    results.push(['zapInHBAR', false]);
  }

  console.log('\n=== SUMMARY ===');
  for (const [n, ok] of results) console.log(`  ${ok?'PASS':'FAIL'}  ${n}`);
  const passed = results.filter(r=>r[1]).length;
  console.log(`\n${passed}/${results.length} flows passed.`);
}
main().catch(e => { console.error('FATAL', e.message||e); process.exit(1); });
