# Backend Documentation

## Overview
The backend consists of multiple components that collect, store, and serve Beatport Top 100 chart data. It includes a Node.js Express API server, a Python web scraper, and PostgreSQL database integration.

## Architecture Components

### 1. Express API Server (`server.js`)
### 2. Python Data Scraper (`beatport.py`)
### 3. PostgreSQL Database
### 4. Automated Scheduling (Node.js Cron)

## Technology Stack
- **Node.js** with Express framework
- **Python 3** with BeautifulSoup for web scraping
- **PostgreSQL** database
- **pg** (node-postgres) for database connectivity
- **psycopg2** for Python database operations

---

## Express API Server

### Configuration
- **Port**: 3001 (configurable via `PORT` environment variable)
- **CORS**: Enabled for cross-origin requests
- **Environment Variables**:
  - `PGHOST`: PostgreSQL host
  - `PGPORT`: PostgreSQL port
  - `PGDATABASE`: Database name
  - `PGUSER`: Database username
  - `PGPASSWORD`: Database password

### API Endpoints

#### `GET /api/tracks`
**Purpose**: Retrieve all track data from the database

**Response**: Array of track objects
```json
[
  {
    "artist": "Artist Name",
    "title": "Track Title",
    "rank": 1,
    "date": "2025-01-30T05:00:00.000Z",
    "genre": "house"
  }
]
```

**Database Query**:
```sql
SELECT artist, title, rank, date, genre
FROM beatport_top100
ORDER BY date DESC, genre, rank
```

**Error Handling**:
- Returns 500 status with error message on database failures
- Validates data existence before returning

#### `POST /api/scrape`
**Purpose**: Manually trigger a scraping operation

**Response**:
```json
{
  "success": true,
  "message": "Scraping completed",
  "timestamp": "2025-01-30T12:00:00.000Z"
}
```

**Process**:
- Executes `python3 src/beatport.py` as a child process
- Returns success/error status based on execution result

#### `GET /api/scrape-status`
**Purpose**: Get information about scraping status and data freshness

**Response**:
```json
{
  "lastScrape": "2025-01-30T00:00:00.000Z",
  "totalRecords": 3500,
  "daysSince": 0,
  "status": "current"
}
```

**Database Query**:
```sql
SELECT MAX(date) as last_scrape, COUNT(*) as total_records
FROM beatport_top100
```

**Status Logic**:
- `"current"`: daysSince === 0
- `"yesterday"`: daysSince === 1
- `"outdated"`: daysSince > 1

### Server Features
- **Connection Pooling**: Uses pg.Pool for efficient database connections
- **Automated Scheduling**: Node-cron runs scraper daily at midnight
- **Manual Scraping**: POST endpoint for on-demand data collection
- **Status Monitoring**: GET endpoint for scraping status and data freshness
- **Error Handling**: Comprehensive try/catch blocks with rollback support
- **Logging**: Console output for server startup, scraping, and errors

---

## Python Data Scraper

### Purpose
Scrapes Beatport Top 100 charts for multiple genres and stores data in PostgreSQL database.

### Configuration
**Environment Variables** (with defaults):
- `PGHOST`: 192.168.1.152
- `PGPORT`: 5432
- `PGDATABASE`: beatport
- `PGUSER`: postgres
- `PGPASSWORD`: (empty)

### Supported Genres
Scrapes 35+ electronic music genres including:
- House, Techno, Drum & Bass
- Dubstep, Deep House, Tech House
- Trance, Progressive House
- And many more...

### Scraping Process

#### 1. URL Fetching (`fetch_url()`)
- Uses requests.Session for connection reuse
- Implements retry logic with exponential backoff
- Respects rate limits with random delays (1-2.5 seconds)
- User-Agent header to avoid blocking

#### 2. HTML Parsing (`parse_chart()`)
Multiple parsing strategies for different Beatport page layouts:
- **Primary**: Modern data-testid selectors
- **Fallback**: CSS class-based selectors
- **Legacy**: Generic bucket/item selectors

Extracts:
- Track rank (1-100)
- Track title
- Artist names (joined with " & ")

#### 3. Data Processing
- Converts genre URLs to slugs
- Truncates long strings (255 char limit)
- Adds current date to all records

#### 4. Database Operations
- Creates table if not exists:
```sql
CREATE TABLE IF NOT EXISTS beatport_top100 (
  artist VARCHAR(255),
  title VARCHAR(255),
  rank INTEGER,
  date DATE,
  genre VARCHAR(255)
);
```
- Batch inserts using `execute_batch()` for performance
- Transaction handling with rollback on errors

### Scraping Features
- **Rate Limiting**: Built-in delays between requests
- **Error Recovery**: Continues processing other genres if one fails
- **Data Validation**: Skips empty/invalid tracks
- **Progress Logging**: Console output for each genre processed

---

## Database Schema

### Table: `beatport_top100`
| Column  | Type          | Description              |
|---------|---------------|--------------------------|
| artist  | VARCHAR(255)  | Artist name(s)           |
| title   | VARCHAR(255)  | Track title              |
| rank    | INTEGER       | Chart position (1-100)   |
| date    | DATE          | Chart date               |
| genre   | VARCHAR(255)  | Genre slug               |

### Indexes
- Primary key: Implicit (no explicit primary key defined)
- Recommended: Index on `(date, genre, rank)` for query performance

---

## Automated Scheduling (Node.js Cron)

### Implementation
The Express server uses the `node-cron` package to automatically schedule daily scraping operations.

**Configuration**:
```javascript
// Schedule daily scraping at midnight
cron.schedule('0 0 * * *', () => {
  // Execute python3 src/beatport.py
});
```

**Features**:
- Runs Python scraper daily at midnight (00:00)
- Integrated with the main server process
- No separate daemon process required
- Automatic error handling and logging
- Cross-platform compatibility (not macOS-specific)

**Benefits over Launch Daemon**:
- Simpler deployment and configuration
- Better error visibility in server logs
- No system-level permissions required
- Works on any platform supporting Node.js

---

## Data Flow

1. **Daily Scraping**: Python script runs via Node.js cron job at midnight
2. **Web Scraping**: Fetches Beatport Top 100 pages for all genres
3. **Data Extraction**: Parses HTML to extract track information
4. **Database Storage**: Inserts new records with current date
5. **API Serving**: Express server queries database for frontend consumption
6. **Manual Triggers**: Optional on-demand scraping via POST /api/scrape
7. **Status Monitoring**: Real-time scraping status via GET /api/scrape-status
8. **Frontend Display**: React app fetches and displays processed data

## Error Handling

### API Server
- Database connection failures
- Query execution errors
- Empty result sets
- Network timeouts

### Scraper
- HTTP request failures (retries with backoff)
- HTML parsing failures (multiple strategies)
- Database connection/write errors
- Rate limiting detection

## Performance Considerations

### Database
- Connection pooling in Express server
- Batch inserts in Python scraper
- Efficient queries with proper ordering

### Scraping
- Session reuse for HTTP requests
- Rate limiting compliance
- Parallel processing of genres (sequential to avoid blocking)

### API
- Single optimized query
- Minimal data transformation
- CORS headers for frontend access

## Monitoring & Maintenance

### Logs
- Server startup/shutdown messages
- Automated scraping execution and results
- Manual scraping triggers and outcomes
- Database operation results
- API request/response logging

### Status Monitoring
- **Scrape Status Endpoint**: GET /api/scrape-status provides:
  - Last scraping timestamp
  - Total records in database
  - Days since last scrape
  - Data freshness status (current/yesterday/outdated)

### Database Maintenance
- Regular cleanup of old data (if needed)
- Index optimization
- Connection pool monitoring

### Error Recovery
- Automatic retries in scraping
- Transaction rollbacks on database errors
- Graceful degradation in API responses