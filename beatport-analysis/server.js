import express from 'express';
import { Pool } from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    const result = await pool.query('SELECT artist, title, rank, date, scraped_at, genre FROM beatport_top100 ORDER BY date DESC, scraped_at DESC, genre, rank');
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
      SELECT artist, title, rank, date, scraped_at, genre
      FROM beatport_top100
      WHERE LOWER(genre) = $1
      ORDER BY date DESC, scraped_at DESC
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

// Manual scrape trigger endpoint
app.post('/api/scrape', (req, res) => {
  console.log('Manual scrape triggered...');

  const pythonScript = path.join(__dirname, 'src', 'beatport.py');

  exec(`python3 ${pythonScript}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Scraper error: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }

    console.log(`Scraper completed successfully`);
    res.json({
      success: true,
      message: 'Scraping completed',
      timestamp: new Date().toISOString()
    });
  });
});

// Scrape status endpoint
app.get('/api/scrape-status', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT MAX(date) as last_scrape, COUNT(*) as total_records
      FROM beatport_top100
    `);

    const lastScrape = result.rows[0]?.last_scrape;
    const totalRecords = result.rows[0]?.total_records || 0;
    const daysSince = lastScrape ?
      Math.floor((new Date() - new Date(lastScrape)) / (1000 * 60 * 60 * 24)) :
      null;

    res.json({
      lastScrape,
      totalRecords,
      daysSince,
      status: daysSince === 0 ? 'current' : daysSince === 1 ? 'yesterday' : 'outdated'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Schedule daily scraping at noon
cron.schedule('0 12 * * *', () => {
  console.log('Running scheduled daily Beatport scraper...');

  const pythonScript = path.join(__dirname, 'src', 'beatport.py');

  exec(`python3 ${pythonScript}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Scheduled scraper error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Scheduled scraper stderr: ${stderr}`);
    }
    console.log(`Scheduled scraper completed successfully at ${new Date().toISOString()}`);
  });
});

console.log('Daily scraper scheduled to run at noon (0 12 * * *)');

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));