const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

async function getChromeHistory() {
    return new Promise((resolve) => {
        const localAppData = process.env.LOCALAPPDATA;
        if (!localAppData) return resolve([{ status: "LOCALAPPDATA environment variable not found." }]);

        // Default Chrome History DB Path
        const historyPath = path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'History');

        if (!fs.existsSync(historyPath)) {
            return resolve([{ status: "Chrome History database not found." }]);
        }

        // Output directory check & temp file path
        const outputDir = path.resolve(__dirname, '../../output');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        // Generate unique temp filename using timestamp to avoid conflict
        const tempDbPath = path.join(outputDir, `temp_History_${Date.now()}`);

        try {
            fs.copyFileSync(historyPath, tempDbPath);
        } catch (err) {
            return resolve([{ status: `Failed to copy history file: ${err.message}` }]);
        }

        const db = new sqlite3.Database(tempDbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);
                return resolve([{ status: `Database open error: ${err.message}` }]);
            }
        });

        const query = `SELECT url, title, visit_count, last_visit_time FROM urls ORDER BY last_visit_time DESC LIMIT 30;`;

        db.all(query, [], (err, rows) => {
            const results = err ? [{ status: `Query error: ${err.message}` }] : rows;

            // Close DB first, then safely remove temp file in the callback
            db.close((closeErr) => {
                if (closeErr) console.error('[-] DB close error:', closeErr);
                
                try {
                    if (fs.existsSync(tempDbPath)) {
                        fs.unlinkSync(tempDbPath);
                    }
                } catch (unlinkErr) {
                    // Suppress or log non-fatal cleanup warning
                    console.warn(`[!] Temporary history file deferred cleanup: ${unlinkErr.message}`);
                }

                resolve(results);
            });
        });
    });
}

module.exports = { getChromeHistory };