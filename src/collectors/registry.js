const Registry = require('winreg');

// Helper function to query a specific Windows Registry key safely
function queryRegistryKey(hive, key) {
  return new Promise((resolve) => {
    const regKey = new Registry({ hive, key });
    regKey.values((err, items) => {
      if (err || !items) {
        resolve([]);
      } else {
        resolve(items.map(item => ({ name: item.name, value: item.value, type: item.type })));
      }
    });
  });
}

// Helper to query subkeys (useful for USBSTOR connection history)
function queryRegistrySubKeys(hive, key) {
  return new Promise((resolve) => {
    const regKey = new Registry({ hive, key });
    regKey.keys((err, items) => {
      if (err || !items) {
        resolve([]);
      } else {
        resolve(items.map(item => item.key.split('\\').pop()));
      }
    });
  });
}

async function getRegistryArtifacts() {
  // 1. HKCU Startup Items
  const hkcuStartup = await queryRegistryKey(
    Registry.HKCU,
    '\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
  );

  // 2. HKLM Startup Items
  const hklmStartup = await queryRegistryKey(
    Registry.HKLM,
    '\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run'
  );

  // 3. USB Connection History (USBSTOR)
  const usbDevices = await queryRegistrySubKeys(
    Registry.HKLM,
    '\\SYSTEM\\CurrentControlSet\\Enum\\USBSTOR'
  );

  return {
    startupItems: [
      ...hkcuStartup.map(i => ({ ...i, location: 'HKCU\\...\\Run' })),
      ...hklmStartup.map(i => ({ ...i, location: 'HKLM\\...\\Run' }))
    ],
    usbHistory: usbDevices
  };
}

module.exports = { getRegistryArtifacts };