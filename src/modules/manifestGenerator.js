const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
function calculateHash(data) {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}
function createEvidenceAndManifest(artifacts, outputDir) {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const hashes = {
        osMetrics: calculateHash(artifacts.osMetrics),
        processes: calculateHash(artifacts.processes),
        network: calculateHash(artifacts.network),
        registry: calculateHash(artifacts.registry),
        history: calculateHash(artifacts.history)
    };
    const masterHash = calculateHash(hashes);
    const manifest = {
        metadata: {
            title: 'Automated DFIR Evidence Collection Manifest',
            timestampUTC: new Date().toISOString(),
            hostname: artifacts.osMetrics.hostname,
            platform: `${artifacts.osMetrics.platform.toUpperCase()} (${artifacts.osMetrics.arch})`,
            nodeVersion: process.version
        },
        hashes,
        masterHash
    };
    const evidencePath = path.join(outputDir, 'evidence.json');
    const manifestPath = path.join(outputDir, 'manifest.json');
    fs.writeFileSync(evidencePath, JSON.stringify(artifacts, null, 2), 'utf8');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log(`[+] Raw Evidence saved:      ${evidencePath}`);
    console.log(`[+] Forensic Manifest saved: ${manifestPath}`);
    return manifest;
}
function verifyEvidenceBundle(targetDir) {
    const evidencePath = path.join(targetDir, 'evidence.json');
    const manifestPath = path.join(targetDir, 'manifest.json');
    if (!fs.existsSync(evidencePath) || !fs.existsSync(manifestPath)) {
        return { valid: false, reason: 'Missing evidence.json or manifest.json in target directory.' };
    }
    const artifacts = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const recomputedHashes = {
        osMetrics: calculateHash(artifacts.osMetrics),
        processes: calculateHash(artifacts.processes),
        network: calculateHash(artifacts.network),
        registry: calculateHash(artifacts.registry),
        history: calculateHash(artifacts.history)
    };
    const recomputedMaster = calculateHash(recomputedHashes);
    const mismatches = Object.keys(recomputedHashes).filter(
        key => recomputedHashes[key] !== manifest.hashes[key]
    );
    if (mismatches.length > 0 || recomputedMaster !== manifest.masterHash) {
        return {
            valid: false,
            reason: `Integrity check FAILED! Tampered modules: ${mismatches.join(', ') || 'masterHash'}`
        };
    }
    return {
        valid: true,
        masterHash: recomputedMaster,
        timestampUTC: manifest.metadata.timestampUTC,
        hostname: manifest.metadata.hostname
    };
}
module.exports = { createEvidenceAndManifest, verifyEvidenceBundle };
