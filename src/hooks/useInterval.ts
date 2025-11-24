import { useEffect, useRef, useLayoutEffect } from "react";

export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);
  useLayoutEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}
