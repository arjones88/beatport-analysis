import express from 'express';
import { Pool } from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
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

app.get('/api/tracks/:genre/:title/:artist', async (req, res) => {
  try {
    const { genre, title, artist } = req.params;

    // Normalize parameters for database query
    const normalizedGenre = decodeURIComponent(genre).toLowerCase();
    const normalizedTitleSlug = decodeURIComponent(title).toLowerCase();
    const normalizedArtistSlug = decodeURIComponent(artist).toLowerCase();

    // Query to find tracks that match the normalized slugs
    // First, let's get all tracks for the genre and then filter in JavaScript
    const query = `
      SELECT artist, title, rank, date, genre
      FROM beatport_top100
      WHERE LOWER(genre) = $1
      ORDER BY date DESC
    `;

    const dbResult = await pool.query(query, [normalizedGenre]);

    // Filter results in JavaScript to match the URL slugs
    const filteredRows = dbResult.rows.filter(row => {
      const dbTitleSlug = row.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const dbArtistSlug = row.artist.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      return dbTitleSlug === normalizedTitleSlug && dbArtistSlug === normalizedArtistSlug;
    });

    if (filteredRows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }

    res.json(filteredRows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));