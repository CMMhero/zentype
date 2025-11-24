import React from "react";
import { CaretStyle } from "../types";

interface CaretProps {
  style: CaretStyle;
  color: string;
  x: number;
  y: number;
  smooth: boolean;
}

const Caret: React.FC<CaretProps> = ({ style, color, x, y, smooth }) => {
  const transitionClass = smooth ? "transition-all duration-100 ease-out" : "";

  switch (style) {
    case "block":
      return (
        <div
          className={`absolute z-0 opacity-50 ${transitionClass} caret-animate`}
          style={{ backgroundColor: color, left: x, top: y, height: "1.5em", width: "1ch" }}
        ></div>
      );
    case "underline":
      return (
        <div
          className={`absolute z-10 ${transitionClass} caret-animate`}
          style={{ backgroundColor: color, left: x, top: y + 24, height: "3px", width: "1ch" }}
        ></div>
      );
    case "outline":
      return (
        <div
          className={`absolute z-10 border ${transitionClass} caret-animate`}
          style={{ borderColor: color, left: x, top: y - 2, height: "1.5em", width: "1ch", borderRadius: "2px" }}
        ></div>
      );
    case "line":
    default:
      return (
        <div
          className={`absolute z-10 rounded-full ${transitionClass} caret-animate`}
          style={{ backgroundColor: color, left: x - 1, top: y - 2, height: "1.5em", width: "2px" }}
        ></div>
      );
  }
};

export default Caret;
