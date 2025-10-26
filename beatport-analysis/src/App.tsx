import { useEffect, useState } from "react";
import "./App.css";

type Track = { genre: string; title: string; artist?: string; rank?: number };
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

function slugFromUrl(url: string) {
  try {
    const m = url.match(/\/genre\/([^/]+)/);
    return m ? m[1] : "";
  } catch {
    return "";
  }
}

function parseRow(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result.map(s => s.trim());
}

export default function App() {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCsv();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  function todayDateString(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  async function loadCsv() {
    setLoading(true);
    setError(null);
    setAllTracks([]);
    setTracks([]);

    try {
      // CSV placed next to this module — filename uses today's date
      const dateStr = todayDateString();
      const csvRelative = `./beatport_top100_${dateStr}.csv`;
      const url = new URL(csvRelative, import.meta.url).href;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load CSV: ${res.status} (${csvRelative})`);
      const text = await res.text();
      const parsed = parseCsvTracks(text);
      if (!parsed.length) {
        setError(`CSV parsed but contains no tracks. (${csvRelative})`);
      } else {
        setAllTracks(parsed);
      }
    } catch (err: any) {
      setError(err?.message ?? "Unknown error loading CSV");
    } finally {
      setLoading(false);
    }
  }

  function parseCsvTracks(csvText: string): Track[] {
    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return [];

    const headers = parseRow(lines[0]).map(h => h.replace(/^"|"$/g, "").toLowerCase());
    const idxGenre = headers.findIndex(h => /genre/.test(h));
    const idxTitle = headers.findIndex(h => /title|release|track|name/.test(h));
    const idxArtist = headers.findIndex(h => /artist|artists|byartist/.test(h));
    const idxRank = headers.findIndex(h => /rank|position|pos|order/.test(h));

    const out: Track[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseRow(lines[i]).map(c => c.replace(/^"|"$/g, ""));
      const genre = idxGenre >= 0 ? (cols[idxGenre] || "").trim() : "";
      const title = idxTitle >= 0 ? (cols[idxTitle] || "").trim() : (cols[1] || "").trim();
      const artist = idxArtist >= 0 ? (cols[idxArtist] || "").trim() : (cols[2] || "").trim();
      const rankRaw = idxRank >= 0 ? (cols[idxRank] || "").trim() : (cols[3] || "").trim();
      const rankNum = rankRaw ? Number(rankRaw.replace(/\D/g, "")) : undefined;
      const rank = typeof rankNum === "number" && !isNaN(rankNum) ? rankNum : undefined;

      if (!title) continue;
      out.push({ genre, title, artist: artist || undefined, rank });
    }
    return out;
  }

  return (
    <div className="App">
      <h1>Beatport Top 100</h1>

      <div style={{ marginBottom: 12 }}>
        <label htmlFor="genre-select" style={{ marginRight: 8 }}>Genre:</label>
        <select
          id="genre-select"
          value={String(selectedIndex)}
          onChange={(e) => setSelectedIndex(Number(e.target.value))}
        >
          {GENRES.map((g, i) => (
            <option key={g.url} value={String(i)}>
              {g.name}
            </option>
          ))}
        </select>

        <button onClick={loadCsv} style={{ marginLeft: 12 }} disabled={loading}>
          Reload
        </button>
      </div>

      {loading && <p>Loading CSV…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && tracks.length === 0 && <p>No tracks for selected genre.</p>}

      {!loading && tracks.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 6 }}>Rank</th>
              <th style={{ textAlign: "left", padding: 6 }}>Title</th>
              <th style={{ textAlign: "left", padding: 6 }}>Artist(s)</th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((t, i) => (
              <tr key={`${t.genre}-${t.rank ?? i}-${t.title}`} style={{ borderTop: "1px solid #eee" }}>
                <td style={{ padding: 6, width: 60 }}>{t.rank ?? i + 1}</td>
                <td style={{ padding: 6 }}>{t.title}</td>
                <td style={{ padding: 6, color: "#555" }}>{t.artist ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: 12, fontSize: 12, color: "#444" }}>
        CSV file loaded for date: {todayDateString()} (filename: beatport_top100_{todayDateString()}.csv)
      </div>
    </div>
  );
}
