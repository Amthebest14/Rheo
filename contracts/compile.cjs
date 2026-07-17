const fs = require('fs');
const path = require('path');
const solc = require('solc');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');

// Recursively collect all .sol files under src/
function walk(dir, acc = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, acc);
    else if (f.endsWith('.sol')) acc.push(p);
  }
  return acc;
}

// Exclude dead/boilerplate files not used by DeployAll (MockDEX has a broken import path)
const EXCLUDE = ['src/dex/MockDEX.sol', 'src/Counter.sol'];
const sources = {};
for (const file of walk(SRC)) {
  const rel = path.relative(ROOT, file); // e.g. src/RheoVault.sol
  if (EXCLUDE.includes(rel)) continue;
  sources[rel] = { content: fs.readFileSync(file, 'utf8') };
}

// Import resolver: @openzeppelin/... -> node_modules; relative handled by solc via base
function findImports(importPath) {
  try {
    let full;
    if (importPath.startsWith('@openzeppelin/')) {
      full = path.join(ROOT, 'node_modules', importPath);
    } else if (importPath.startsWith('src/')) {
      full = path.join(ROOT, importPath);
    } else {
      // relative import already resolved by solc against importer; but solc passes
      // resolved paths here. Try as-is from ROOT.
      full = path.join(ROOT, importPath);
    }
    return { contents: fs.readFileSync(full, 'utf8') };
  } catch (e) {
    return { error: 'File not found: ' + importPath };
  }
}

const input = {
  language: 'Solidity',
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    viaIR: true,
    evmVersion: 'cancun',
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
  },
};

console.error('Compiling', Object.keys(sources).length, 'source files (viaIR, this may take a minute)...');
const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

let hasError = false;
if (output.errors) {
  for (const e of output.errors) {
    if (e.severity === 'error') { hasError = true; console.error('ERROR:', e.formattedMessage); }
  }
}
if (hasError) { console.error('\n❌ Compilation failed.'); process.exit(1); }

// Flatten: contractName -> {abi, bytecode}
const artifacts = {};
for (const file of Object.keys(output.contracts || {})) {
  for (const name of Object.keys(output.contracts[file])) {
    const c = output.contracts[file][name];
    artifacts[name] = { abi: c.abi, bytecode: '0x' + c.evm.bytecode.object };
  }
}
fs.writeFileSync(path.join(ROOT, 'artifacts.json'), JSON.stringify(artifacts, null, 2));
console.error('✅ Compiled', Object.keys(artifacts).length, 'contracts -> artifacts.json');
console.error('Key contracts present:', ['RheoVault','StrategyContract','ZapRouter','SaucerSwapV1Router','SaucerSwapPair','SaucerSwapYieldFarm','RheoFaucet','USDC','DAI','HBARX','SAUCE','WHBAR'].filter(n=>artifacts[n]).join(', '));
