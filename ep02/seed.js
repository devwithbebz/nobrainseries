const { openDatabase, setupDB, loadCSV } = require('./db');

const run = () => {
  const db = openDatabase();

  try {
    setupDB(db);

    const csvLoad = loadCSV(db);
    console.log(`[*] Seeded ${csvLoad.total} provinces (${csvLoad.inserted} new)`);
  } finally {
    db.close();
  }
};

try {
  run();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
