import React from "react";
import { KEYBOARD_ROWS } from "../constants";
import { Theme } from "../types";

interface VirtualKeyboardProps {
  activeKey: string | null;
  theme: Theme;
}

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ activeKey, theme }) => {
  return (
    <div className="mt-auto pt-12 w-full flex flex-col items-center gap-2 select-none opacity-100 transition-opacity duration-500">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1.5 md:gap-2">
          {row.map((key) => {
            const isActive = activeKey === key;
            return (
              <div
                key={key}
                className={`flex items-center justify-center rounded w-8 h-8 md:w-10 md:h-10 text-xs md:text-sm font-bold uppercase transition-all duration-75 ${isActive ? "transform scale-95" : ""}`}
                style={{
                  backgroundColor: isActive ? theme.text : theme.sub + "33",
                  color: isActive ? theme.bg : theme.sub,
                  boxShadow: isActive ? `0 0 10px ${theme.main}` : "none",
                }}
              >
                {key}
              </div>
            );
          })}
        </div>
      ))}
      <div className="mt-auto">
        <div
          className={`h-8 md:h-10 w-64 rounded transition-all duration-75 ${activeKey === " " ? "scale-95" : ""}`}
          style={{
            backgroundColor: activeKey === " " ? theme.text : theme.sub + "33",
            boxShadow: activeKey === " " ? `0 0 10px ${theme.main}` : "none",
          }}
        ></div>
      </div>
    </div>
  );
};

export default VirtualKeyboard;
