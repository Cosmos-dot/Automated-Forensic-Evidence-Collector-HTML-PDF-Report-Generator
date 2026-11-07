const { collectArtifacts } = require('./src/modules/collector');
const { generateReports } = require('./src/reporters/reporter');

(async () => {
    try {
        console.log('==============================================');
        console.log(' AUTOMATED FORENSIC EVIDENCE COLLECTOR (DFIR) ');
        console.log('==============================================\n');
        
        const artifacts = await collectArtifacts();
        await generateReports(artifacts);

        console.log('\n[✔] Acquisition complete! Check your /output folder.');
    } catch (err) {
        console.error('[-] Process execution error:', err);
    }
})();