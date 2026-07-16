const fs = require('fs');
let code = fs.readFileSync('src/pages/DashboardTerminal.tsx', 'utf8');

// Chunk 1: State
code = code.replace(
/  const \[activeTab, setActiveTab\] = useState<'deposit' \| 'withdraw'>\('deposit'\)[\s\S]*?const parsedRatio = parseFloat\(ratio as string\) \|\| 1/,
`  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit')
  const [token, setToken] = useState<string>('HBAR') // Default to HBAR as the base token
  const [amount, setAmount] = useState('')
  const [withdrawPercent, setWithdrawPercent] = useState<number>(0)
  const [showSlippage, setShowSlippage] = useState(false)
  const [slippage, setSlippage] = useState<SlippageOption>('0.5')
  const [depositStep, setDepositStep] = useState<DepositStep>('idle')
  const [chartMode, setChartMode] = useState<'tvl' | 'apy'>('tvl')

  const isTokenA = token === vault.tokenA

  const tokenAWalletBalance = balances[vault.tokenA] ?? 0
  const tokenBWalletBalance = balances[vault.tokenB] ?? 0

  const parsedAmount = parseFloat(amount) || 0`
);

// Chunk 2: Math
code = code.replace(
/  const maxUsableAForWallet = Math\.min\(tokenAWalletBalance, tokenBWalletBalance \/ parsedRatio\)[\s\S]*?const hasAmount = isZapMode\n    \? parsedZapAmount > 0\n    : activeTab === 'deposit' \? \(parsedAmountA > 0 \|\| parsedAmountB > 0\) : withdrawPercent > 0/,
`  // Zap math
  const swapAmount       = parsedAmount * 0.5
  const retainedAmount   = parsedAmount * 0.5
  const swapFee          = swapAmount * 0.003
  const priceA = tokenPrices[vault.tokenA] || 1
  const priceB = tokenPrices[vault.tokenB] || 1
  const swapRatio        = isTokenA ? (priceA / priceB) : (priceB / priceA)
  const swapOutputRaw    = (swapAmount - swapFee) * swapRatio
  const finalDepositA    = isTokenA ? retainedAmount : swapOutputRaw
  const finalDepositB    = isTokenA ? swapOutputRaw  : retainedAmount

  // Withdraw math
  const userUsdValue     = (userVaultBalanceTokenA * priceA + userVaultBalanceTokenB * priceB)
  const valueToWithdrawUsd = userUsdValue * withdrawPercent
  const withdrawA        = userVaultBalanceTokenA * withdrawPercent
  const withdrawB        = userVaultBalanceTokenB * withdrawPercent

  const receiveShares = (parsedAmount / (priceA + priceB) * 2).toFixed(4)
  const hasAmount = activeTab === 'deposit' ? parsedAmount > 0 : withdrawPercent > 0`
);

// Chunk 3: handleAction
code = code.replace(
/    if \(activeTab === 'deposit'\) {[\s\S]*?hash: mockHashLink,\n      }\)\n    }/,
`    if (activeTab === 'deposit') {
      deposit(vault.id, finalDepositA, finalDepositB, vault.tokenA, vault.tokenB, vault.baseApr)
      awardPoints(finalDepositA * priceA + finalDepositB * priceB, 'Deposit')
      addTransaction({
        id: \`tx-\${Date.now()}@hedera\`,
        type: 'deposit',
        vaultId: vault.id,
        amounts: [{ asset: token, quantity: parsedAmount }],
        timestamp: Date.now(),
        status: 'success',
        hash: mockHashLink,
      })
    } else {
      withdraw(vault.id, withdrawPercent)
      awardPoints(valueToWithdrawUsd, 'Withdraw')
      addTransaction({
        id: \`tx-\${Date.now()}@hedera\`,
        type: 'withdraw',
        vaultId: vault.id,
        amounts: [{ asset: vault.tokenA, quantity: withdrawA }, { asset: vault.tokenB, quantity: withdrawB }],
        timestamp: Date.now(),
        status: 'success',
        hash: mockHashLink,
      })
    }`
);

// Chunk 4: handleFraction
code = code.replace(
/    setAmountA\(''\)\n    setAmountB\(''\)\n    setZapAmount\(''\)\n    setWithdrawPercent\(0\)\n    setTimeout\(\(\) => setDepositStep\('idle'\), 2000\)\n  }\n\n  const handleFraction = \(pct: number\) => {\n    if \(activeTab === 'deposit'\) {\n      handleAmountAChange\(\(maxUsableAForWallet \* pct\)\.toString\(\)\)\n    } else {\n      setWithdrawPercent\(pct\)\n    }\n  }\n\n  const isAInsufficient = activeTab === 'deposit' && \(isZapMode \? \(isZapTokenA && parsedZapAmount > tokenAWalletBalance\) : parsedAmountA > tokenAWalletBalance\)\n  const isBInsufficient = activeTab === 'deposit' && \(isZapMode \? \(!isZapTokenA && parsedZapAmount > tokenBWalletBalance\) : parsedAmountB > tokenBWalletBalance\)\n\n  let idleLabel = 'Review Parameters'\n  let idleDisabled = !hasAmount\n\n  if \(activeTab === 'deposit' && hasAmount\) {\n    if \(isZapMode && \(\(isZapTokenA && isAInsufficient\) \|\| \(!isZapTokenA && isBInsufficient\)\)\) {\n      idleLabel = 'Insufficient Balance'; idleDisabled = true\n    } else if \(!isZapMode && \(isAInsufficient \|\| isBInsufficient\)\) {\n      idleLabel = 'Insufficient Balance'; idleDisabled = true\n    } else {\n      idleLabel = 'Deposit Liquidity'; idleDisabled = false\n    }\n  } else if \(activeTab === 'withdraw' && hasAmount\) {\n    idleLabel = 'Withdraw Liquidity'; idleDisabled = false\n  }/,
`    setAmount('')
    setWithdrawPercent(0)
    setTimeout(() => setDepositStep('idle'), 2000)
  }

  const handleFraction = (pct: number) => {
    if (activeTab === 'deposit') {
      const maxBalance = isTokenA ? tokenAWalletBalance : tokenBWalletBalance;
      setAmount((maxBalance * pct).toString())
    } else {
      setWithdrawPercent(pct)
    }
  }

  const isInsufficient = activeTab === 'deposit' && (isTokenA ? parsedAmount > tokenAWalletBalance : parsedAmount > tokenBWalletBalance)

  let idleLabel = 'Review Parameters'
  let idleDisabled = !hasAmount

  if (activeTab === 'deposit' && hasAmount) {
    if (isInsufficient) {
      idleLabel = 'Insufficient Balance'; idleDisabled = true
    } else {
      idleLabel = 'Deposit Liquidity'; idleDisabled = false
    }
  } else if (activeTab === 'withdraw' && hasAmount) {
    idleLabel = 'Withdraw Liquidity'; idleDisabled = false
  }`
);

// Chunk 5: JSX Action Desk
code = code.replace(
/            <div className="p-6 flex flex-col gap-6 flex-1 relative z-10">\n              \{activeTab === 'deposit' \? \([\s\S]*?\) : \(/,
`            <div className="p-6 flex flex-col gap-6 flex-1 relative z-10">
              {activeTab === 'deposit' ? (
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-ash">Select Deposit Asset</span>
                    <div className="flex gap-2">
                      <button onClick={() => setToken(vault.tokenA)} className={\`px-2 py-1 rounded border \${isTokenA ? 'bg-azure/20 border-azure/50 text-white' : 'bg-white/[0.02] border-white/[0.05] text-slate-muted'}\`}>{vault.tokenA}</button>
                      <button onClick={() => setToken(vault.tokenB)} className={\`px-2 py-1 rounded border \${!isTokenA ? 'bg-azure/20 border-azure/50 text-white' : 'bg-white/[0.02] border-white/[0.05] text-slate-muted'}\`}>{vault.tokenB}</button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 relative">
                    <div className="flex items-center justify-between text-xs text-slate-muted mb-1">
                      <span className="font-semibold uppercase tracking-wider text-slate-ash">Amount</span>
                      <span>Balance: <span className="font-mono text-slate-platinum">{isTokenA ? tokenAWalletBalance.toFixed(4) : tokenBWalletBalance.toFixed(4)} {token}</span></span>
                    </div>
                    
                    <div className={\`flex items-center gap-2 px-4 py-3.5 rounded-xl border transition-all duration-200 \${
                      parsedAmount > 0 ? 'border-cyan-electric/40 bg-cyan-electric/5' : 'border-white/[0.08] bg-[#050A14]'
                    }\`}>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="flex-1 bg-transparent text-slate-platinum text-xl font-bold placeholder:text-slate-muted outline-none tabular-nums min-w-0"
                        disabled={depositStep !== 'idle'}
                      />
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <img src={isTokenA ? vault.tokenAIcon : vault.tokenBIcon} className="w-5 h-5 rounded-full" alt={token} />
                        <span className="text-slate-platinum text-sm font-bold">{token}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      {fractionOptions.map(pct => (
                        <button
                          key={pct}
                          onClick={() => handleFraction(pct)}
                          disabled={depositStep !== 'idle'}
                          className="flex-1 py-1.5 rounded-lg border border-white/[0.05] bg-white/[0.02] text-slate-ash hover:bg-white/[0.05] hover:text-slate-platinum transition-colors text-[10px] font-bold"
                        >
                          {pct === 1.0 ? 'MAX' : \`\${pct * 100}%\`}
                        </button>
                      ))}
                    </div>

                    {isInsufficient && <span className="text-[10px] text-red-400 absolute -bottom-5">Insufficient {token} balance</span>}
                  </div>

                  <div className="flex items-center justify-between mt-2 p-3 rounded-lg bg-cyan-electric/5 border border-cyan-electric/10">
                    <span className="text-xs text-slate-ash flex items-center gap-2"><ArrowDownRight className="h-4 w-4 text-cyan-electric" /> Auto-Swap</span>
                    <span className="text-xs font-mono text-slate-platinum">50% to {isTokenA ? vault.tokenB : vault.tokenA}</span>
                  </div>
                </div>
              ) : (`
);

if (code.includes('setAmountA')) {
  console.log("Chunk 4 failed to replace");
}

fs.writeFileSync('src/pages/DashboardTerminal.tsx', code);
