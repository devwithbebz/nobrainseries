const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const CSV_FILE = path.join(__dirname, 'thailand_provinces.csv');
const DB_FILE = path.join(__dirname, 'weather.db');

const openDatabase = () => new DatabaseSync(DB_FILE);

const setupDB = (db) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS provinces (
      id INTEGER PRIMARY KEY,
      province_th TEXT NOT NULL,
      province_en TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      temperature REAL,
      humidity INTEGER,
      wind_speed REAL,
      fetched_at TEXT,
      error TEXT
    )
  `);
};

const loadCSV = (db) => {
  const csv = fs.readFileSync(CSV_FILE, 'utf8').trim();
  const lines = csv.split(/\r?\n/).slice(1);
  const insertProvince = db.prepare(`
    INSERT OR IGNORE INTO provinces (id, province_th, province_en, lat, lng)
    VALUES (?, ?, ?, ?, ?)
  `);

  let inserted = 0;

  db.exec('BEGIN');

  try {
    for (const line of lines) {
      const [id, provinceTh, provinceEn, lat, lng] = line.split(',');
      const result = insertProvince.run(
        Number.parseInt(id, 10),
        provinceTh,
        provinceEn,
        Number.parseFloat(lat),
        Number.parseFloat(lng)
      );

      inserted += result.changes;
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  return {
    total: lines.length,
    inserted,
  };
};

const getStats = (db) => {
  const count = db.prepare('SELECT COUNT(*) AS count FROM provinces');
  const countByStatus = db.prepare('SELECT COUNT(*) AS count FROM provinces WHERE status = ?');

  return {
    total: count.get().count,
    pending: countByStatus.get('pending').count,
    success: countByStatus.get('success').count,
    failed: countByStatus.get('failed').count,
  };
};

const getRowsByStatus = (db, status) =>
  db
    .prepare('SELECT id, province_en, lat, lng FROM provinces WHERE status = ? ORDER BY id')
    .all(status);

const getAllProvinceRecords = (db) =>
  db
    .prepare(`
      SELECT id, province_th, province_en, status, temperature, humidity, wind_speed
      FROM provinces
      ORDER BY id
    `)
    .all();

module.exports = {
  DB_FILE,
  openDatabase,
  setupDB,
  loadCSV,
  getStats,
  getRowsByStatus,
  getAllProvinceRecords,
};
