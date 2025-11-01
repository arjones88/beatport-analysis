import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type TrackData = {
  artist: string;
  title: string;
  rank: number;
  date: string;
  scraped_at?: string;
  genre: string;
};

type TrackHistoryChartProps = {
  trackHistory: TrackData[];
  width?: number;
  height?: number;
};

export default function TrackHistoryChart({ trackHistory, width, height }: TrackHistoryChartProps) {
  // Prepare data for the chart - deduplicate by date (keep most recent data per day) and sort by date ascending
  const deduplicatedData = Object.values(
    trackHistory.reduce((acc, track) => {
      const dateKey = new Date(track.date).toLocaleDateString();
      if (!acc[dateKey] || new Date(track.scraped_at ?? track.date) > new Date(acc[dateKey].fullDate)) {
        acc[dateKey] = {
          date: dateKey,
          rank: track.rank,
          fullDate: track.scraped_at ?? track.date
        };
      }
      return acc;
    }, {} as Record<string, { date: string; rank: number; fullDate: string }>)
  ).sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

  // Calculate trends with fallback logic
  const chartData = [];
  for (let i = 0; i < deduplicatedData.length; i++) {
    let trend = 0;
    if (i > 0) {
      trend = deduplicatedData[i].rank - deduplicatedData[i - 1].rank;
    }

    // If trend is 0, use the most recent non-zero trend
    if (trend === 0 && i > 0) {
      for (let j = i - 1; j >= 0; j--) {
        const prevTrend = j > 0 ? deduplicatedData[j].rank - deduplicatedData[j - 1].rank : 0;
        if (prevTrend !== 0) {
          trend = prevTrend;
          break;
        }
      }
    }

    chartData.push({
      ...deduplicatedData[i],
      trend: trend
    });
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { fullDate: string; rank: number; trend: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const trendSymbol = data.trend > 0 ? '↑' : data.trend < 0 ? '↓' : '→';
      const trendValue = Math.abs(data.trend);

      return (
        <div className="bg-white border border-gray-300 rounded p-2 shadow">
          <p className="font-semibold">{`Date: ${formatDate(data.fullDate)}`}</p>
          <p className="text-blue-600">{`Rank: #${data.rank}`}</p>
          <p className="text-gray-600">{`Trend: ${trendSymbol} ${trendValue}`}</p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return <div className="text-center text-muted py-4">No chart history available</div>;
  }

  const chartWidth = width || '100%';
  const chartHeight = height || '100%';

  return (
    <div className="chart-container" style={{ width: '100%', height: '400px', padding: '10px', boxSizing: 'border-box' }}>
      {width && height ? (
        <LineChart width={width} height={height} data={chartData} margin={{ top: 20, right: 20, left: 40, bottom: 20 }}>
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
      ) : (
        <ResponsiveContainer width={chartWidth} height={chartHeight}>
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
      )}
    </div>
  );
}