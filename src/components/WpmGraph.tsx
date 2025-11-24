import React from "react";
import { Theme } from "../types";

interface WpmGraphProps {
  data: { time: number; wpm: number; raw: number }[];
  theme: Theme;
}

const WpmGraph: React.FC<WpmGraphProps> = ({ data, theme }) => {
  if (!data || data.length < 2) return null;

  const width = 800;
  const height = 250;
  const padding = 40;

  // Calculate Max based on Raw WPM to avoid clipping
  const maxVal = Math.max(...data.map((d) => d.raw), 10);
  const maxGraph = Math.ceil(maxVal / 10) * 10; // Round up to nearest 10

  const minTime = data[0].time;
  const totalTime = data[data.length - 1].time;

  const getX = (t: number) => ((t - minTime) / (totalTime - minTime || 1)) * (width - padding * 2) + padding;
  const getY = (w: number) => height - padding - (w / maxGraph) * (height - padding * 2);

  const pointsWpm = data.map((d) => `${getX(d.time)},${getY(d.wpm)}`).join(" ");
  const pointsRaw = data.map((d) => `${getX(d.time)},${getY(d.raw)}`).join(" ");

  return (
    <div className="w-full overflow-hidden rounded-xl bg-black/25 p-6 mb-8 relative shadow-inner">
      <div className="absolute top-4 left-6 text-xs font-bold opacity-50 tracking-widest">WPM</div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        {/* Grid Lines (Y-Axis) */}
        {[0, 0.25, 0.5, 0.75, 1].map((p) => {
          const y = height - padding - p * (height - padding * 2);
          const val = Math.round(p * maxGraph);
          return (
            <g key={p}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke={theme.sub}
                strokeOpacity={0.1}
                strokeDasharray="4 4"
              />
              <text x={padding - 10} y={y + 4} fill={theme.sub} opacity={0.5} fontSize="10" textAnchor="end">
                {val}
              </text>
            </g>
          );
        })}

        {/* X-Axis Labels */}
        <text x={padding} y={height - 10} fill={theme.sub} opacity={0.5} fontSize="10" textAnchor="middle">
          0s
        </text>
        <text x={width - padding} y={height - 10} fill={theme.sub} opacity={0.5} fontSize="10" textAnchor="middle">
          {Math.round(totalTime)}s
        </text>

        {/* Raw WPM Line */}
        <polyline
          points={pointsRaw}
          fill="none"
          stroke={theme.sub}
          strokeWidth="2"
          strokeOpacity="0.4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Net WPM Line */}
        <polyline
          points={pointsWpm}
          fill="none"
          stroke={theme.main}
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Legend */}
        <g transform={`translate(${width - padding - 100}, ${padding})`}>
          <rect x="0" y="0" width="10" height="10" fill={theme.sub} fillOpacity="0.4" />
          <text x="15" y="9" fontSize="10" fill={theme.sub}>
            Raw
          </text>
          <rect x="50" y="0" width="10" height="10" fill={theme.main} />
          <text x="65" y="9" fontSize="10" fill={theme.sub}>
            Net
          </text>
        </g>
      </svg>
    </div>
  );
};

export default WpmGraph;
