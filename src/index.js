const { getSystemInfo } = require('./collectors/system');
const { getRunningProcesses } = require('./collectors/processes');
const { getRegistryArtifacts } = require('./collectors/registry');
const fs = require('fs');
const path = require('path');

async function runCollector() {
  console.log('[*] Initializing Forensic Evidence Collection...');
  
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  
  console.log('[+] Collecting System Specs & Logged-in Users...');
  const systemData = await getSystemInfo();

  console.log('[+] Collecting Volatile Running Processes & PIDs...');
  const processData = await getRunningProcesses();

  console.log('[+] Querying Windows Registry (Startup Items & USB History)...');
  const registryData = await getRegistryArtifacts();

  const evidencePayload = {
    metadata: {
      collectedAt: new Date().toISOString(),
      toolVersion: "1.0.0"
    },
    system: systemData,
    processes: processData,
    registry: registryData
  };

  const outputDir = path.join(__dirname, '../output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `evidence-${timestamp}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(evidencePayload, null, 2));

  console.log(`[✔] Evidence successfully dumped to: ${outputPath}`);
}

runCollector();