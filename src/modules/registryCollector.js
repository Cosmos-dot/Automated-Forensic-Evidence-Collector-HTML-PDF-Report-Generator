const Winreg = require('winreg');

function getRunKeys() {
    return new Promise((resolve) => {
        const regKey = new Winreg({
            hive: Winreg.HKCU,
            key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
        });

        regKey.values((err, items) => {
            if (err || !items) return resolve([]);
            const parsed = items.map(item => ({
                name: item.name,
                type: item.type,
                value: item.value
            }));
            resolve(parsed);
        });
    });
}

module.exports = { getRunKeys };