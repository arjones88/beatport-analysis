# 🎵 Beatport Chart Analyzer

A full-stack web application that scrapes, analyzes, and visualizes Beatport's Top 100 electronic music charts across 35+ genres with interactive trend analysis.

![React](https://img.shields.io/badge/React-19.1.1-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)
![Vite](https://img.shields.io/badge/Vite-7.1.7-yellow.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-blue.svg)
![Python](https://img.shields.io/badge/Python-3.8+-yellow.svg)

## ✨ Features

### 🎶 Interactive Chart Analysis
- **35+ Electronic Music Genres**: From House and Techno to Drum & Bass and Dubstep
- **Real-time Trend Analysis**: Visual indicators showing rank changes (↑ rising, ↓ falling, → stable)
- **Interactive Sorting**: Sort by rank, trend, title, artist, or first appearance date
- **First Appearance Tracking**: See when tracks first entered the charts
- **Clickable Track Details**: Click any track to view its complete chart history with interactive charts

### 🎨 Modern UI/UX
- **Dark/Light Mode Toggle**: Persistent theme preference with localStorage
- **Responsive Design**: Mobile-friendly with Bootstrap 5
- **Loading States**: Smooth UX with loading indicators and error handling
- **Accessible**: Proper ARIA labels and keyboard navigation

### 🤖 Automated Data Pipeline
- **Daily Scraping**: Python scraper collects fresh data from Beatport
- **PostgreSQL Storage**: Efficient database design with proper indexing
- **RESTful API**: Clean Express.js API serving processed data
- **macOS Automation**: Launch daemon for automated daily updates

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Beatport.com  │───▶│  Python Scraper │───▶│  PostgreSQL DB  │
│   (Source)      │    │  (beatport.py)  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
┌─────────────────┐    ┌─────────────────┐             │
│   React App     │◀───│  Express API    │◀────────────┘
│   (Frontend)    │    │  (server.js)    │
└─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and **npm**
- **Python** 3.8+ with pip
- **PostgreSQL** 13+

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd beatport-analysis
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Set up PostgreSQL database**
   ```sql
   createdb beatport
   ```

4. **Configure environment variables**
   Create a `.env` file:
   ```env
   PGHOST=localhost
   PGPORT=5432
   PGDATABASE=beatport
   PGUSER=postgres
   PGPASSWORD=your_password
   ```

5. **Run initial data scrape** (optional)
   ```bash
   python src/beatport.py
   ```

6. **Start the development servers**
   ```bash
   # Terminal 1: Start API server
   node server.js

   # Terminal 2: Start frontend dev server
   npm run dev
   ```

7. **Open your browser**
   Navigate to `http://localhost:5173`

## 📊 Usage

### Frontend Interface
- **Genre Selection**: Choose from 35+ electronic music genres
- **Data Table**: View current day's tracks with rank, trend, title, artist, and first appearance
- **Track Details**: Click any track row to view detailed history and statistics
- **Interactive Charts**: Visualize rank progression over time with Recharts
- **Sorting**: Click column headers to sort data
- **Theme Toggle**: Switch between light and dark modes
- **Reload**: Manually refresh data from the database
- **Trend Analysis**: Uses historical data to show rank changes over time
- **Duplicate Filtering**: Removes duplicate songs, keeping only the highest ranked version

### API Usage
```bash
# Get all track data
curl http://localhost:3001/api/tracks
```

Response format:
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

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm run test         # Run tests in watch mode
npm run test:ui      # Run tests with UI
npm run test:run     # Run tests once

# Code Quality
npm run lint         # Run ESLint
```

### Project Structure
```
beatport-analysis/
├── src/
│   ├── components/       # React components
│   │   ├── MainChart.tsx     # Main chart view component
│   │   ├── TrackDetail.tsx   # Individual track detail page
│   │   └── TrackHistoryChart.tsx # Chart visualization component
│   ├── App.tsx           # Main app with routing
│   ├── App.css           # Styles
│   ├── main.tsx          # App entry point
│   ├── utils.ts          # Utility functions
│   ├── beatport.py       # Data scraper
│   └── test/             # Test files
├── server.js             # Express API server
├── package.json
├── tsconfig.json
├── vite.config.ts
└── Notes/                # Documentation
```

### Database Schema
```sql
CREATE TABLE beatport_top100 (
  artist VARCHAR(255),
  title VARCHAR(255),
  rank INTEGER,
  date DATE,
  genre VARCHAR(255)
);
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript strict mode
- Write tests for new features
- Run `npm run lint` before committing
- Update documentation for API changes
- Use conventional commit messages

## 📋 API Reference

### GET /api/tracks
Retrieve all track data from the database.

**Parameters**: None

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

**Error Response**:
```json
{
  "error": "Database connection failed"
}
```

### GET /api/tracks/:genre/:title/:artist
Retrieve historical chart data for a specific track.

**Parameters**:
- `genre`: URL-encoded genre slug (e.g., `house`, `techno-peak-time-driving`)
- `title`: URL-encoded track title (e.g., `amazing-track`)
- `artist`: URL-encoded artist name (e.g., `artist-name`)

**Example Request**:
```bash
curl "http://localhost:3001/api/tracks/house/amazing-track/artist-name"
```

**Response**: Array of historical track data
```json
[
  {
    "artist": "Artist Name",
    "title": "Amazing Track",
    "rank": 5,
    "date": "2024-01-01",
    "genre": "house"
  },
  {
    "artist": "Artist Name",
    "title": "Amazing Track",
    "rank": 3,
    "date": "2024-01-02",
    "genre": "house"
  }
]
```

**Error Response**:
```json
{
  "error": "Track not found"
}
```

## 🔧 Configuration

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `PGHOST` | localhost | PostgreSQL host |
| `PGPORT` | 5432 | PostgreSQL port |
| `PGDATABASE` | beatport | Database name |
| `PGUSER` | postgres | Database user |
| `PGPASSWORD` | (empty) | Database password |
| `PORT` | 3001 | API server port |

### Automated Scraping (macOS)
```bash
# Install launch daemon
sudo cp com.beatport.scraper.plist /Library/LaunchDaemons/
sudo launchctl load /Library/LaunchDaemons/com.beatport.scraper.plist
```

This runs the scraper daily at 6:00 AM.

## 🧪 Testing

The project includes comprehensive tests:

```bash
# Run all tests
npm run test:run

# Run with UI
npm run test:ui

# Run specific test
npm run test src/test/App.test.tsx
```

Test coverage includes:
- Component rendering and interactions
- API integration
- Data processing and sorting
- Error handling

## 📚 Documentation

Detailed documentation is available in the `Notes/` directory:

- **[Frontend Documentation](Notes/Beatport%20Chart%20Analyzer/Frontend.md)**: React app features and architecture
- **[Backend Documentation](Notes/Beatport%20Chart%20Analyzer/Backend.md)**: API, scraper, and database details

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Beatport** for providing the chart data
- **Bootstrap** for the UI framework
- **React Testing Library** for testing utilities
- **BeautifulSoup** for web scraping

---

**Made with ❤️ for electronic music enthusiasts**
