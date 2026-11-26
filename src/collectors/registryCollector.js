const { execSync } = require('child_process');
function parseRegValues(hiveLabel, keyPath) {
    try {
        const output = execSync(`reg query "${keyPath}"`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
        const lines = output.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const items = [];
        for (const line of lines) {
            if (line.startsWith('HKEY_')) continue;
            const match = line.match(/^(\S.*?)\s+(REG_[A-Z_]+)\s+(.*)$/);
            if (match) {
                items.push({
                    hive: hiveLabel,
                    name: match[1].trim(),
                    type: match[2].trim(),
                    value: match[3].trim()
                });
            }
        }
        return items;
    } catch {
        return [];
    }
}
function getUsbHistory() {
    try {
        const output = execSync('reg query "HKLM\\SYSTEM\\CurrentControlSet\\Enum\\USBSTOR"', {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore']
        });
        return output
            .split(/\r?\n/)
            .map(l => l.trim())
            .filter(l => l.startsWith('HKEY_'))
            .map(l => l.split('\\').pop());
    } catch {
        return [];
    }
}
function getRegistryArtifacts() {
    const runKeys = [
        ...parseRegValues('HKCU\\...\\Run', 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'),
        ...parseRegValues('HKCU\\...\\RunOnce', 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce'),
        ...parseRegValues('HKLM\\...\\Run', 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run'),
        ...parseRegValues('HKLM\\...\\RunOnce', 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\RunOnce')
    ];
    const usbHistory = getUsbHistory();
    return { runKeys, usbHistory };
}
module.exports = { getRegistryArtifacts };
