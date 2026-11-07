const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function calculateHash(data) {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

function createManifest(artifacts, outputDir) {
    // If outputDir is omitted or points inside a pkg snapshot (C:\snapshot\...), force real host path
    let targetDir = outputDir;
    if (!targetDir || targetDir.includes('snapshot')) {
        targetDir = path.join(process.cwd(), 'output');
    }
    
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    const manifestPath = path.join(targetDir, 'manifest.json');

    const artifactManifest = Object.keys(artifacts).map((key) => {
        const data = artifacts[key];
        return {
            name: key,
            sha256Hash: calculateHash(data),
            sizeBytes: Buffer.byteLength(JSON.stringify(data))
        };
    });

    const manifestData = {
        metadata: {
            title: "Automated Forensic Evidence Collection Manifest",
            timestampUTC: new Date().toISOString(),
            platform: `${process.platform.toUpperCase()} (${process.arch})`,
            nodeVersion: process.version,
            collectedArtifactsCount: artifactManifest.length,
            masterManifestHash: calculateHash(artifactManifest)
        },
        artifacts: artifactManifest
    };

    fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2), 'utf-8');
    console.log(`[+] Forensic Manifest generated: ${manifestPath}`);
    return manifestData;
}

module.exports = { createManifest };