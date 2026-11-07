const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const puppeteer = require('puppeteer');

async function generateReports(artifacts) {
    const outputDir = path.resolve(__dirname, '../../output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const htmlPath = path.join(outputDir, 'report.html');
    const pdfPath = path.join(outputDir, 'report.pdf');
    const templatePath = path.resolve(__dirname, '../../templates/reportTemplate.ejs');

    console.log('[*] Building HTML report with EJS template...');
    const htmlContent = await ejs.renderFile(templatePath, {
        timestamp: new Date().toISOString(),
        platform: `${process.platform.toUpperCase()} (${process.arch})`,
        artifacts
    });

    fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
    console.log(`[+] HTML Report saved: ${htmlPath}`);

    console.log('[*] Launching Puppeteer to export PDF report...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });

    await browser.close();
    console.log(`[+] PDF Report saved: ${pdfPath}`);
}

module.exports = { generateReports };