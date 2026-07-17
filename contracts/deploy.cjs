const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

const ROOT = __dirname;
const RPC = 'https://testnet.hashio.io/api';
const CHAIN_ID = 296;

const artifacts = JSON.parse(fs.readFileSync(path.join(ROOT, 'artifacts.json'), 'utf8'));
require('dotenv').config({ path: path.join(ROOT, '.env') });
const PK = process.env.PRIVATE_KEY;
if (!PK) { console.error('No PRIVATE_KEY in .env'); process.exit(1); }

const PREFLIGHT_ONLY = process.argv.includes('--preflight');

// decimals helpers
const e6 = (n) => BigInt(n) * 10n ** 6n;
const e8 = (n) => BigInt(n) * 10n ** 8n;

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC, CHAIN_ID, { batchMaxCount: 1, staticNetwork: true });
  const wallet = new ethers.Wallet(PK, provider);
  const deployer = await wallet.getAddress();

  const bal = await provider.getBalance(deployer);
  const fee = await provider.getFeeData();
  let gasPrice = fee.gasPrice ?? ethers.parseUnits('600', 'gwei');
  gasPrice = (gasPrice * 13n) / 10n; // +30% headroom for Hashio min-price swings

  console.log('Deployer EVM address :', deployer);
  console.log('Balance (HBAR)       :', ethers.formatEther(bal), '(shown as ether; Hedera weibars)');
  console.log('Gas price (gwei)     :', ethers.formatUnits(gasPrice, 'gwei'));
  console.log('Expected account     : 0x7d1aa8ea113b9d8f07cd47c5677f0b0c24a6cc34 (0.0.8064863)');

  if (bal === 0n) { console.error('❌ Account has zero balance; cannot deploy.'); process.exit(1); }
  if (PREFLIGHT_ONLY) { console.log('\n✅ Preflight OK. Re-run without --preflight to deploy.'); return; }

  const out = {};
  const save = () => fs.writeFileSync(path.join(ROOT, 'new_deployments.json'), JSON.stringify(out, null, 2));

  const overridesDeploy = { gasLimit: 6_000_000n, gasPrice, type: 0 };
  const overridesCall   = { gasLimit: 2_000_000n, gasPrice, type: 0 };

  async function deploy(key, contractName, args = [], gasLimit) {
    const art = artifacts[contractName];
    if (!art) throw new Error('missing artifact ' + contractName);
    const factory = new ethers.ContractFactory(art.abi, art.bytecode, wallet);
    const ov = gasLimit ? { ...overridesDeploy, gasLimit } : overridesDeploy;
    const c = await factory.deploy(...args, ov);
    await c.waitForDeployment();
    const addr = await c.getAddress();
    out[key] = addr;
    save();
    console.log(`  deployed ${contractName.padEnd(20)} ${key.padEnd(16)} -> ${addr}`);
    return new ethers.Contract(addr, art.abi, wallet);
  }
  async function call(label, txPromise) {
    const tx = await txPromise;
    await tx.wait();
    console.log(`  ✓ ${label}`);
  }

  console.log('\n=== 1. Tokens ===');
  const whbar = await deploy('whbar', 'WHBAR', [], 3_000_000n);
  const usdc  = await deploy('usdc',  'USDC',  [], 3_000_000n);
  const dai   = await deploy('dai',   'DAI',   [], 3_000_000n);
  const hbarx = await deploy('hbarx', 'HBARX', [], 3_000_000n);
  const sauce = await deploy('sauce', 'SAUCE', [], 3_000_000n);

  console.log('\n=== 2. Pairs ===');
  const A = { whbar: out.whbar, usdc: out.usdc, dai: out.dai, hbarx: out.hbarx, sauce: out.sauce };
  const pairUsdcDai   = await deploy('pairUsdcDai',   'SaucerSwapPair', [A.usdc, A.dai], 3_000_000n);
  const pairHbarHbarx = await deploy('pairHbarHbarx', 'SaucerSwapPair', [A.whbar, A.hbarx], 3_000_000n);
  const pairUsdcHbar  = await deploy('pairUsdcHbar',  'SaucerSwapPair', [A.usdc, A.whbar], 3_000_000n);
  const pairUsdcSauce = await deploy('pairUsdcSauce', 'SaucerSwapPair', [A.usdc, A.sauce], 3_000_000n);
  const pairDaiHbar   = await deploy('pairDaiHbar',   'SaucerSwapPair', [A.dai, A.whbar], 3_000_000n);
  const pairHbarSauce = await deploy('pairHbarSauce', 'SaucerSwapPair', [A.whbar, A.sauce], 3_000_000n);

  console.log('\n=== 3. Router + register pairs ===');
  const router = await deploy('router', 'SaucerSwapV1Router', [A.whbar], 4_000_000n);
  await call('register usdc/dai',   router.registerPair(A.usdc, A.dai, out.pairUsdcDai, overridesCall));
  await call('register hbar/hbarx', router.registerPair(A.whbar, A.hbarx, out.pairHbarHbarx, overridesCall));
  await call('register usdc/hbar',  router.registerPair(A.usdc, A.whbar, out.pairUsdcHbar, overridesCall));
  await call('register usdc/sauce', router.registerPair(A.usdc, A.sauce, out.pairUsdcSauce, overridesCall));
  await call('register dai/hbar',   router.registerPair(A.dai, A.whbar, out.pairDaiHbar, overridesCall));
  await call('register hbar/sauce', router.registerPair(A.whbar, A.sauce, out.pairHbarSauce, overridesCall));

  console.log('\n=== 4. Farm ===');
  const farm = await deploy('farm', 'SaucerSwapYieldFarm', [A.sauce, e8(1)], 4_000_000n);
  await call('sauce.setFarm', sauce.setFarm(out.farm, overridesCall));
  await call('farm.add pid0 usdc/dai',   farm.add(100, out.pairUsdcDai, overridesCall));
  await call('farm.add pid1 hbar/hbarx', farm.add(100, out.pairHbarHbarx, overridesCall));
  await call('farm.add pid2 usdc/hbar',  farm.add(100, out.pairUsdcHbar, overridesCall));
  await call('farm.add pid3 usdc/sauce', farm.add(100, out.pairUsdcSauce, overridesCall));
  await call('farm.add pid4 dai/hbar',   farm.add(100, out.pairDaiHbar, overridesCall));
  await call('farm.add pid5 hbar/sauce', farm.add(100, out.pairHbarSauce, overridesCall));

  console.log('\n=== 5. Faucet + funding ===');
  const faucet = await deploy('faucet', 'RheoFaucet', [A.whbar, A.usdc, A.dai, A.hbarx, A.sauce], 4_000_000n);
  await call('mint whbar->faucet', whbar.mint(out.faucet, e8(1_000_000), overridesCall));
  await call('mint usdc->faucet',  usdc.mint(out.faucet, e6(1_000_000), overridesCall));
  await call('mint dai->faucet',   dai.mint(out.faucet, e6(1_000_000), overridesCall));
  await call('mint hbarx->faucet', hbarx.mint(out.faucet, e8(1_000_000), overridesCall));
  await call('mint sauce->faucet', sauce.mint(out.faucet, e8(1_000_000), overridesCall));

  console.log('\n=== 6. Vaults + Strategies ===');
  async function vaultStrat(vkey, skey, name, sym, pair, tA, tB, pid) {
    const vault = await deploy(vkey, 'RheoVault', [pair, name, sym, deployer], 6_000_000n);
    const strat = await deploy(skey, 'StrategyContract', [out[vkey], pair, tA, tB, A.sauce, out.router, out.farm, pid, deployer], 5_000_000n);
    await call(`${vkey}.setStrategy`, vault.setStrategy(out[skey], overridesCall));
  }
  await vaultStrat('vaultUsdcDai','stratUsdcDai','Rheo USDC/DAI','rUSDC-DAI', out.pairUsdcDai, A.usdc, A.dai, 0);
  await vaultStrat('vaultHbarHbarx','stratHbarHbarx','Rheo HBAR/HBARX','rHBAR-HBARX', out.pairHbarHbarx, A.whbar, A.hbarx, 1);
  await vaultStrat('vaultUsdcHbar','stratUsdcHbar','Rheo USDC/HBAR','rUSDC-HBAR', out.pairUsdcHbar, A.usdc, A.whbar, 2);
  await vaultStrat('vaultUsdcSauce','stratUsdcSauce','Rheo USDC/SAUCE','rUSDC-SAUCE', out.pairUsdcSauce, A.usdc, A.sauce, 3);
  await vaultStrat('vaultDaiHbar','stratDaiHbar','Rheo DAI/HBAR','rDAI-HBAR', out.pairDaiHbar, A.dai, A.whbar, 4);
  await vaultStrat('vaultHbarSauce','stratHbarSauce','Rheo HBAR/SAUCE','rHBAR-SAUCE', out.pairHbarSauce, A.whbar, A.sauce, 5);

  console.log('\n=== 7. ZapRouter ===');
  await deploy('zapRouter', 'ZapRouter', [out.router], 5_000_000n);

  console.log('\n=== 8. Seed liquidity ===');
  await call('mint whbar->deployer', whbar.mint(deployer, e8(1_000_000), overridesCall));
  await call('mint usdc->deployer',  usdc.mint(deployer, e6(1_000_000), overridesCall));
  await call('mint dai->deployer',   dai.mint(deployer, e6(1_000_000), overridesCall));
  await call('mint hbarx->deployer', hbarx.mint(deployer, e8(1_000_000), overridesCall));
  await call('mint sauce->deployer', sauce.mint(deployer, e8(1_000_000), overridesCall));

  const MAX = ethers.MaxUint256;
  await call('approve whbar', whbar.approve(out.router, MAX, overridesCall));
  await call('approve usdc',  usdc.approve(out.router, MAX, overridesCall));
  await call('approve dai',   dai.approve(out.router, MAX, overridesCall));
  await call('approve hbarx', hbarx.approve(out.router, MAX, overridesCall));
  await call('approve sauce', sauce.approve(out.router, MAX, overridesCall));

  const dl = () => BigInt(Math.floor(Date.now() / 1000) + 600);
  await call('seed usdc/dai',   router.addLiquidity(A.usdc, A.dai,   e6(10_000), e6(10_000), 0, 0, deployer, dl(), overridesCall));
  await call('seed hbar/hbarx', router.addLiquidity(A.whbar, A.hbarx, e8(10_000), e8(9_523), 0, 0, deployer, dl(), overridesCall));
  await call('seed usdc/hbar',  router.addLiquidity(A.usdc, A.whbar, e6(1_000), e8(10_000), 0, 0, deployer, dl(), overridesCall));
  await call('seed usdc/sauce', router.addLiquidity(A.usdc, A.sauce, e6(1_000), e8(20_000), 0, 0, deployer, dl(), overridesCall));
  await call('seed dai/hbar',   router.addLiquidity(A.dai, A.whbar,  e6(1_000), e8(10_000), 0, 0, deployer, dl(), overridesCall));
  await call('seed hbar/sauce', router.addLiquidity(A.whbar, A.sauce, e8(10_000), e8(20_000), 0, 0, deployer, dl(), overridesCall));

  const finalBal = await provider.getBalance(deployer);
  console.log('\n✅ DEPLOY COMPLETE. HBAR spent:', ethers.formatEther(bal - finalBal));
  console.log('Addresses written to new_deployments.json');
  save();
}

main().catch((e) => { console.error('\n❌ FAILED:', e.message || e); process.exit(1); });
