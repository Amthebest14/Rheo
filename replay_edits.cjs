const fs = require('fs');

const transcriptPath = 'C:\\Users\\DELL\\.gemini\\antigravity\\brain\\55470cde-ae72-4eef-937e-09d3e616cd9e\\.system_generated\\logs\\transcript_full.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(l => l.trim());

let content = '';
let foundStart = false;

for (const line of lines) {
  let obj;
  try { obj = JSON.parse(line); } catch(e) { continue; }
  
  const stepIndex = obj.step_index;
  const toolCalls = obj.tool_calls || [];
  
  for (const tc of toolCalls) {
    const name = tc.name || tc.function?.name || '';
    const args = tc.args || tc.arguments || tc.function?.arguments || {};
    let parsedArgs = typeof args === 'string' ? (() => { try { return JSON.parse(args); } catch(e) { return {}; } })() : args;
    const targetFile = parsedArgs.TargetFile || '';
    
    if (!targetFile.includes('DashboardTerminal')) continue;
    
    if (name === 'write_to_file') {
      if (stepIndex === 240) {
        content = (parsedArgs.CodeContent || '').replace(/\r\n/g, '\n');
        foundStart = true;
        console.log(`[STEP ${stepIndex}] Initialized content from write_to_file (length ${content.length})`);
      }
    }
  }
}

if (!foundStart) {
  console.error("Failed to find initial write_to_file at step 240");
  process.exit(1);
}

// Map of overrides for fuzzy matches
const overrides = {
  "355_3": {
    // Handled in special code block below
  },
  "401_1": {
    search: `type TabId          = 'markets' | 'portfolio'
type WalletState    = 'idle' | 'connecting' | 'connected'
type DepositStep    = 'idle' | 'approve' | 'signing' | 'success' | 'error'
type SortConfig     = 'apy-desc' | 'apy-asc' | 'tvl-desc' | 'balance-desc'`,
    replace: `type TabId          = 'markets' | 'portfolio'
type SortConfig     = 'tvl-desc' | 'apy-desc' | 'apy-asc' | 'balance-desc'
type DepositStep    = 'idle' | 'approve' | 'signing' | 'success'`
  },
  "693_5": {
    search: `              )}

              {/* Bottom status strip */}`,
    replace: `              )}

              <RecentActivity />

              {/* Bottom status strip */}`
  },
  "1058_10": {
    search: `                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-azure/60" /> {VAULTS.length} vaults · SaucerSwap V2</span>
                  <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-cyan-electric/60" /> Keeper: ACTIVE</span>`,
    replace: `                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-azure/60" /> {vaults.length} vaults · SaucerSwap V2</span>
                  <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-cyan-electric/60" /> Keeper: ACTIVE</span>`
  },
  "1116": {
    search: `  const actionConfigMap = {
    idle:    { label: idleLabel,                     disabled: idleDisabled },
    approve: { label: 'Approve Protocol Allowance…', disabled: true       },
    signing: { label: 'Awaiting Hashpack Signature…',disabled: true       },
    success: { label: 'Success Toast Notification',  disabled: false      },
    error:   { label: 'Transaction Failed',          disabled: false      },
  } as Record<string, { label: string, disabled: boolean }>;`,
    replace: `  const actionConfigMap = {
    idle:    { label: idleLabel,                     disabled: idleDisabled },
    approve: { label: 'Approve Protocol Allowance...', disabled: true       },
    signing: { label: 'Awaiting Hashpack Signature...',disabled: true       },
    success: { label: 'Success Toast Notification',  disabled: false      },
    error:   { label: 'Transaction Failed',          disabled: false      },
  } as Record<string, { label: string, disabled: boolean }>;`
  },
  "1132": {
    search: `  const actionConfigMap = {
    idle:    { label: idleLabel,                     disabled: idleDisabled },
    approve: { label: 'Approve Protocol Allowance...', disabled: true       },
    signing: { label: 'Awaiting Hashpack Signature...',disabled: true       },
    success: { label: 'Success Toast Notification',  disabled: false      },
    error:   { label: 'Transaction Failed',          disabled: false      },
  } as Record<string, { label: string, disabled: boolean }>;`,
    replace: `  const actionConfigMap: any = {
    idle:    { label: idleLabel,                     disabled: idleDisabled },
    approve: { label: 'Approve Protocol Allowance...', disabled: true       },
    signing: { label: 'Awaiting Hashpack Signature...',disabled: true       },
    success: { label: 'Success Toast Notification',  disabled: false      },
    error:   { label: 'Transaction Failed',          disabled: false      },
  };`
  }
};

// Now replay edits up to step 1498 (before step 1499)
let editCount = 0;
for (const line of lines) {
  let obj;
  try { obj = JSON.parse(line); } catch(e) { continue; }
  
  const stepIndex = obj.step_index;
  if (stepIndex <= 240 || stepIndex >= 1499) continue;
  
  const toolCalls = obj.tool_calls || [];
  
  for (const tc of toolCalls) {
    const name = tc.name || tc.function?.name || '';
    const args = tc.args || tc.arguments || tc.function?.arguments || {};
    let parsedArgs = typeof args === 'string' ? (() => { try { return JSON.parse(args); } catch(e) { return {}; } })() : args;
    const targetFile = parsedArgs.TargetFile || '';
    
    if (!targetFile.includes('DashboardTerminal')) continue;
    
    if (stepIndex === 737 || stepIndex === 752 || stepIndex === 940 || stepIndex === 1136 || stepIndex === 1142 || stepIndex === 1235 || stepIndex === 1318 || stepIndex === 1370 || stepIndex === 1376 || stepIndex === 1430) {
      console.log(`[STEP ${stepIndex}] SKIPPED (duplicate/redundant edit)`);
      continue;
    }
    
    if (name === 'replace_file_content') {
      if (stepIndex === 1346) {
        const startKey = "/* ═══════════════════════════════════════════════════════════\n   SUBCOMPONENT: VAULT WORKSPACE";
        const endKey = "/* ═══════════════════════════════════════════════════════════\n   SUBCOMPONENT: RECENT ACTIVITY";
        const startIdx = content.indexOf(startKey);
        const endIdx = content.indexOf(endKey);
        if (startIdx !== -1 && endIdx !== -1) {
          const before = content.substring(0, startIdx);
          const after = content.substring(endIdx);
          const replacementVal = (parsedArgs.ReplacementContent || '').replace(/\r\n/g, '\n');
          const banner = `/* ═══════════════════════════════════════════════════════════
   SUBCOMPONENT: VAULT WORKSPACE (DETAIL VIEW)
═══════════════════════════════════════════════════════════ */\n`;
          content = before + banner + replacementVal + "\n\n" + after;
          editCount++;
          console.log(`[STEP 1346] applied via index-based VaultWorkspace override (new length: ${content.length})`);
          continue;
        } else {
          console.error(`[STEP 1346] ERROR: startKey or endKey not found!`, { startIdx, endIdx });
          process.exit(1);
        }
      }

      let target = (parsedArgs.TargetContent || '').replace(/\r\n/g, '\n');
      let replacement = (parsedArgs.ReplacementContent || '').replace(/\r\n/g, '\n');
      
      const overrideKey = `${stepIndex}`;
      if (overrides[overrideKey]) {
        const override = overrides[overrideKey];
        target = override.search.replace(/\r\n/g, '\n');
        replacement = override.replace.replace(/\r\n/g, '\n');
        console.log(`[STEP ${stepIndex}] Applied override for ${overrideKey}`);
      }
      
      const index = content.indexOf(target);
      if (index === -1) {
        console.error(`[STEP ${stepIndex}] ERROR: replace_file_content target not found!`);
        console.error("TARGET PREVIEW:", target.substring(0, 100));
        process.exit(1);
      }
      
      // Use function in replace to preserve special char sequences like '$$'
      content = content.replace(target, () => replacement);
      editCount++;
      console.log(`[STEP ${stepIndex}] Applied replace_file_content (new length: ${content.length})`);
    }
    
    if (name === 'multi_replace_file_content') {
      const chunks = parsedArgs.ReplacementChunks || [];
      console.log(`[STEP ${stepIndex}] Processing multi_replace_file_content with ${chunks.length} chunks`);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Skip the corrupted step 355 chunk 3
        if (stepIndex === 355 && i === 3) {
          console.log(`  - Chunk ${i} (step 355): SKIPPED to avoid corruption`);
          continue;
        }
        
        // Skip step 1402 redundant chunks
        if (stepIndex === 1402 && (i === 1 || i === 2)) {
          console.log(`  - Chunk ${i} (step 1402): SKIPPED (redundant/not found in clean buffer)`);
          continue;
        }
        
        // Index-based replacement for step 364 chunk 0
        if (stepIndex === 364 && i === 0) {
          const startKey = "/* ── MAIN LIST VIEW ── */";
          const endKey = "{/* Bottom status strip */}";
          const startIdx = content.indexOf(startKey);
          const endIdx = content.indexOf(endKey);
          if (startIdx !== -1 && endIdx !== -1) {
            const before = content.substring(0, startIdx + startKey.length);
            const after = content.substring(endIdx);
            const replacementVal = (chunk.ReplacementContent || '').replace(/\r\n/g, '\n');
            content = before + "\n            " + replacementVal + "\n            " + after;
            editCount++;
            console.log(`  - Chunk ${i} (step 364) applied via index-based override (new length: ${content.length})`);
            continue;
          }
        }

        // Index-based replacement for step 726 chunk 5
        if (stepIndex === 726 && i === 5) {
          const startKey = "              {/* Asset Input Terminal */}";
          const endKey = "              {/* Transaction Receipt */}";
          const startIdx = content.indexOf(startKey);
          const endIdx = content.indexOf(endKey);
          if (startIdx !== -1 && endIdx !== -1) {
            const before = content.substring(0, startIdx);
            const after = content.substring(endIdx);
            const replacementVal = (chunk.ReplacementContent || '').replace(/\r\n/g, '\n');
            content = before + replacementVal + "\n\n" + after;
            editCount++;
            console.log(`  - Chunk ${i} (step 726) applied via index-based override (new length: ${content.length})`);
            continue;
          }
        }

        // Index-based replacement for step 776 chunk 5
        if (stepIndex === 776 && i === 5) {
          const startKey = "              {/* Asset Input Terminal */}";
          const endKey = "              {/* Transaction Receipt */}";
          const startIdx = content.indexOf(startKey);
          const endIdx = content.indexOf(endKey);
          if (startIdx !== -1 && endIdx !== -1) {
            const before = content.substring(0, startIdx);
            const after = content.substring(endIdx);
            const replacementVal = (chunk.ReplacementContent || '').replace(/\r\n/g, '\n');
            content = before + replacementVal + "\n\n" + after;
            editCount++;
            console.log(`  - Chunk ${i} (step 776) applied via index-based override (new length: ${content.length})`);
            continue;
          }
        }

        // Index-based replacement for step 908 chunk 4
        if (stepIndex === 908 && i === 4) {
          const startKey = "/* Protocol Strategy Matrix */";
          const endKey = "        {/* ── COLUMN B: TRANSACTION ENGINE (";
          const startIdx = content.indexOf(startKey);
          const endIdx = content.indexOf(endKey);
          if (startIdx !== -1 && endIdx !== -1) {
            const before = content.substring(0, startIdx);
            const after = content.substring(endIdx);
            const replacementVal = (chunk.ReplacementContent || '').replace(/\r\n/g, '\n');
            content = before + replacementVal + "\n\n" + after;
            editCount++;
            console.log(`  - Chunk ${i} (step 908) applied via index-based override (new length: ${content.length})`);
            continue;
          }
        }
        
        let target = (chunk.TargetContent || '').replace(/\r\n/g, '\n');
        let replacement = (chunk.ReplacementContent || '').replace(/\r\n/g, '\n');
        
        const overrideKey = `${stepIndex}_${i}`;
        if (overrides[overrideKey]) {
          const override = overrides[overrideKey];
          target = override.search.replace(/\r\n/g, '\n');
          replacement = override.replace.replace(/\r\n/g, '\n');
          console.log(`  - Applied override for ${overrideKey}`);
        }
        
        let index = content.indexOf(target);
        
        if (index === -1) {
          console.error(`[STEP ${stepIndex}] ERROR: chunk ${i} target not found!`);
          console.error("TARGET PARAMS:", { startLine: chunk.StartLine, endLine: chunk.EndLine });
          console.error("TARGET PREVIEW (first 100):", target.substring(0, 100));
          console.error("TARGET PREVIEW (all):", target);
          process.exit(1);
        }
        
        // Use function in replace to preserve special char sequences like '$$'
        content = content.replace(target, () => replacement);
        editCount++;
        console.log(`  - Chunk ${i} applied (new length: ${content.length})`);
      }
    }
  }
}

console.log(`\nReplayed ${editCount} edits successfully.`);
fs.writeFileSync('reconstructed_dashboard_terminal.tsx', content);
console.log("Saved reconstructed file to reconstructed_dashboard_terminal.tsx");
