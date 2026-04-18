const {
  openDatabase,
  setupDB,
  getStats,
  getRowsByStatus,
} = require('./db');

const DELAY_MS = 1000;
const RETRY_ONLY = process.argv.includes('--retry');

const fetchWeather = async (lat, lng) => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`;
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return (await response.json()).current;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const run = async () => {
  const db = openDatabase();

  setupDB(db);

  if (RETRY_ONLY) {
    db.prepare("UPDATE provinces SET status = 'pending' WHERE status = 'failed'").run();
    console.log('[*] Retry mode: reset failed -> pending');
  }

  const rows = getRowsByStatus(db, 'pending');
  const updateSuccess = db.prepare(`
    UPDATE provinces
    SET status = ?, temperature = ?, humidity = ?, wind_speed = ?, fetched_at = ?, error = NULL
    WHERE id = ?
  `);
  const updateFailure = db.prepare(`
    UPDATE provinces
    SET status = 'failed', error = ?
    WHERE id = ?
  `);

  console.log(`[*] Processing ${rows.length} provinces`);
  console.log('[*] Dashboard: http://localhost:3456\n');

  for (const row of rows) {
    try {
      const weather = await fetchWeather(row.lat, row.lng);

      updateSuccess.run(
        'success',
        weather.temperature_2m,
        weather.relative_humidity_2m,
        weather.wind_speed_10m,
        new Date().toISOString(),
        row.id
      );

      const stats = getStats(db);
      process.stdout.write(
        `\r[+] ${String(row.province_en).padEnd(25)} ${weather.temperature_2m}C  | success:${stats.success}/${stats.total} failed:${stats.failed}  `
      );
    } catch (error) {
      updateFailure.run(error.message, row.id);

      const stats = getStats(db);
      process.stdout.write(
        `\r[-] ${String(row.province_en).padEnd(25)} ERR   | success:${stats.success}/${stats.total} failed:${stats.failed}  `
      );
    }

    await sleep(DELAY_MS);
  }

  const stats = getStats(db);
  console.log(
    `\n\n[*] Done! Total:${stats.total} Success:${stats.success} Failed:${stats.failed} Pending:${stats.pending}`
  );

  db.close();
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
