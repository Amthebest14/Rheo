# Rheo Finance — Hedera Testnet Deployment

Chain: **Hedera Testnet (chain ID 296)** · RPC: `https://testnet.hashio.io/api`

This is a single, self-consistent deployment of the full stack (tokens, a
Uniswap-V2-style mock DEX + farm, all 6 vault/strategy pairs, and the ZapRouter),
produced in one atomic run by `deploy.cjs`. All contracts point at each other
consistently. The deposit → swap → add-liquidity → vault-share and the
redeem → LP withdrawal paths are verified end-to-end on-chain.

## Live addresses (EVM)

| Contract | Address |
|---|---|
| ZapRouter | `0xAF626340612464c63b82ee1A31a1acbC5801Aa15` |
| SaucerSwap(mock) Router | `0xe7bc372D3faf6e906B8E497f20e7625d93364080` |
| Yield Farm | `0x4CB93554d6a744a814513162A43b0e307E96c045` |
| Faucet | `0xF39C92680C0A99C993d21c299639Cedf5916115d` |
| WHBAR | `0x2b754AEd6BBb60871414aB3faCC201577BCf3120` |
| USDC (6dp) | `0xA2Cc012e4ACb0f7383e000496Ad1d611e86Ace83` |
| DAI (6dp) | `0x7d6A4D9E98F07B6cE11Af924ad281f7a8C6a8063` |
| HBARX | `0x5CCCb7dD02DD3Ca308A39FB7B31Ab1AAa85fd2B7` |
| SAUCE | `0xa37e74DDa73c97c8998E73E08F989FeEF58160E4` |
| Vault USDC/DAI | `0x9F8fc4ebd1456E2955d61a39eB6A36C911c68F55` |
| Vault HBAR/HBARX | `0xA6DFC668715aAAAE4963E0834C19e25DDC57D2AF` |
| Vault USDC/HBAR | `0xF3e5A14d44CE91A7B742908741EB7469D60Bb554` |
| Vault USDC/SAUCE | `0x063687558537ec5031677882D715D2B448580e22` |
| Vault DAI/HBAR | `0x5c1d6EcDfC68D3105cE280deAA14f1b017030DEc` |
| Vault HBAR/SAUCE | `0xA85B5E0f6c91d9C82944448ca7F50E5Ba246862e` |

Strategy and pair addresses are in `new_deployments.json`. Frontend env-var
mapping is in `vercel_env.txt`.

## Verification (on-chain proof)

- Deposit (zapIn 100 USDC → USDC/DAI vault, shares minted):
  `0xa85ac8b2866c976456edf317919f29f114f366a65e9f92dbbdc70c38311045d9`
- Withdraw (redeem shares → LP returned):
  `0xce7a7b711914222fad736d4addf96fffeba7b2487071bff9f6d5248e8baead46`

Both `SUCCESS`, viewable at `https://hashscan.io/testnet/transaction/<hash>`.

## Reproduce / redeploy

Requires Node.js. No Foundry needed — compilation is via the `solc` npm package.

```bash
cd contracts
npm install                 # solc, @openzeppelin/contracts@5, ethers@6, dotenv
echo "PRIVATE_KEY=0x<funded testnet key>" > .env   # never commit this
node compile.cjs            # -> artifacts.json
node deploy.cjs --preflight # sanity-check key + balance
node deploy.cjs             # full deploy -> new_deployments.json
node verify.cjs             # end-to-end deposit/withdraw check
```

## Notes

- The 6 vaults run on the bundled mock DEX (`src/dex`, `src/farm`), a clean
  self-contained AMM. Pointing selected pairs at the real SaucerSwap router
  (`0.0.19264`) + real pools is a planned follow-up.
- `RheoVault.sol` withdrawal transfer was fixed (`_transferOut` → `SafeERC20.safeTransfer`).
- `src/dex/MockDEX.sol` and `src/Counter.sol` are unused legacy files and are
  excluded from `compile.cjs`.
