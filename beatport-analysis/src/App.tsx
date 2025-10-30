import { useEffect, useState } from "react";
import "./App.css";

type Track = { genre: string; title: string; artist?: string; rank?: number; date?: string };
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

import { slugFromUrl } from "./utils";



export default function App() {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedDate, setLoadedDate] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    loadTracks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.body.setAttribute('data-bs-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    // filter displayed tracks per selected genre whenever allTracks or selectedIndex changes
    if (!allTracks.length) {
      setTracks([]);
      return;
    }
    const slug = slugFromUrl(GENRES[selectedIndex].url);
    const filtered = allTracks
      .filter(t => t.genre === slug)
      .slice() // copy
      .sort((a, b) => (Number(a.rank ?? Infinity) - Number(b.rank ?? Infinity)));
    setTracks(filtered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTracks, selectedIndex]);


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
      }));
      setAllTracks(tracksData);
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

          {loading && <div className="alert alert-info">Loading tracks...</div>}
          {error && <div className="alert alert-danger">{error}</div>}

          {!loading && !error && tracks.length === 0 && (
            <div className="alert alert-warning">No tracks for selected genre.</div>
          )}

          {!loading && tracks.length > 0 && (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>Rank</th>
                    <th>Title</th>
                    <th>Artist(s)</th>
                  </tr>
                </thead>
                <tbody>
                  {tracks.map((t, i) => (
                    <tr key={`${t.genre}-${t.rank ?? i}-${t.title}`}>
                      <td className="fw-bold">{t.rank ?? i + 1}</td>
                      <td>{t.title}</td>
                      <td className="text-muted">{t.artist ?? "-"}</td>
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
