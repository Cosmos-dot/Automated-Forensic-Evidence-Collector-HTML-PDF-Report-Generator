const crypto = require('crypto');
const si = require('systeminformation');
const { getRunKeys } = require('./registryCollector');
const { getChromeHistory } = require('./browserCollector');

function computeHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

async function collectArtifacts() {
    console.log('[*] Extracting system metrics and volatile data...');
    
    const osInfo = await si.osInfo();
    const networkConns = await si.networkConnections();
    const processes = await si.processes();
    const runKeys = await getRunKeys();
    const browserHistory = await getChromeHistory();

    const artifacts = [];

    // 1. OS Info
    const sysData = JSON.stringify(osInfo, null, 2);
    artifacts.push({
        name: 'OS & System Information',
        data: sysData,
        hash: computeHash(sysData)
    });

    // 2. Active Connections
    const netData = JSON.stringify(networkConns.slice(0, 50), null, 2);
    artifacts.push({
        name: 'Active Network Connections (Top 50)',
        data: netData,
        hash: computeHash(netData)
    });

    // 3. Processes
    const procData = JSON.stringify(processes.list.slice(0, 50), null, 2);
    artifacts.push({
        name: 'Running Processes (Top 50)',
        data: procData,
        hash: computeHash(procData)
    });

    // 4. Windows Registry Run Keys (Persistence)
    const regData = JSON.stringify(runKeys, null, 2);
    artifacts.push({
        name: 'Windows User Persistence Run Keys (Registry)',
        data: regData,
        hash: computeHash(regData)
    });

    // 5. Chrome Browser History Artifacts
    const browserData = JSON.stringify(browserHistory, null, 2);
    artifacts.push({
        name: 'Chrome Web History (Recent Visits)',
        data: browserData,
        hash: computeHash(browserData)
    });

    return artifacts;
}

module.exports = { collectArtifacts };