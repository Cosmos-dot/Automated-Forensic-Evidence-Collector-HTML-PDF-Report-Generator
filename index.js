const path = require('path');
const { collectArtifacts } = require('./src/modules/collector');
const { generateReports } = require('./src/reporters/reporter');
const { createManifest } = require('./src/modules/manifestGenerator');

(async () => {
    try {
        console.log('==============================================');
        console.log(' AUTOMATED FORENSIC EVIDENCE COLLECTOR (DFIR) ');
        console.log('==============================================\n');

        const outputDir = path.resolve(__dirname, 'output');
        
        // 1. Collect evidence artifacts
        const artifacts = await collectArtifacts();

        // 2. Build audit manifest (Chain of Custody)
        createManifest(artifacts, outputDir);

        // 3. Render HTML & PDF reports
        await generateReports(artifacts);

        console.log('\n[✔] Acquisition complete! Check your /output folder.');
    } catch (err) {
        console.error('[-] Process execution error:', err);
    }
})();