import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type TrackData = {
  artist: string;
  title: string;
  rank: number;
  date: string;
  genre: string;
};

type TrackHistoryChartProps = {
  trackHistory: TrackData[];
};

export default function TrackHistoryChart({ trackHistory }: TrackHistoryChartProps) {
  // Prepare data for the chart - sort by date ascending for proper timeline
  const chartData = trackHistory
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(track => ({
      date: new Date(track.date).toLocaleDateString(),
      rank: track.rank,
      fullDate: track.date
    }));

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { fullDate: string; rank: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-300 rounded p-2 shadow">
          <p className="font-semibold">{`Date: ${formatDate(data.fullDate)}`}</p>
          <p className="text-blue-600">{`Rank: #${data.rank}`}</p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return <div className="text-center text-muted py-4">No chart history available</div>;
  }

  return (
    <div className="chart-container" style={{ width: '100%', height: '400px', padding: '10px', boxSizing: 'border-box' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 20, left: 40, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[100, 1]}
            tick={{ fontSize: 12 }}
            label={{ value: 'Rank', angle: -90, position: 'insideLeft' }}
            reversed={true}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="rank"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2, fill: '#fff' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}