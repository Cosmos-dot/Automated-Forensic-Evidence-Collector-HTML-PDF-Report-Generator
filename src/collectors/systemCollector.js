const os = require('os');
const { execSync } = require('child_process');
function getOSMetrics() {
    const cpus = os.cpus();
    return {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
        uptime: `${(os.uptime() / 3600).toFixed(2)} hours`,
        totalmem: `${(os.totalmem() / (1024 ** 3)).toFixed(2)} GB`,
        freemem: `${(os.freemem() / (1024 ** 3)).toFixed(2)} GB`,
        cpus: cpus.length ? `${cpus[0].model} (${cpus.length} Cores)` : 'N/A',
        userInfo: os.userInfo().username
    };
}
function getNetworkSockets() {
    try {
        const output = execSync('netstat -ano', { encoding: 'utf8' });
        const lines = output.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const connections = [];
        for (const line of lines) {
            if (!line.startsWith('TCP') && !line.startsWith('UDP')) continue;
            const parts = line.split(/\s+/);
            if (parts[0] === 'TCP' && parts.length >= 5) {
                connections.push({
                    protocol: parts[0],
                    localAddress: parts[1],
                    foreignAddress: parts[2],
                    state: parts[3],
                    pid: parts[4]
                });
            } else if (parts[0] === 'UDP' && parts.length >= 4) {
                connections.push({
                    protocol: parts[0],
                    localAddress: parts[1],
                    foreignAddress: parts[2],
                    state: 'STATELESS',
                    pid: parts[3]
                });
            }
        }
        return connections;
    } catch (err) {
        return [{ protocol: 'ERR', localAddress: '-', foreignAddress: '-', state: err.message, pid: '-' }];
    }
}
function getRunningProcesses() {
    try {
        const output = execSync('tasklist /FO CSV /NH', { encoding: 'utf8' });
        const lines = output.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        return lines.map(line => {
            const parts = line.split('","').map(p => p.replace(/^"|"$/g, ''));
            return {
                name: parts[0] || 'Unknown',
                pid: parts[1] || 'N/A',
                sessionName: parts[2] || 'N/A',
                sessionNum: parts[3] || 'N/A',
                memUsage: parts[4] || 'N/A'
            };
        });
    } catch (err) {
        return [{ name: 'Error', pid: '0', sessionName: 'N/A', sessionNum: 'N/A', memUsage: err.message }];
    }
}
module.exports = { getOSMetrics, getNetworkSockets, getRunningProcesses };
