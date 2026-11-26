const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const { execFileSync } = require('child_process');

function getBrowserPath() {
    const paths = [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    ];
    return paths.find(p => fs.existsSync(p)) || null;
}

async function generateReports(artifacts, manifest, outputDir, skipPdf = false) {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const htmlPath = path.join(outputDir, 'report.html');
    const pdfPath = path.join(outputDir, 'report.pdf');
    const templatePath = path.resolve(__dirname, '../../templates/reportTemplate.ejs');

    console.log('[*] Rendering executive HTML report via EJS...');
    const htmlContent = await ejs.renderFile(templatePath, {
        osMetrics: artifacts.osMetrics,
        processes: artifacts.processes,
        network: artifacts.network,
        scheduledTasks: artifacts.scheduledTasks,
        registry: artifacts.registry,
        history: artifacts.history,
        manifest,
        acquisitionTime: new Date().toLocaleString()
    });

    fs.writeFileSync(htmlPath, htmlContent, 'utf8');
    console.log(`[+] HTML Report saved:     ${htmlPath}`);
    if (skipPdf) return { htmlPath, pdfPath: null };

    const browserPath = getBrowserPath();
    if (!browserPath) return { htmlPath, pdfPath: null };

    try {
        console.log(`[*] Exporting PDF via ${path.basename(browserPath)}...`);
        execFileSync(browserPath, ['--headless', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${pdfPath}`, htmlPath]);
        console.log(`[+] PDF Report saved:      ${pdfPath}`);
        return { htmlPath, pdfPath };
    } catch (err) {
        console.error(`[-] PDF generation failed: ${err.message}`);
        return { htmlPath, pdfPath: null };
    }
}

module.exports = { generateReports };