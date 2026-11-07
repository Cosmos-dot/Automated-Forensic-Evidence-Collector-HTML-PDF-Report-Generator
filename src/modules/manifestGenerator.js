const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function createManifest(artifacts, outputDir) {
    console.log('[*] Generating forensic chain-of-custody audit manifest...');
    
    const manifestData = {
        metadata: {
            title: "Automated Forensic Evidence Collection Manifest",
            timestampUTC: new Date().toISOString(),
            platform: `${process.platform.toUpperCase()} (${process.arch})`,
            nodeVersion: process.version,
            collectedArtifactsCount: artifacts.length
        },
        artifacts: artifacts.map(item => ({
            name: item.name,
            sha256Hash: item.hash,
            sizeBytes: Buffer.byteLength(item.data, 'utf-8')
        }))
    };

    // Calculate Master Integrity Hash over the manifest artifacts array
    const manifestString = JSON.stringify(manifestData.artifacts);
    manifestData.metadata.masterManifestHash = crypto
        .createHash('sha256')
        .update(manifestString)
        .digest('hex');

    const manifestPath = path.join(outputDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2), 'utf-8');
    
    console.log(`[+] Forensic Manifest created: ${manifestPath}`);
    return manifestPath;
}

module.exports = { createManifest };