import { useMemo } from "react";
import type { TestResult } from "~/lib/types";

const CELL = 11;
const GAP = 2;
const MONTHS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function StreakCalendar({ results }: { results: TestResult[] }) {
  const { grid, max, monthLabels, todayKey } = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // count tests per day
    const dayMap = new Map<string, number>();
    for (const r of results) {
      const d = new Date(r.createdAt);
      const key = dateKey(d);
      dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
    }

    // go back 364 days (52 weeks) then shift to nearest Sunday
    const start = new Date(today);
    start.setDate(start.getDate() - 364);
    start.setDate(start.getDate() - start.getDay()); // nearest Sunday

    const todayK = dateKey(today);

    // build grid: 53 columns (weeks) × 7 rows (Sun-Sat)
    const weeks = 53;
    const grid: { key: string; count: number; date: Date }[][] = [];
    let max = 0;
    const monthLabels: { week: number; label: string }[] = [];
    let lastMonth = -1;

    const cursor = new Date(start);
    for (let w = 0; w < weeks; w++) {
      const col: { key: string; count: number; date: Date }[] = [];
      for (let day = 0; day < 7; day++) {
        const key = dateKey(cursor);
        const count = dayMap.get(key) ?? 0;
        if (count > max) max = count;
        col.push({ key, count, date: new Date(cursor) });
        // track month labels on first day of month in the top row (Sun)
        if (day === 0) {
          const m = cursor.getMonth();
          if (m !== lastMonth) {
            monthLabels.push({ week: w, label: MONTHS[m] });
            lastMonth = m;
          }
        }
        cursor.setDate(cursor.getDate() + 1);
      }
      grid.push(col);
    }

    return { grid, max, monthLabels, todayKey: todayK };
  }, [results]);

  const totalTests = results.length;

  const streak = useMemo(() => {
    if (results.length === 0) return 0;
    const days = new Set(results.map((r) => {
      const d = new Date(r.createdAt);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }));
    let s = 0;
    const d = new Date();
    while (true) {
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (days.has(key)) { s++; d.setDate(d.getDate() - 1); } else break;
    }
    return s;
  }, [results]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4 text-xs">
        <span className="text-muted-foreground">
          <span className="text-foreground font-bold tabular-nums">{totalTests}</span> total tests
        </span>
        <span className="text-muted-foreground">
          <span className="text-foreground font-bold tabular-nums">{streak}</span> day streak
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-0">
          {/* month labels */}
          <div className="relative mb-1 h-3">
            {monthLabels.map((m, i) => (
              <span
                key={i}
                className="text-muted-foreground absolute top-0 text-[9px] leading-none"
                style={{ left: m.week * (CELL + GAP) }}
              >
                {m.label}
              </span>
            ))}
          </div>

          <div className="flex gap-0">
            {/* day-of-week labels */}
            <div className="flex flex-col mr-1" style={{ gap: GAP }}>
              {["s", "m", "t", "w", "t", "f", "s"].map((d, i) => (
                <span
                  key={i}
                  className="text-muted-foreground flex items-center text-[9px] leading-none"
                  style={{ height: CELL, width: 10 }}
                >
                  {i % 2 === 1 ? d : ""}
                </span>
              ))}
            </div>

            {/* week columns */}
            {grid.map((week, w) => (
              <div key={w} className="flex flex-col" style={{ gap: GAP }}>
                {week.map((cell) => {
                  const level = cell.count === 0 ? 0 : Math.min(4, Math.ceil((cell.count / Math.max(max, 1)) * 4));
                  const isToday = cell.key === todayKey;
                  return (
                    <div
                      key={cell.key}
                      className={`rounded-[1px] transition-colors ${isToday ? "ring-1 ring-foreground/40" : ""}`}
                      style={{
                        width: CELL,
                        height: CELL,
                        backgroundColor: level === 0
                          ? "var(--secondary)"
                          : `color-mix(in srgb, var(--primary) ${25 + level * 20}%, var(--background))`,
                      }}
                      title={`${cell.date.toLocaleDateString()} — ${cell.count} test${cell.count === 1 ? "" : "s"}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
        less
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className="rounded-[1px]"
            style={{
              width: CELL,
              height: CELL,
              backgroundColor: level === 0
                ? "var(--secondary)"
                : `color-mix(in srgb, var(--primary) ${25 + level * 20}%, var(--background))`,
            }}
          />
        ))}
        more
      </div>
    </div>
  );
}
