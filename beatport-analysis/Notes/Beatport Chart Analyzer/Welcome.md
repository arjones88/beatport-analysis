# Beatport Chart Analyzer Documentation

## Project Overview

The Beatport Chart Analyzer is a full-stack web application that scrapes, stores, and visualizes Beatport's Top 100 electronic music charts across multiple genres.

## Architecture

### Frontend
- **React TypeScript** application with Vite
- Interactive data table with sorting and filtering
- Trend analysis and visualization
- Dark/light mode toggle
- Responsive Bootstrap UI

### Backend
- **Node.js Express** API server
- **Python scraper** for data collection
- **PostgreSQL** database for storage
- Automated daily scraping via macOS launch daemon

### Data Pipeline
1. Python scraper collects daily chart data from Beatport
2. Data stored in PostgreSQL with timestamps
3. Express API serves processed data to frontend
4. React app displays interactive charts with trend analysis

## Key Features

- **35+ Genres**: Comprehensive coverage of electronic music genres
- **Trend Analysis**: Track rank changes over time with visual indicators
- **Interactive Sorting**: Sort by rank, trend, title, artist, or first appearance date
- **Real-time Data**: Daily updated charts from Beatport
- **Responsive Design**: Mobile-friendly interface
- **Dark Mode**: Theme toggle with localStorage persistence

## Documentation Structure

- [[Frontend]] - React application features and components
- [[Backend]] - API server, scraper, and database documentation

## Technology Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Bootstrap 5 (UI framework)
- React Testing Library + Vitest

### Backend
- Node.js + Express
- Python 3 + BeautifulSoup
- PostgreSQL
- macOS Launch Daemon

### Development Tools
- ESLint (code linting)
- TypeScript (type checking)
- Git (version control)

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.8+
- PostgreSQL
- npm/yarn

### Installation
```bash
# Clone repository
git clone <repository-url>
cd beatport-analysis

# Install dependencies
npm install

# Set up database
createdb beatport
# Configure environment variables in .env

# Start development server
npm run dev
```

### Data Collection
```bash
# Run scraper manually
python src/beatport.py

# Or install launch daemon for automated daily scraping
sudo cp com.beatport.scraper.plist /Library/LaunchDaemons/
sudo launchctl load /Library/LaunchDaemons/com.beatport.scraper.plist
```

## API Reference

### GET /api/tracks
Returns all track data from database.

**Response**: Array of track objects with artist, title, rank, date, and genre fields.

## Database Schema

```sql
CREATE TABLE beatport_top100 (
  artist VARCHAR(255),
  title VARCHAR(255),
  rank INTEGER,
  date DATE,
  genre VARCHAR(255)
);
```

## Development Workflow

1. **Data Collection**: Python scraper runs daily to collect chart data
2. **API Serving**: Express server provides RESTful access to data
3. **Frontend Development**: React app consumes API and displays interactive charts
4. **Testing**: Comprehensive test suite ensures reliability
5. **Deployment**: Automated processes for production deployment

## Contributing

- Follow TypeScript strict mode
- Write tests for new features
- Update documentation for API changes
- Use ESLint for code style consistency

## License

[Add license information here]