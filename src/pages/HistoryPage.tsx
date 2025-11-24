import React, { useState } from "react";
import { History, X } from "lucide-react";
import { HistoryItem, Theme } from "../types";
import WpmGraph from "../components/WpmGraph";

interface HistoryPageProps {
  history: HistoryItem[];
  theme: Theme;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ history, theme }) => {
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const bestWpm = Math.max(...history.map((h) => h.wpm), 0);
  const avgWpm = history.length > 0 ? Math.round(history.reduce((acc, h) => acc + h.wpm, 0) / history.length) : 0;
  const totalTests = history.length;

  return (
    <div className="w-full max-w-5xl flex flex-col gap-8 animate-fade-in-up pb-20 relative">
      <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <History size={24} /> History
        </h2>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="p-6 rounded-xl bg-black/25 flex flex-col items-center justify-center relative overflow-hidden group shadow-lg">
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
            style={{ backgroundColor: theme.main }}
          ></div>
          <span className="text-4xl font-bold">{totalTests}</span>
          <span className="text-xs uppercase opacity-50 mt-2 font-bold tracking-wider">Total Tests</span>
        </div>
        <div className="p-6 rounded-xl bg-black/25 flex flex-col items-center justify-center relative overflow-hidden group shadow-lg">
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
            style={{ backgroundColor: theme.main }}
          ></div>
          <span className="text-4xl font-bold" style={{ color: theme.main }}>
            {bestWpm}
          </span>
          <span className="text-xs uppercase opacity-50 mt-2 font-bold tracking-wider">Best WPM</span>
        </div>
        <div className="p-6 rounded-xl bg-black/25 flex flex-col items-center justify-center relative overflow-hidden group shadow-lg">
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
            style={{ backgroundColor: theme.main }}
          ></div>
          <span className="text-4xl font-bold">{avgWpm}</span>
          <span className="text-xs uppercase opacity-50 mt-2 font-bold tracking-wider">Average WPM</span>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-20 opacity-30 flex flex-col items-center gap-4">
          <History size={48} />
          <div>No tests taken yet. Go type something!</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          <div className="grid grid-cols-12 text-xs uppercase opacity-40 px-4 pb-2 font-bold tracking-wider">
            <div className="col-span-2">Date</div>
            <div className="col-span-2 text-right">WPM</div>
            <div className="col-span-2 text-right">Raw</div>
            <div className="col-span-4 text-center">Accuracy</div>
            <div className="col-span-2 text-right">Mode</div>
          </div>
          {history.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="grid grid-cols-12 items-center p-4 rounded-lg bg-black/25 hover:bg-black/40 transition border-l-4 shadow-sm cursor-pointer active:scale-[0.99]"
              style={{ borderLeftColor: theme.main }}
            >
              <div className="col-span-2 text-xs opacity-60 font-mono">
                {new Date(item.date).toLocaleDateString()}
                <div className="text-[10px] opacity-50">
                  {new Date(item.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              <div className="col-span-2 text-right font-bold text-xl">{item.wpm}</div>
              <div className="col-span-2 text-right opacity-50 font-mono">{item.raw}</div>
              <div className="col-span-4 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.accuracy}%`, backgroundColor: theme.main }}
                    ></div>
                  </div>
                  <div className="text-xs w-8 text-right">{item.accuracy}%</div>
                </div>
              </div>
              <div className="col-span-2 text-right text-xs opacity-60 font-bold">
                {item.mode} {item.info}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Overlay */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto no-scrollbar border border-white/10 relative flex flex-col"
            style={{ backgroundColor: theme.bg, color: theme.text }}
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition z-50"
            >
              <X size={24} />
            </button>

            <div className="p-8 flex flex-col items-center gap-8">
              <div className="grid grid-cols-2 gap-8 md:gap-16 w-full">
                <div className="flex flex-col items-center">
                  <div className="text-sm font-bold tracking-widest opacity-50 mb-2">WPM</div>
                  <div className="text-8xl font-bold leading-none" style={{ color: theme.main }}>
                    {selectedItem.wpm}
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-sm font-bold tracking-widest opacity-50 mb-2">ACCURACY</div>
                  <div className="text-8xl font-bold leading-none" style={{ color: theme.main }}>
                    {selectedItem.accuracy}%
                  </div>
                </div>
              </div>

              {/* Graph */}
              <WpmGraph data={selectedItem.timeline} theme={theme} />

              {/* Detailed Stats Grid */}
              <div className="flex flex-wrap gap-8 text-center p-8 rounded-3xl bg-black/25 w-full justify-center shadow-lg">
                <div className="flex flex-col gap-1">
                  <span className="text-3xl font-bold" style={{ color: theme.text }}>
                    {selectedItem.raw}
                  </span>
                  <span className="text-xs uppercase opacity-50 font-bold tracking-wide">Raw WPM</span>
                </div>
                <div className="w-px bg-current opacity-10"></div>
                <div className="flex flex-col gap-1">
                  <span className="text-3xl font-bold" style={{ color: theme.text }}>
                    {selectedItem.consistency || 0}%
                  </span>
                  <span className="text-xs uppercase opacity-50 font-bold tracking-wide">Consistency</span>
                </div>
                <div className="w-px bg-current opacity-10"></div>
                <div className="flex flex-col gap-1">
                  <span className="text-3xl font-bold" style={{ color: theme.main }}>
                    {selectedItem.correctChars}
                  </span>
                  <span className="text-xs uppercase opacity-50 font-bold tracking-wide">Correct</span>
                </div>
                <div className="w-px bg-current opacity-10"></div>
                <div className="flex flex-col gap-1">
                  <span className="text-3xl font-bold" style={{ color: theme.error }}>
                    {selectedItem.incorrectChars}
                  </span>
                  <span className="text-xs uppercase opacity-50 font-bold tracking-wide">Incorrect</span>
                </div>
                <div className="w-px bg-current opacity-10"></div>
                <div className="flex flex-col gap-1">
                  <span className="text-3xl font-bold opacity-50">{selectedItem.extraChars}</span>
                  <span className="text-xs uppercase opacity-50 font-bold tracking-wide">Extra</span>
                </div>
                <div className="w-px bg-current opacity-10"></div>
                <div className="flex flex-col gap-1">
                  <span className="text-3xl font-bold opacity-50 font-mono text-sm mt-2">
                    {selectedItem.mode} {selectedItem.info}
                  </span>
                  <span className="text-xs uppercase opacity-50 font-bold tracking-wide">Mode</span>
                </div>
              </div>

              <div className="text-xs opacity-30 font-mono">
                Test taken on {new Date(selectedItem.date).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
