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
        content = parsedArgs.CodeContent || '';
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
    
    if (name === 'replace_file_content') {
      const target = parsedArgs.TargetContent;
      const replacement = parsedArgs.ReplacementContent;
      
      const index = content.indexOf(target);
      if (index === -1) {
        console.error(`[STEP ${stepIndex}] ERROR: replace_file_content target not found!`);
        console.error("TARGET PARAMS:", { startLine: parsedArgs.StartLine, endLine: parsedArgs.EndLine });
        console.error("TARGET PREVIEW:", target.substring(0, 100));
        process.exit(1);
      }
      
      content = content.replace(target, replacement);
      editCount++;
      console.log(`[STEP ${stepIndex}] Applied replace_file_content (new length: ${content.length})`);
    }
    
    if (name === 'multi_replace_file_content') {
      const chunks = parsedArgs.ReplacementChunks || [];
      console.log(`[STEP ${stepIndex}] Processing multi_replace_file_content with ${chunks.length} chunks`);
      
      // We should apply chunks one by one. Let's make sure they all match.
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const target = chunk.TargetContent;
        const replacement = chunk.ReplacementContent;
        
        const index = content.indexOf(target);
        if (index === -1) {
          console.error(`[STEP ${stepIndex}] ERROR: chunk ${i} target not found!`);
          console.error("TARGET PARAMS:", { startLine: chunk.StartLine, endLine: chunk.EndLine });
          console.error("TARGET PREVIEW:", target.substring(0, 100));
          process.exit(1);
        }
        
        content = content.replace(target, replacement);
        editCount++;
        console.log(`  - Chunk ${i} applied (new length: ${content.length})`);
      }
    }
  }
}

console.log(`\nReplayed ${editCount} edits successfully.`);
fs.writeFileSync('reconstructed_dashboard_terminal.tsx', content);
console.log("Saved reconstructed file to reconstructed_dashboard_terminal.tsx");
