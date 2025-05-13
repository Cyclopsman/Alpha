const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config(); 
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'postgres',
        password: process.env.DB_PASSWORD || 'Recovery@5050',
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
      }
);

pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('Database connection error:', err);
  else console.log('✅ Database connected');
});

function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

function authorizeRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) return res.sendStatus(403);
    next();
  };
}

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/meters', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`SELECT 
      meter_number, latitude::float as latitude, longitude::float as longitude,
      status, account_number, id, reader_location, visited_timestamp
      FROM meters`);
    res.json({ data: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch meters' });
  }
});

app.post('/api/meters/update-status', authenticateToken, async (req, res) => {
  const { meter_number, status, reader_lat, reader_lng } = req.body;
  if (!meter_number || !status) {
    return res.status(400).json({ error: 'meter_number and status are required' });
  }

  try {
    let query, params;
    if (reader_lat && reader_lng) {
      query = `UPDATE meters SET status = $1, reader_location = point($2, $3), visited_timestamp = NOW()
               WHERE meter_number = $4 RETURNING *`;
      params = [status, reader_lat, reader_lng, meter_number];
    } else {
      query = `UPDATE meters SET status = $1 WHERE meter_number = $2 RETURNING *`;
      params = [status, meter_number];
    }

    const result = await pool.query(query, params);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Meter not found' });

    res.json({ success: true, updatedMeter: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update meter status' });
  }
});

app.patch('/api/meters/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status, reader_lat, reader_lng } = req.body;

  try {
    let query, params;
    if (reader_lat && reader_lng) {
      query = `UPDATE meters SET status = $1, reader_location = point($2, $3), visited_timestamp = NOW()
               WHERE id = $4 RETURNING *`;
      params = [status, reader_lat, reader_lng, id];
    } else {
      query = `UPDATE meters SET status = $1 WHERE id = $2 RETURNING *`;
      params = [status, id];
    }

    const result = await pool.query(query, params);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Meter not found' });

    res.status(200).json({ meter: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const upload = multer({ dest: 'uploads/' });

app.post('/api/meters/upload', authenticateToken, authorizeRole('supervisor'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE meters SET status = $1', ['Pending']);

      for (const row of data) {
        const meter_number = row.METER?.toString().trim();
        const latitude = parseFloat(row.LATITUDE);
        const longitude = parseFloat(row.LONGITUDE);
        const account_number = row.ACCOUNT?.toString().trim();
        const district_name = row.DISTRICT?.toString().trim();

        if (!meter_number || isNaN(latitude) || isNaN(longitude) || !account_number || !district_name) continue;

        const check = await client.query('SELECT * FROM meters WHERE meter_number = $1', [meter_number]);

        if (check.rows.length > 0) {
          await client.query(
            `UPDATE meters SET latitude = $1, longitude = $2, account_number = $3, district_name = $4 
             WHERE meter_number = $5`,
            [latitude, longitude, account_number, district_name, meter_number]
          );
        } else {
          await client.query(
            `INSERT INTO meters (meter_number, latitude, longitude, status, account_number, district_name)
             VALUES ($1, $2, $3, 'Pending', $4, $5)`,
            [meter_number, latitude, longitude, account_number, district_name]
          );
        }
      }

      await client.query('COMMIT');
      res.json({ success: true });
    } catch (error) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: 'Upload failed' });
    } finally {
      client.release();
    }
  } finally {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
  }
});

app.delete('/api/meters/all', authenticateToken, authorizeRole('supervisor'), async (req, res) => {
  try {
    await pool.query('DELETE FROM meters');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete meters' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
