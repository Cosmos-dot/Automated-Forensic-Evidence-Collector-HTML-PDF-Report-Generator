const path = require('path');
const fs = require('fs');
const { collectArtifacts } = require('./src/modules/collector');
const { generateReports } = require('./src/reporters/reporter');
const { createManifest } = require('./src/modules/manifestGenerator');

// Simple CLI Argument Handler
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
======================================================
 AUTOMATED FORENSIC EVIDENCE COLLECTOR - HELP MENU
======================================================

Usage: node index.js [options]

Options:
  --output, -o <dir>  Specify custom output directory (default: ./output)
  --no-pdf            Skip PDF generation (HTML & Manifest only)
  --help, -h          Show this help screen
  --version, -v       Display tool version
`);
    process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
    console.log('v1.0.0');
    process.exit(0);
}

// Extract custom output path if provided
let outputDir = path.resolve(__dirname, 'output');
const outputIdx = args.findIndex(arg => arg === '--output' || arg === '-o');
if (outputIdx !== -1 && args[outputIdx + 1]) {
    outputDir = path.resolve(args[outputIdx + 1]);
}

const skipPdf = args.includes('--no-pdf');

(async () => {
    try {
        console.log('==============================================');
        console.log(' AUTOMATED FORENSIC EVIDENCE COLLECTOR (DFIR) ');
        console.log('==============================================\n');
        console.log(`[*] Target Output Directory: ${outputDir}`);

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // 1. Collect evidence artifacts
        const artifacts = await collectArtifacts();

        // 2. Build audit manifest (Chain of Custody)
        createManifest(artifacts, outputDir);

        // 3. Render HTML & PDF reports
        await generateReports(artifacts, outputDir, skipPdf);

        console.log('\n[✔] Acquisition complete! Check your output directory.');
    } catch (err) {
        console.error('[-] Process execution error:', err);
    }
})();