const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const { getOSMetrics, getNetworkSockets, getRunningProcesses, getScheduledTasks } = require('./src/collectors/systemCollector');
const { getRegistryArtifacts } = require('./src/collectors/registryCollector');
const { getBrowserHistory } = require('./src/collectors/browserCollector');
const { createEvidenceAndManifest, verifyEvidenceBundle } = require('./src/modules/manifestGenerator');
const { generateReports } = require('./src/reporters/reporter');

function parseArgs(argv) {
    const args = argv.slice(2);
    const options = { outputDir: null, skipPdf: args.includes('--skip-pdf'), noOpen: args.includes('--no-open'), verifyDir: null };
    const outIdx = args.indexOf('--output');
    if (outIdx !== -1 && args[outIdx + 1]) options.outputDir = path.resolve(args[outIdx + 1]);
    const verIdx = args.indexOf('--verify');
    if (verIdx !== -1) options.verifyDir = args[verIdx + 1] ? path.resolve(args[verIdx + 1]) : path.join(process.cwd(), 'output');
    return options;
}

async function main() {
    const options = parseArgs(process.argv);
    const isPkg = typeof process.pkg !== 'undefined';
    const defaultBase = isPkg ? path.dirname(process.execPath) : process.cwd();
    const outputDir = options.outputDir || path.join(defaultBase, 'output');

    console.log('==============================================');
    console.log(' AUTOMATED FORENSIC EVIDENCE COLLECTOR (DFIR) ');
    console.log('==============================================\n');

    if (options.verifyDir) {
        console.log(`[*] Verifying evidence integrity in: ${options.verifyDir}`);
        const result = verifyEvidenceBundle(options.verifyDir);
        if (result.valid) {
            console.log(`[+] VERIFIED: Evidence matches manifest!\n    Host:       ${result.hostname}\n    Timestamp:  ${result.timestampUTC}\n    MasterSHA:  ${result.masterHash}`);
            process.exit(0);
        } else {
            console.error(`[-] FAILED: ${result.reason}`);
            process.exit(1);
        }
    }

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    console.log('[*] Collecting OS metrics, processes, and active sockets...');
    const osMetrics = getOSMetrics();
    const processes = getRunningProcesses();
    const network = getNetworkSockets();

    console.log('[*] Querying Windows Scheduled Tasks & Registry persistence...');
    const scheduledTasks = getScheduledTasks();
    const registry = getRegistryArtifacts();

    console.log('[*] Extracting Chrome, Edge & Firefox browser history...');
    const history = await getBrowserHistory(outputDir);

    const artifacts = { osMetrics, processes, network, scheduledTasks, registry, history };
    const manifest = createEvidenceAndManifest(artifacts, outputDir);
    const { htmlPath } = await generateReports(artifacts, manifest, outputDir, options.skipPdf);

    console.log(`\n[+] Acquisition complete! All artifacts saved to: ${outputDir}`);
    if (!options.noOpen && htmlPath && fs.existsSync(htmlPath)) exec(`start "" "${htmlPath}"`);
}

main().catch((err) => { console.error(`[!] Fatal acquisition error: ${err.message}`); process.exit(1); });