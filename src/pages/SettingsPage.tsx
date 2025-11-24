import React from "react";
import { Settings, Monitor, Type } from "lucide-react";
import { GameSettings } from "../types";
import { THEMES } from "../constants";

interface SettingsPageProps {
  settings: GameSettings;
  setSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ settings, setSettings }) => {
  return (
    <div className="w-full max-w-5xl flex flex-col gap-10 animate-fade-in-up pb-20">
      <h2 className="text-2xl font-bold mb-4 border-b border-white/10 pb-4 flex items-center gap-3">
        <Settings size={24} /> Settings
      </h2>

      {/* Section: Visuals */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-bold uppercase opacity-50 tracking-widest flex items-center gap-2">
          <Monitor size={16} /> Appearance
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm opacity-70 mb-2 block">Font Family</label>
            <div className="flex gap-2">
              {(["mono", "sans", "serif"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setSettings((s) => ({ ...s, fontFamily: f }))}
                  className={`px-4 py-2 rounded border transition text-sm ${settings.fontFamily === f ? "border-current bg-white/20" : "border-transparent bg-black/25"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm opacity-70 mb-2 block">Font Size</label>
            <div className="flex gap-2">
              {(["sm", "base", "lg", "xl", "2xl"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setSettings((s) => ({ ...s, fontSize: f }))}
                  className={`px-3 py-2 rounded border transition text-sm ${settings.fontSize === f ? "border-current bg-white/20" : "border-transparent bg-black/25"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm opacity-70 mb-2 block">Caret Style</label>
            <div className="flex gap-2">
              {(["line", "block", "underline", "outline"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setSettings((s) => ({ ...s, caretStyle: c }))}
                  className={`px-3 py-2 rounded border transition text-sm ${settings.caretStyle === c ? "border-current bg-white/20" : "border-transparent bg-black/25"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section: Themes */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-bold uppercase opacity-50 tracking-widest flex items-center gap-2">
          <Type size={16} /> Theme
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {THEMES.map((t) => (
            <button
              key={t.name}
              onClick={() => setSettings((s) => ({ ...s, themeId: t.name }))}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all border ${settings.themeId === t.name ? "border-current bg-white/10" : "border-transparent hover:bg-black/25"}`}
            >
              <div
                className="w-6 h-6 rounded-full shadow-sm border border-black/10"
                style={{ backgroundColor: t.main }}
              ></div>
              <span className="text-xs font-medium capitalize truncate">{t.name.replace(/_/g, " ")}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
