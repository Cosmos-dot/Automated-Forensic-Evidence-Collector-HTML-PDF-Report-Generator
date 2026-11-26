const fs = require('fs');
const path = require('path');
let sqlite3 = null;
try {
    sqlite3 = require('sqlite3');
} catch {
    sqlite3 = null;
}
async function getChromeHistory(outputDir) {
    const localAppData = process.env.LOCALAPPDATA;
    if (!localAppData) return [];
    const chromeDbPath = path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'History');
    if (!fs.existsSync(chromeDbPath)) return [];
    if (!sqlite3) {
        return [{
            url: 'N/A',
            title: 'SQLite3 native driver unavailable in packaged binary (History DB exists on disk)',
            visit_count: 0,
            last_visit_time: new Date().toISOString()
        }];
    }
    const tempDbPath = path.join(outputDir, `temp_chrome_history_${Date.now()}.db`);
    try {
        fs.copyFileSync(chromeDbPath, tempDbPath);
        return await new Promise((resolve) => {
            const db = new sqlite3.Database(tempDbPath, sqlite3.OPEN_READONLY, (err) => {
                if (err) {
                    return resolve([{
                        url: 'N/A',
                        title: `Failed to open copied SQLite DB: ${err.message}`,
                        visit_count: 0,
                        last_visit_time: 'N/A'
                    }]);
                }
            });
            const query = `
                SELECT
                    urls.url AS url,
                    COALESCE(NULLIF(urls.title, ''), '(No Title)') AS title,
                    urls.visit_count AS visit_count,
                    datetime((visits.visit_time / 1000000) - 11644473600, 'unixepoch', 'localtime') AS last_visit_time
                FROM urls
                JOIN visits ON urls.id = visits.url
                ORDER BY visits.visit_time DESC
                LIMIT 50
            `;
            db.all(query, [], (err, rows) => {
                db.close(() => {
                    if (err) {
                        return resolve([{
                            url: 'N/A',
                            title: `SQLite query error: ${err.message}`,
                            visit_count: 0,
                            last_visit_time: 'N/A'
                        }]);
                    }
                    resolve(rows || []);
                });
            });
        });
    } catch (err) {
        return [{
            url: 'N/A',
            title: `Chrome History lock/copy error: ${err.message}`,
            visit_count: 0,
            last_visit_time: 'N/A'
        }];
    } finally {
        if (fs.existsSync(tempDbPath)) {
            try {
                fs.unlinkSync(tempDbPath);
            } catch {
                // Ignore transient Windows file handle delay
            }
        }
    }
}
module.exports = { getChromeHistory };
