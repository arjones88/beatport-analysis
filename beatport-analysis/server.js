import express from 'express';
import { Pool } from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'beatport',
  user: process.env.PGUSER || 'amundjones',
  password: process.env.PGPASSWORD || '',
});

app.get('/api/tracks', async (req, res) => {
  try {
    const result = await pool.query('SELECT artist, title, rank, date, genre FROM beatport_top100 ORDER BY date DESC, genre, rank');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));