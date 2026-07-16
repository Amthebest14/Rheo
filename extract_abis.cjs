const fs = require('fs');
const path = require('path');

try {
  const targetDir = path.join(__dirname, 'src', 'config', 'abis');
  fs.mkdirSync(targetDir, { recursive: true });

  // RheoVault
  const vaultPath = path.join(__dirname, '..', 'rheo-contracts', 'out', 'RheoVault.sol', 'RheoVault.json');
  const vaultRaw = fs.readFileSync(vaultPath, 'utf8');
  const vaultAbi = JSON.parse(vaultRaw).abi;
  fs.writeFileSync(path.join(targetDir, 'RheoVault.json'), JSON.stringify(vaultAbi, null, 2));

  // ZapRouter
  const zapPath = path.join(__dirname, '..', 'rheo-contracts', 'out', 'ZapRouter.sol', 'ZapRouter.json');
  const zapRaw = fs.readFileSync(zapPath, 'utf8');
  const zapAbi = JSON.parse(zapRaw).abi;
  fs.writeFileSync(path.join(targetDir, 'ZapRouter.json'), JSON.stringify(zapAbi, null, 2));

  console.log('ABIs successfully extracted to src/config/abis/');
} catch (error) {
  console.error('Failed to extract ABIs:', error);
  process.exit(1);
}
