const Database = require('../server/database');

beforeAll(() => {
  process.env.DB_FILE = ':memory:';
});

async function testDbConnection() {
  const db = new Database();
  await db.connect();
  const version = await db.query('SELECT sqlite_version()');
  if (!version) throw new Error('Database connection failed');
}

module.exports = testDbConnection;
