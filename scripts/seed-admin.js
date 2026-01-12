const path = require('path');

// Ensure we load environment variables the same way the server does
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const db = require('../server/db');
const auth = require('../server/auth');

if (typeof db.init === 'function') {
  db.init();
}

(async () => {
  try {

    const login = 'mercetti';
    const display_name = 'Mercetti';
    const email = 'owner@example.com';
    const role = 'owner';
    const status = 'active';

    // TODO: replace this with the real secure password before running
    const plainPassword = 'Hype420!Hype';

    const password_hash = auth.hashPassword(plainPassword); // @server/auth.js#338-349
    const existing = db.getAdminUser(login); // @server/db.js#732-787

    if (existing) {
      db.updateAdminUser(login, {
        display_name,
        email,
        role,
        status,
        password_hash,
        updated_by: 'bootstrap',
      }); // @server/db.js#790-821
      console.log('Updated existing admin:', login);
    } else {
      db.createAdminUser({
        login,
        display_name,
        email,
        password_hash,
        role,
        status,
        created_by: 'bootstrap',
      }); // @server/db.js#758-788
      console.log('Created admin:', login);
    }

    process.exit(0);
  } catch (err) {
    console.error('Failed to seed admin user:', err.message);
    process.exit(1);
  }
})();
