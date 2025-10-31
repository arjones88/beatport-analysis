import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../App.css";

type Track = { genre: string; title: string; artist?: string; rank?: number; date?: string; trend?: number; firstAppeared?: string };
type Genre = { name: string; url: string };

const GENRES: Genre[] = [
  { name: "140 - Deep / Dubstep / Grime", url: "https://www.beatport.com/genre/140-deep-dubstep-grime/95/top-100" },
  { name: "Amapiano", url: "https://www.beatport.com/genre/amapiano/98/top-100" },
  { name: "Afro House", url: "https://www.beatport.com/genre/afro-house/89/top-100" },
  { name: "Ambient / Experimental", url: "https://www.beatport.com/genre/ambient-experimental/100/top-100" },
  { name: "Bass Club", url: "https://www.beatport.com/genre/bass-club/85/top-100" },
  { name: "Bass House", url: "https://www.beatport.com/genre/bass-house/91/top-100" },
  { name: "Brazilian Funk", url: "https://www.beatport.com/genre/brazilian-funk/101/top-100" },
  { name: "Breaks / Breakbeat / UK Bass", url: "https://www.beatport.com/genre/breaks-breakbeat-uk-bass/9/top-100" },
  { name: "Dance / Pop", url: "https://www.beatport.com/genre/dance-pop/39/top-100" },
  { name: "Deep House", url: "https://www.beatport.com/genre/deep-house/12/top-100" },
  { name: "Downtempo", url: "https://www.beatport.com/genre/downtempo/63/top-100" },
  { name: "Drum & Bass", url: "https://www.beatport.com/genre/drum-bass/1/top-100" },
  { name: "Dubstep", url: "https://www.beatport.com/genre/dubstep/18/top-100" },
  { name: "Electro / Classic / Detroit / Modern", url: "https://www.beatport.com/genre/electro-classic-detroit-modern/94/top-100" },
  { name: "Electronica", url: "https://www.beatport.com/genre/electronica/3/top-100" },
  { name: "Funky House", url: "https://www.beatport.com/genre/funky-house/81/top-100" },
  { name: "Hard Dance / Hardcore / Neo-Rave", url: "https://www.beatport.com/genre/hard-dance-hardcore-neo-rave/8/top-100" },
  { name: "Hard Techno", url: "https://www.beatport.com/genre/hard-techno/2/top-100" },
  { name: "House", url: "https://www.beatport.com/genre/house/5/top-100" },
  { name: "Indie Dance", url: "https://www.beatport.com/genre/indie-dance/37/top-100" },
  { name: "Jackin House", url: "https://www.beatport.com/genre/jackin-house/97/top-100" },
  { name: "Mainstage", url: "https://www.beatport.com/genre/mainstage/96/top-100" },
  { name: "Melodic House & Techno", url: "https://www.beatport.com/genre/melodic-house-techno/90/top-100" },
  { name: "Minimal / Deep / Tech", url: "https://www.beatport.com/genre/minimal-deep-tech/14/top-100" },
  { name: "Nu-Disco / Disco", url: "https://www.beatport.com/genre/nu-disco-disco/50/top-100" },
  { name: "Organic House", url: "https://www.beatport.com/genre/organic-house/93/top-100" },
  { name: "Progressive House", url: "https://www.beatport.com/genre/progressive-house/15/top-100" },
  { name: "Psy-Trance", url: "https://www.beatport.com/genre/psy-trance/13/top-100" },
  { name: "Tech House", url: "https://www.beatport.com/genre/tech-house/11/top-100" },
  { name: "Techno (Peak-time / Driving)", url: "https://www.beatport.com/genre/techno-peak-time-driving/6/top-100" },
  { name: "Techno (Raw / Deep / Hypnotic)", url: "https://www.beatport.com/genre/techno-raw-deep-hypnotic/92/top-100" },
  { name: "Trance (Main Floor)", url: "https://www.beatport.com/genre/trance-main-floor/7/top-100" },
  { name: "Trance (Raw / Deep / Hypnotic)", url: "https://www.beatport.com/genre/trance-raw-deep-hypnotic/99/top-100" },
  { name: "Trap / Future Bass", url: "https://www.beatport.com/genre/trap-future-bass/38/top-100" },
  { name: "UK Garage / Bassline", url: "https://www.beatport.com/genre/uk-garage-bassline/86/top-100" },
 ];

import { slugFromUrl } from "../utils";

export default function MainChart() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedIndex, setSelectedIndex] = useState<number>(() => {
    const genreParam = searchParams.get('genre');
    if (genreParam) {
      const index = GENRES.findIndex(g => slugFromUrl(g.url) === genreParam);
      return index >= 0 ? index : 0;
    }
    return 0;
  });
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedDate, setLoadedDate] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [sortColumn, setSortColumn] = useState<string>('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    loadTracks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.body.setAttribute('data-bs-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedTracks = [...tracks].sort((a, b) => {
    let aVal: number | string, bVal: number | string;
    switch (sortColumn) {
      case 'rank':
        aVal = a.rank ?? Infinity;
        bVal = b.rank ?? Infinity;
        break;
      case 'trend':
        aVal = a.trend ?? 0;
        bVal = b.trend ?? 0;
        break;
      case 'title':
        aVal = a.title.toLowerCase();
        bVal = b.title.toLowerCase();
        break;
      case 'artist':
        aVal = (a.artist ?? '').toLowerCase();
        bVal = (b.artist ?? '').toLowerCase();
        break;
      case 'firstAppeared':
        aVal = a.firstAppeared ?? '';
        bVal = b.firstAppeared ?? '';
        break;
      default:
        return 0;
    }
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredTracks = searchTerm
    ? sortedTracks.filter(track =>
        track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (track.artist ?? '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : sortedTracks;

  const artistCount: Record<string, number> = {};
  filteredTracks.forEach(track => {
    const artist = track.artist || '';
    artistCount[artist] = (artistCount[artist] || 0) + 1;
  });

  useEffect(() => {
    // filter displayed tracks per selected genre and latest date whenever allTracks or selectedIndex changes
    if (!allTracks.length) {
      setTracks([]);
      return;
    }
    const slug = slugFromUrl(GENRES[selectedIndex].url);

    // Find the latest date from all tracks
    const latestDate = allTracks.reduce((latest, track) => {
      return track.date! > latest ? track.date! : latest;
    }, allTracks[0].date!);

    // Filter by genre and latest date, then remove duplicates keeping only the highest ranked (lowest rank number)
    const genreTracks = allTracks.filter(t => t.genre === slug && t.date === latestDate);

    // Remove duplicates by title+artist, keeping the one with the best rank (lowest number)
    const seen = new Set<string>();
    const deduplicated = genreTracks
      .sort((a, b) => (Number(a.rank ?? Infinity) - Number(b.rank ?? Infinity))) // Sort by rank first
      .filter(track => {
        const key = `${track.title.toLowerCase().trim()}-${(track.artist || '').toLowerCase().trim()}`;
        if (seen.has(key)) {
          return false; // Skip duplicate
        }
        seen.add(key);
        return true; // Keep first occurrence (best rank)
      });

    setTracks(deduplicated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTracks, selectedIndex]);


  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  function computeTrends(tracks: Track[]): Track[] {
    // Group tracks by genre+title+artist to ensure same exact track
    const trackMap = new Map<string, Track[]>();
    tracks.forEach(track => {
      const key = `${track.genre}-${track.title.toLowerCase().trim()}-${(track.artist || '').toLowerCase().trim()}`;
      if (!trackMap.has(key)) trackMap.set(key, []);
      trackMap.get(key)!.push(track);
    });

    // For each group, compute trend by comparing best ranks between consecutive dates
    const result: Track[] = [];
    trackMap.forEach(group => {
      // Group by date and find best rank for each date
      const dateMap = new Map<string, Track>();
      group.forEach(track => {
        const existing = dateMap.get(track.date!);
        if (!existing || (track.rank ?? Infinity) < (existing.rank ?? Infinity)) {
          dateMap.set(track.date!, track);
        }
      });

      // Sort dates descending
      const sortedDates = Array.from(dateMap.keys()).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      // Calculate trends between consecutive dates
      for (let i = 0; i < sortedDates.length; i++) {
        const currentTrack = dateMap.get(sortedDates[i])!;
        if (i < sortedDates.length - 1) {
          const nextTrack = dateMap.get(sortedDates[i + 1])!;
          if (currentTrack.rank !== undefined && nextTrack.rank !== undefined) {
            currentTrack.trend = nextTrack.rank - currentTrack.rank; // positive = rising
          }
        }
        // Find first appearance date
        const minDate = sortedDates[sortedDates.length - 1];
        currentTrack.firstAppeared = minDate;
      }

      result.push(...group);
    });
    return result;
  }

  async function loadTracks() {
    setLoading(true);
    setError(null);
    setAllTracks([]);
    setTracks([]);
    setLoadedDate(null);

    try {
      const res = await fetch('http://localhost:3001/api/tracks');
      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }
      const rows: Track[] = await res.json();
      if (!rows.length) {
        throw new Error("No tracks found in database");
      }
      const tracksData: Track[] = rows.map(r => ({
        genre: r.genre,
        title: r.title,
        artist: r.artist,
        rank: r.rank,
        date: r.date,
      }));
      // Compute trends
      const tracksWithTrends = computeTrends(tracksData);
      setAllTracks(tracksWithTrends);
      // Find the latest date
      const dates = rows.map(r => r.date).filter(date => date !== undefined);
      const latestDate = dates.length > 0 ? dates.reduce((a, b) => a! > b! ? a : b) : null;
      setLoadedDate(latestDate);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }

  const handleTrackClick = (track: Track) => {
    // Create URL-friendly slugs
    const genreSlug = track.genre;
    const titleSlug = track.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const artistSlug = (track.artist || 'unknown-artist').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    navigate(`/track/${genreSlug}/${titleSlug}/${artistSlug}`);
  };

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="mb-0">Beatport Top 100</h1>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="btn btn-outline-secondary"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <label htmlFor="genre-select" className="form-label">Genre:</label>
              <select
                id="genre-select"
                className="form-select"
                value={String(selectedIndex)}
                onChange={(e) => setSelectedIndex(Number(e.target.value))}
              >
                {GENRES.map((g, i) => (
                  <option key={g.url} value={String(i)}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6 d-flex align-items-end">
              <button
                onClick={loadTracks}
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Reload'}
              </button>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-8">
              <label htmlFor="search-input" className="form-label">Search tracks:</label>
              <input
                id="search-input"
                type="text"
                className="form-control"
                placeholder="Search by title or artist..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <button
                onClick={() => setSearchTerm('')}
                className="btn btn-outline-secondary"
                disabled={!searchTerm}
              >
                Clear Search
              </button>
            </div>
          </div>

          {loading && <div className="alert alert-info">Loading tracks...</div>}
          {error && <div className="alert alert-danger">{error}</div>}

          {!loading && !error && tracks.length === 0 && (
            <div className="alert alert-warning">No tracks for selected genre.</div>
          )}

          {!loading && !error && tracks.length > 0 && filteredTracks.length === 0 && searchTerm && (
            <div className="alert alert-info">No tracks match your search "{searchTerm}".</div>
          )}

          {!loading && tracks.length > 0 && (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead className="table-dark">
                  <tr>
                    <th onClick={() => handleSort('rank')} style={{ cursor: 'pointer', minWidth: '80px' }}>
                      Rank {sortColumn === 'rank' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('trend')} style={{ cursor: 'pointer', minWidth: '80px' }}>
                      Trend {sortColumn === 'trend' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('title')} style={{ cursor: 'pointer' }}>
                      Title {sortColumn === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('artist')} style={{ cursor: 'pointer' }}>
                      Artist(s) {sortColumn === 'artist' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('firstAppeared')} style={{ cursor: 'pointer' }}>
                      First Appeared {sortColumn === 'firstAppeared' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTracks.map((t, i) => (
                    <tr
                      key={`${t.genre}-${t.rank ?? i}-${t.title}`}
                      onClick={() => handleTrackClick(t)}
                      style={{ cursor: 'pointer' }}
                      className="track-row"
                    >
                      <td className="fw-bold">{t.rank ?? i + 1}</td>
                      <td>
                        {t.trend !== undefined ? (
                          t.trend > 0 ? (
                            <span className="text-success">↑ +{t.trend}</span>
                          ) : t.trend < 0 ? (
                            <span className="text-danger">↓ {t.trend}</span>
                          ) : (
                            <span className="text-muted">→ 0</span>
                          )
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>{t.title}</td>
                      <td className="text-muted">{t.artist ?? "-"} ({artistCount[t.artist || ''] || 0})</td>
                      <td className="text-muted">{t.firstAppeared ? formatDate(t.firstAppeared) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-3 text-muted small">
            Data loaded from database for date: {loadedDate ?? "unknown"}
          </div>
        </div>
      </div>
    </div>
  );
}