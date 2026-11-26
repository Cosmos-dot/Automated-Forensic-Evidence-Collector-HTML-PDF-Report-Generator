const fs = require('fs');
const path = require('path');

let sqlite3 = null;
try { sqlite3 = require('sqlite3'); } catch { sqlite3 = null; }

function cleanupTemp(filePath) {
    if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch {}
    }
}

function querySqliteCopy(sourcePath, outputDir, tag, sql) {
    if (!fs.existsSync(sourcePath) || !sqlite3) return Promise.resolve([]);
    const tempDbPath = path.join(outputDir, `temp_${tag}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.db`);
    try { fs.copyFileSync(sourcePath, tempDbPath); } catch { return Promise.resolve([]); }

    return new Promise((resolve) => {
        const db = new sqlite3.Database(tempDbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) { cleanupTemp(tempDbPath); return resolve([]); }
        });
        db.all(sql, [], (err, rows) => {
            db.close(() => { cleanupTemp(tempDbPath); resolve(!err && rows ? rows : []); });
        });
    });
}

function getFirefoxPlacesPaths() {
    const appData = process.env.APPDATA;
    if (!appData) return [];
    const profilesDir = path.join(appData, 'Mozilla', 'Firefox', 'Profiles');
    if (!fs.existsSync(profilesDir)) return [];
    try {
        return fs.readdirSync(profilesDir, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => path.join(profilesDir, d.name, 'places.sqlite'))
            .filter(p => fs.existsSync(p));
    } catch { return []; }
}

async function getBrowserHistory(outputDir) {
    const localAppData = process.env.LOCALAPPDATA || '';
    const chromiumQuery = (browserName) => `
        SELECT '${browserName}' AS browser, urls.url AS url,
               COALESCE(NULLIF(urls.title, ''), '(No Title)') AS title,
               urls.visit_count AS visit_count,
               datetime((visits.visit_time / 1000000) - 11644473600, 'unixepoch', 'localtime') AS last_visit_time
        FROM urls JOIN visits ON urls.id = visits.url
        ORDER BY visits.visit_time DESC LIMIT 30`;

    const firefoxQuery = `
        SELECT 'Firefox' AS browser, moz_places.url AS url,
               COALESCE(NULLIF(moz_places.title, ''), '(No Title)') AS title,
               moz_places.visit_count AS visit_count,
               datetime(moz_historyvisits.visit_date / 1000000, 'unixepoch', 'localtime') AS last_visit_time
        FROM moz_places JOIN moz_historyvisits ON moz_places.id = moz_historyvisits.place_id
        WHERE moz_places.url NOT LIKE 'place:%'
        ORDER BY moz_historyvisits.visit_date DESC LIMIT 30`;

    const chromeDb = path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'History');
    const edgeDb = path.join(localAppData, 'Microsoft', 'Edge', 'User Data', 'Default', 'History');
    const firefoxDbs = getFirefoxPlacesPaths();

    const results = await Promise.all([
        querySqliteCopy(chromeDb, outputDir, 'chrome', chromiumQuery('Chrome')),
        querySqliteCopy(edgeDb, outputDir, 'edge', chromiumQuery('Edge')),
        ...firefoxDbs.map((dbPath, idx) => querySqliteCopy(dbPath, outputDir, `firefox_${idx}`, firefoxQuery))
    ]);

    return results.flat()
        .sort((a, b) => String(b.last_visit_time).localeCompare(String(a.last_visit_time)))
        .slice(0, 75);
}

module.exports = { getBrowserHistory };