import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import TrackHistoryChart from './TrackHistoryChart';

type TrackData = {
  artist: string;
  title: string;
  rank: number;
  date: string;
  genre: string;
};

export default function TrackDetail() {
  const { genre, title, artist } = useParams<{ genre: string; title: string; artist: string }>();
  const [trackHistory, setTrackHistory] = useState<TrackData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTrackHistory();
  }, [genre, title, artist]);

  const loadTrackHistory = async () => {
    if (!genre || !title || !artist) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:3001/api/tracks/${genre}/${title}/${artist}`);
      if (!response.ok) {
        throw new Error(`Failed to load track history: ${response.status}`);
      }
      const data: TrackData[] = await response.json();
      setTrackHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const getCurrentRank = (): number | null => {
    if (trackHistory.length === 0) return null;
    // Get the most recent entry
    const latest = trackHistory.reduce((latest, current) =>
      new Date(current.date) > new Date(latest.date) ? current : latest
    );
    return latest.rank;
  };

  const getPeakRank = (): number => {
    if (trackHistory.length === 0) return 0;
    return Math.min(...trackHistory.map(track => track.rank));
  };

  const getFirstAppearance = (): string | null => {
    if (trackHistory.length === 0) return null;
    const earliest = trackHistory.reduce((earliest, current) =>
      new Date(current.date) < new Date(earliest.date) ? current : earliest
    );
    return earliest.date;
  };

  const getGenreDisplayName = (genreSlug: string): string => {
    // Convert slug back to display name
    return genreSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading track history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h4 className="alert-heading">Error Loading Track</h4>
          <p>{error}</p>
          <Link to={`/?genre=${genre}`} className="btn btn-primary">Back to Charts</Link>
        </div>
      </div>
    );
  }

  if (trackHistory.length === 0) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning">
          <h4 className="alert-heading">Track Not Found</h4>
          <p>The requested track could not be found in our database.</p>
          <Link to={`/?genre=${genre}`} className="btn btn-primary">Back to Charts</Link>
        </div>
      </div>
    );
  }

  const currentRank = getCurrentRank();
  const peakRank = getPeakRank();
  const firstAppearance = getFirstAppearance();
  const track = trackHistory[0]; // All entries have same title/artist

  return (
    <div className="container mt-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">Beatport Charts</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to={`/?genre=${track.genre}`}>{getGenreDisplayName(track.genre)}</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {track.title}
          </li>
        </ol>
      </nav>

      <div className="row">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title mb-0">{track.title}</h2>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <h5>Artist</h5>
                  <p className="text-muted">{track.artist || 'Unknown Artist'}</p>
                </div>
                <div className="col-md-6">
                  <h5>Genre</h5>
                  <p className="text-muted">{getGenreDisplayName(track.genre)}</p>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <h5>Current Rank</h5>
                  <p className="h4 text-primary">#{currentRank}</p>
                </div>
                <div className="col-md-4">
                  <h5>Peak Rank</h5>
                  <p className="h4 text-success">#{peakRank}</p>
                </div>
                <div className="col-md-4">
                  <h5>First Appearance</h5>
                  <p className="text-muted">{firstAppearance ? formatDate(firstAppearance) : 'Unknown'}</p>
                </div>
              </div>

              <div className="row">
                <div className="col-12">
                  <h5>Chart History</h5>
                  <p className="text-muted small">
                    Track has appeared in {trackHistory.length} chart{trackHistory.length !== 1 ? 's' : ''}
                  </p>
                  <TrackHistoryChart trackHistory={trackHistory} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Statistics</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <strong>Total Appearances:</strong> {trackHistory.length}
              </div>
              <div className="mb-3">
                <strong>Best Rank:</strong> #{peakRank}
              </div>
              <div className="mb-3">
                <strong>Current Rank:</strong> {currentRank ? `#${currentRank}` : 'Not in current chart'}
              </div>
              <div className="mb-3">
                <strong>Genre:</strong> {getGenreDisplayName(track.genre)}
              </div>
            </div>
          </div>

           <div className="mt-3">
             <Link to={`/?genre=${track.genre}`} className="btn btn-secondary w-100">
               ← Back to Charts
             </Link>
           </div>
        </div>
      </div>
    </div>
  );
}