const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const { execFile } = require('child_process');

function getBrowserPath() {
    const paths = [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    ];
    for (const p of paths) {
        if (fs.existsSync(p)) return p;
    }
    return null;
}

function renderPdfNative(browserPath, htmlPath, pdfPath) {
    return new Promise((resolve, reject) => {
        const args = [
            '--headless',
            '--disable-gpu',
            '--no-pdf-header-footer',
            `--print-to-pdf=${pdfPath}`,
            htmlPath
        ];

        execFile(browserPath, args, (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

async function generateReports(artifacts, outputDir, skipPdf = false) {
    let targetDir = outputDir;
    if (!targetDir || typeof targetDir !== 'string' || targetDir.includes('snapshot')) {
        targetDir = path.join(process.cwd(), 'output');
    }

    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    const htmlPath = path.join(targetDir, 'report.html');
    const pdfPath = path.join(targetDir, 'report.pdf');
    const templatePath = path.resolve(__dirname, '../../templates/reportTemplate.ejs');

    console.log('[*] Building HTML report with EJS template...');
    const htmlContent = await ejs.renderFile(templatePath, {
        timestamp: new Date().toISOString(),
        platform: `${process.platform.toUpperCase()} (${process.arch})`,
        artifacts
    });

    fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
    console.log(`[+] HTML Report saved: ${htmlPath}`);

    if (skipPdf) {
        console.log('[!] PDF generation skipped via flag.');
        return;
    }

    const browserPath = getBrowserPath();
    if (!browserPath) {
        console.warn('[!] System Edge/Chrome browser not found. PDF export skipped.');
        return;
    }

    try {
        console.log(`[*] Exporting PDF via system browser CLI (${path.basename(browserPath)})...`);
        await renderPdfNative(browserPath, htmlPath, pdfPath);
        console.log(`[+] PDF Report saved: ${pdfPath}`);
    } catch (err) {
        console.error(`[-] PDF generation error: ${err.message}`);
    }
}

module.exports = { generateReports };