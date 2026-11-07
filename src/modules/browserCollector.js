const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

async function getChromeHistory() {
    const localAppData = process.env.LOCALAPPDATA;
    if (!localAppData) {
        return { error: 'LOCALAPPDATA environment variable not available.' };
    }

    const chromeDbPath = path.join(
        localAppData,
        'Google',
        'Chrome',
        'User Data',
        'Default',
        'History'
    );

    if (!fs.existsSync(chromeDbPath)) {
        return { note: 'Chrome History database file not found at default location.' };
    }

    // Use process.cwd() so paths resolve on the real host filesystem, not inside pkg snapshot
    const tempDbPath = path.join(process.cwd(), 'output', 'temp_History');

    try {
        const outputDir = path.dirname(tempDbPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.copyFileSync(chromeDbPath, tempDbPath);

        return await new Promise((resolve) => {
            const db = new sqlite3.Database(tempDbPath, sqlite3.OPEN_READONLY, (err) => {
                if (err) {
                    return resolve({ error: `Failed to open SQLite database: ${err.message}` });
                }
            });

            const query = `
                SELECT 
                    urls.url, 
                    urls.title, 
                    urls.visit_count, 
                    datetime((visits.visit_time/1000000)-11644473600, 'unixepoch', 'localtime') AS last_visit_time
                FROM urls 
                JOIN visits ON urls.id = visits.url 
                ORDER BY visits.visit_time DESC 
                LIMIT 50
            `;

            db.all(query, [], (err, rows) => {
                db.close();
                if (err) {
                    return resolve({ error: `Query execution error: ${err.message}` });
                }
                resolve(rows || []);
            });
        });

    } catch (err) {
        return { error: `Failed during Chrome history processing: ${err.message}` };
    } finally {
        if (fs.existsSync(tempDbPath)) {
            try {
                fs.unlinkSync(tempDbPath);
                console.log('[+] Temporary Chrome History file cleaned up successfully.');
            } catch (cleanupErr) {
                console.warn(`[!] Note: Temporary history file cleanup skipped (${cleanupErr.message})`);
            }
        }
    }
}

module.exports = { getChromeHistory };