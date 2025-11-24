import React, { useState, useEffect, useMemo } from "react";
import { Keyboard, History, Settings } from "lucide-react";
import { GameSettings, HistoryItem } from "./types";
import { THEMES, STORAGE_KEY_SETTINGS, STORAGE_KEY_HISTORY } from "./constants";
import TestPage from "./pages/TestPage";
import SettingsPage from "./pages/SettingsPage";
import HistoryPage from "./pages/HistoryPage";

const DEFAULT_SETTINGS: GameSettings = {
  mode: "time",
  duration: 30,
  wordCount: 25,
  fontFamily: "mono",
  themeId: "nord",
  caretStyle: "line",
  fontSize: "xl",
  smoothCaret: true,
  hideLiveStats: false,
  blindMode: false,
};

function App() {
  // --- Persisted State ---
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
  }, [history]);

  const [activeTab, setActiveTab] = useState<"test" | "history" | "settings">("test");

  const currentTheme = useMemo(() => THEMES.find((t) => t.name === settings.themeId) || THEMES[0], [settings.themeId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      // If we are already on test, we want to force a remount to reset (managed by key in TestPage or explicit reset?)
      // Currently TestPage resets on mount. So switching away and back works.
      // If we are already on test, React key prop update can force remount.

      if (activeTab === "test") {
        // Force re-render trick or just let TestPage handle self-reset?
        // Actually, standard behavior is Tab -> Restart Test.
        // We can signal this by momentarily switching state or passing a seed.
        // Simplest way: toggle tab to force remount if already on test.
        setActiveTab("settings");
        setTimeout(() => setActiveTab("test"), 0);
      } else {
        setActiveTab("test");
      }
    }
  };

  return (
    <div
      className="min-h-screen min-w-screen flex flex-col items-center transition-colors duration-300 outline-none"
      style={{ backgroundColor: currentTheme.bg, color: currentTheme.text }}
      onKeyDown={handleKeyDown} // Capture Tab globally
      tabIndex={-1}
    >
      <style>{`
        body { font-family: ${settings.fontFamily === "mono" ? '"JetBrains Mono", monospace' : settings.fontFamily === "serif" ? "Merriweather, serif" : "Inter, sans-serif"}; }
        ::selection { background-color: ${currentTheme.main}44; }
      `}</style>

      <div className={`w-full max-w-5xl px-6 py-10 flex flex-col md:flex-row justify-between items-center gap-6 z-20`}>
        <div className="flex-col gap-3 select-none">
          <div className="flex items-center gap-3 select-none">
            <Keyboard size={32} style={{ color: currentTheme.main }} />
            <h1 className="text-3xl font-bold tracking-tight cursor-pointer" onClick={() => setActiveTab("test")}>
              ZenType
            </h1>
          </div>
          <span className="opacity-50 text-sm">Made by CMMhero</span>
        </div>

        <nav className="flex gap-1 bg-black/25 p-1 rounded-xl shadow-md">
          <button
            onClick={() => setActiveTab("test")}
            className={`px-5 py-2 rounded-lg transition-all flex items-center gap-2 ${activeTab === "test" ? "bg-white/20 shadow-sm text-current" : "opacity-50 hover:opacity-100"}`}
          >
            <Keyboard size={18} />{" "}
            <span className="text-sm font-bold uppercase tracking-wider hidden md:inline">Test</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-5 py-2 rounded-lg transition-all flex items-center gap-2 ${activeTab === "history" ? "bg-white/20 shadow-sm text-current" : "opacity-50 hover:opacity-100"}`}
          >
            <History size={18} />{" "}
            <span className="text-sm font-bold uppercase tracking-wider hidden md:inline">History</span>
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-5 py-2 rounded-lg transition-all flex items-center gap-2 ${activeTab === "settings" ? "bg-white/20 shadow-sm text-current" : "opacity-50 hover:opacity-100"}`}
          >
            <Settings size={18} />{" "}
            <span className="text-sm font-bold uppercase tracking-wider hidden md:inline">Settings</span>
          </button>
        </nav>
      </div>

      <div className={`flex-1 flex flex-col w-full max-w-5xl px-6 relative mb-10 items-center`}>
        {activeTab === "test" && (
          <TestPage
            key="test-page" // Ensure it remounts if we need to force reset
            settings={settings}
            setSettings={setSettings}
            setHistory={setHistory}
            theme={currentTheme}
          />
        )}
        {activeTab === "settings" && <SettingsPage settings={settings} setSettings={setSettings} />}
        {activeTab === "history" && <HistoryPage history={history} theme={currentTheme} />}
      </div>

      <div className="w-full px-6 py-6 text-center opacity-40 text-xs font-mono flex flex-col gap-2 mt-auto">
        <div>
          <span className="bg-white/10 px-1.5 py-0.5 rounded border border-white/10 mr-1">TAB</span> to restart
        </div>
      </div>
    </div>
  );
}

export default App;
