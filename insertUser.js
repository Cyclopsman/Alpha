const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'Recovery@5050',
  port: 5432,
});

const insertUser = async () => {
  const username = 'noelosei361@icloud.com';
  const rawPassword = 'Recovery@5050';
  const role = 'user';

  try {
    // Check if user already exists
    const check = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (check.rows.length > 0) {
      console.log('❗ User already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const result = await pool.query(
      `INSERT INTO users (username, password, role)
       VALUES ($1, $2, $3) RETURNING id, username, role`,
      [username, hashedPassword, role]
    );

    console.log('✅ User inserted:', result.rows[0]);
  } catch (err) {
    console.error('❌ Error inserting user:', err);
  } finally {
    await pool.end();
  }
};

insertUser();
