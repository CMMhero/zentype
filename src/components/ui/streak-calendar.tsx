"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { IconCheck, IconSnowflake } from "@tabler/icons-react"

import { cn } from "~/lib/utils"

// Types (inlined - only fields used by this component)
interface StreakPeriod {
  periodStart: string
  periodEnd: string
  usedFreeze?: boolean
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

// Helper to check if a date falls within a streak period
function isDateInPeriod(date: Date, period: StreakPeriod): boolean {
  const d = formatDateKey(date)
  return d >= period.periodStart && d <= period.periodEnd
}

// Helper to check if date used a freeze
function didUseFreezeOnDate(date: Date, periods: StreakPeriod[]): boolean {
  for (const period of periods) {
    if (isDateInPeriod(date, period) && period.usedFreeze) {
      return true
    }
  }
  return false
}

// Helper to check if date was active in streak
function wasDateActive(date: Date, periods: StreakPeriod[]): boolean {
  for (const period of periods) {
    if (isDateInPeriod(date, period)) {
      return true
    }
  }
  return false
}

// Get days in month
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

// Get day of week for first day of month (0 = Sunday)
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

// Props
interface StreakCalendarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Streak periods */
  streak: StreakPeriod[]
  /** Tests per day: "YYYY-MM-DD" -> count */
  counts?: Record<string, number>
  /** Year to display for year view: "last12" (last 365 days) or a specific year (e.g. 2025) */
  displayYear?: number | "last12"
  /** Calendar layout variant */
  view?: "week" | "month" | "year"
  /** Month to display (default: current month) */
  month?: Date
  /** Date used for week view (default: today) */
  referenceDate?: Date
  /** Show freeze indicators */
  showFreezes?: boolean
  /** Start of week: 0 = Sunday, 1 = Monday */
  startOfWeek?: 0 | 1
  /** Callback when a day is clicked */
  onDayClick?: (date: Date, wasActive: boolean) => void
  /** Compact mode for year view (smaller cells) */
  compact?: boolean
}

const WEEKDAYS_SUNDAY = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const WEEKDAYS_MONDAY = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]

const TooltipProvider = TooltipPrimitive.Provider
const Tooltip = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "bg-popover text-popover-foreground z-50 overflow-hidden rounded-md border px-3 py-1.5 text-xs shadow-md",
      "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
      "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

function getDateKey(date: Date): string {
  return formatDateKey(date)
}

function getWeekStart(date: Date, startOfWeek: 0 | 1): Date {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  const day = next.getDay()
  const offset = startOfWeek === 1 ? (day + 6) % 7 : day
  next.setDate(next.getDate() - offset)
  return next
}

function getWeekDates(reference: Date, startOfWeek: 0 | 1): Date[] {
  const start = getWeekStart(reference, startOfWeek)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return date
  })
}

function getWeekdayIndex(date: Date, startOfWeek: 0 | 1): number {
  const day = date.getDay()
  return startOfWeek === 1 ? (day + 6) % 7 : day
}

function getGitDates(endDate: Date): Date[] {
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)
  return Array.from({ length: 365 }, (_, index) => {
    const date = new Date(end)
    date.setDate(end.getDate() - (364 - index))
    return date
  })
}

function getYearDates(year: number, today: Date): Date[] {
  const isCurrentYear = year === today.getFullYear()
  const start = new Date(year, 0, 1)
  const end = isCurrentYear ? new Date(today) : new Date(year, 11, 31)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1
  return Array.from({ length: diffDays }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function getGitCells(
  endDate: Date,
  startOfWeek: 0 | 1,
  displayYear?: number | "last12"
): {
  cells: (Date | null)[]
  dates: Date[]
} {
  const todayNorm = new Date(endDate)
  todayNorm.setHours(0, 0, 0, 0)
  const dates =
    typeof displayYear === "number"
      ? getYearDates(displayYear, todayNorm)
      : getGitDates(todayNorm)
  const firstDate = dates[0]
  if (!firstDate) return { cells: [], dates: [] }

  const leadingEmptyCells = getWeekdayIndex(firstDate, startOfWeek)
  const cells: (Date | null)[] = [
    ...Array.from({ length: leadingEmptyCells }, () => null),
    ...dates,
  ]

  return { cells, dates }
}

const StreakCalendar = React.forwardRef<HTMLDivElement, StreakCalendarProps>(
  (
    {
      className,
      streak,
      counts,
      displayYear = "last12",
      view = "week",
      month = new Date(),
      referenceDate = new Date(),
      showFreezes = true,
      startOfWeek = 0,
      onDayClick,
      compact = false,
      ...props
    },
    ref
  ) => {
    const year = month.getFullYear()
    const monthIndex = month.getMonth()
    const daysInMonth = getDaysInMonth(year, monthIndex)
    const firstDayOfMonth = getFirstDayOfMonth(year, monthIndex)

    // Adjust first day based on start of week preference
    const adjustedFirstDay =
      startOfWeek === 1
        ? (firstDayOfMonth + 6) % 7 // Monday start
        : firstDayOfMonth // Sunday start

    const weekdays = startOfWeek === 1 ? WEEKDAYS_MONDAY : WEEKDAYS_SUNDAY
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const periods = streak ?? []
    const countsMap = counts ?? {}
    const weekDates = getWeekDates(referenceDate, startOfWeek)
    const { cells: gitCells, dates: gitDates } = getGitCells(today, startOfWeek, displayYear)
    const gitColumnCount = Math.ceil(gitCells.length / 7)
    const cellSize = compact ? "0.75rem" : "0.75rem"
    const gitGridTemplateColumns = `repeat(${gitColumnCount}, ${cellSize})`
    const cellClass = compact ? "h-[0.75rem] w-[0.75rem] rounded-[0.2rem] border-[0.5px]" : "h-3 w-3 rounded-[0.3rem] border"
    const gitMonthLabels: Array<{ column: number; label: string }> = []
    const seenGitMonths = new Set<string>()

    gitCells.forEach((date, cellIndex) => {
      if (!date) return
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`
      if (!seenGitMonths.has(monthKey) && date.getDate() === 1) {
        seenGitMonths.add(monthKey)
        gitMonthLabels.push({
          column: Math.floor(cellIndex / 7),
          label: date.toLocaleDateString("en-US", { month: "short" }),
        })
      }
    })

    const firstDate = gitDates[0]
    if (firstDate) {
      const firstMonthKey = `${firstDate.getFullYear()}-${firstDate.getMonth()}`
      if (!seenGitMonths.has(firstMonthKey)) {
        gitMonthLabels.unshift({
          column: 0,
          label: firstDate.toLocaleDateString("en-US", { month: "short" }),
        })
      }
    }

    // Limit to 12 months max — drop the first month label if >12
    if (gitMonthLabels.length > 12) {
      gitMonthLabels.shift()
    }

    // Generate calendar days
    const days: (number | null)[] = []

    // Add empty cells for days before the first of the month
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    const monthName = month.toLocaleDateString("en-US", { month: "long" })

    const freezeColorStyles = {
      "--freeze-color": "var(--info)",
      "--freeze-foreground-color": "var(--info-foreground)",
    } as React.CSSProperties

    const getCellState = (date: Date) => {
      const isToday = date.getTime() === today.getTime()
      const isFuture = date > today
      const isActive = wasDateActive(date, periods)
      const usedFreeze = showFreezes && didUseFreezeOnDate(date, periods)
      return { isToday, isFuture, isActive, usedFreeze }
    }

    return (
      <div
        ref={ref}
        role="grid"
        aria-label={`Streak calendar ${view} view`}
        className={cn(
          "w-full",
          view === "month" ? "max-w-sm" : "max-w-3xl",
          className
        )}
        {...props}
      >
        {view === "month" && (
          <>
            <div className="mb-4 text-center">
              <h3 className="text-lg font-semibold" id="streak-calendar-title">
                {monthName} {year}
              </h3>
            </div>
            <div role="row" className="mb-2 grid grid-cols-7 gap-1">
              {weekdays.map((day) => (
                <div
                  key={day}
                  role="columnheader"
                  className="text-muted-foreground text-center text-xs font-medium"
                >
                  {day}
                </div>
              ))}
            </div>
            <div role="rowgroup" className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                if (day === null) {
                  return (
                    <div key={`empty-${index}`} className="aspect-square" />
                  )
                }
                const date = new Date(year, monthIndex, day)
                const { isToday, isFuture, isActive, usedFreeze } =
                  getCellState(date)
                const dateLabel = date.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })
                const statusLabel = usedFreeze
                  ? "freeze used"
                  : isActive
                    ? "streak active"
                    : isFuture
                      ? "future"
                      : "no activity"
                return (
                  <button
                    key={day}
                    type="button"
                    role="gridcell"
                    aria-label={`${dateLabel}${isToday ? ", today" : ""}, ${statusLabel}`}
                    aria-current={isToday ? "date" : undefined}
                    onClick={() => onDayClick?.(date, isActive)}
                    disabled={isFuture}
                    className={cn(
                      "relative flex aspect-square items-center justify-center rounded-lg text-sm transition-colors",
                      "hover:bg-muted focus-visible:ring-ring p-1 focus-visible:ring-2 focus-visible:outline-none",
                      isToday &&
                        "ring-primary !bg-primary-foreground !text-primary ring-2 ring-inset",
                      isFuture && "text-muted-foreground/50 cursor-not-allowed",
                      isActive &&
                        !usedFreeze &&
                        "bg-primary text-primary-foreground hover:bg-primary/90",
                      usedFreeze &&
                        "bg-[var(--freeze-color)] text-[var(--freeze-foreground-color)] hover:opacity-90"
                    )}
                    style={usedFreeze ? freezeColorStyles : undefined}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {view === "week" && (
          <div role="rowgroup" className="grid grid-cols-7 gap-2">
            {weekDates.map((date) => {
              const { isToday, isFuture, isActive, usedFreeze } =
                getCellState(date)
              const dayLabel = date.toLocaleDateString("en-US", {
                weekday: "short",
              })
              return (
                <div
                  key={getDateKey(date)}
                  className="flex flex-col items-center gap-2"
                >
                  <button
                    type="button"
                    role="gridcell"
                    aria-current={isToday ? "date" : undefined}
                    aria-label={`${date.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}, ${usedFreeze ? "freeze used" : isActive ? "streak active" : isFuture ? "future" : "no activity"}`}
                    onClick={() => onDayClick?.(date, isActive)}
                    disabled={isFuture}
                    className={cn(
                      "relative flex h-12 w-12 items-center justify-center rounded-full border border-2 transition-colors",
                      "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                      !isFuture && "hover:opacity-90",
                      isToday && "!bg-primary-foreground !text-primary",
                      isFuture &&
                        "border-border/40 bg-muted/20 text-muted-foreground/40 cursor-not-allowed",
                      isActive &&
                        !usedFreeze &&
                        "border-primary bg-primary text-primary-foreground",
                      usedFreeze &&
                        "border-[var(--freeze-color)] bg-[var(--freeze-color)] text-[var(--freeze-foreground-color)]",
                      !isActive &&
                        !usedFreeze &&
                        !isFuture &&
                        "border-border/60 bg-muted/30"
                    )}
                    style={usedFreeze ? freezeColorStyles : undefined}
                  >
                    {usedFreeze ? (
                      <IconSnowflake
                        className={cn(
                          "h-5 w-5",
                          isToday && "!text-muted-foreground/20"
                        )}
                      />
                    ) : (
                      isActive && (
                        <IconCheck
                          className={cn(
                            "h-5 w-5",
                            isToday && "!text-muted-foreground/20"
                          )}
                        />
                      )
                    )}
                  </button>
                  <span
                    className={cn(
                      "text-sm",
                      isFuture ? "text-muted-foreground/50" : "text-foreground"
                    )}
                  >
                    {dayLabel}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {view === "year" && (
          <>
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full pr-4">
                <div
                  aria-hidden="true"
                  className={cn("mb-2 grid", compact ? "gap-[3px]" : "gap-1")}
                  style={{ gridTemplateColumns: gitGridTemplateColumns }}
                >
                  {gitMonthLabels.map((month) => (
                    <span
                      key={`${month.column}-${month.label}`}
                      className="text-muted-foreground text-xs whitespace-nowrap"
                      style={{ gridColumnStart: month.column + 1 }}
                    >
                      {month.label}
                    </span>
                  ))}
                </div>
                <TooltipProvider>
                  <div
                    role="rowgroup"
                    className={cn("grid grid-flow-col grid-rows-7", compact ? "gap-[3px]" : "gap-1")}
                    style={{ gridTemplateColumns: gitGridTemplateColumns }}
                  >
                    {gitCells.map((date, index) => {
                      if (!date) {
                        return (
                          <div key={`git-empty-${index}`} className={compact ? "h-[0.55rem] w-[0.55rem]" : "h-3 w-3"} />
                        )
                      }
                      const { isToday, isActive, usedFreeze } =
                        getCellState(date)
                      const dateKey = getDateKey(date)
                      const count = countsMap[dateKey] ?? 0
                      const dateLabel = date.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                      const intensityClass =
                        usedFreeze ? "border-[var(--freeze-color)] bg-[var(--freeze-color)]"
                        : count >= 4 ? "bg-primary border-primary"
                        : count >= 2 ? "bg-primary/70 border-primary/70"
                        : count === 1 ? "bg-primary/40 border-primary/40"
                        : isActive ? "bg-primary/30 border-primary/30"
                        : "bg-muted/40"
                      const tooltipText =
                        count === 0 ? `No tests on ${dateLabel}`
                        : count === 1 ? `1 test on ${dateLabel}`
                        : `${count} tests on ${dateLabel}`
                      return (
                        <Tooltip key={dateKey}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              role="gridcell"
                              aria-current={isToday ? "date" : undefined}
                              aria-label={`${tooltipText}, ${usedFreeze ? "freeze used" : isActive ? "streak active" : "no activity"}`}
                              onClick={() => onDayClick?.(date, isActive)}
                              className={cn(
                                "border-border/40 transition-colors",
                                cellClass,
                                "hover:ring-ring hover:ring-1",
                                isToday && "!bg-primary-foreground !text-primary border-primary",
                                !isToday && intensityClass
                              )}
                              style={usedFreeze ? freezeColorStyles : undefined}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            {tooltipText}
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                </TooltipProvider>
                <div
                  className={cn(
                    "text-muted-foreground mt-2 flex items-center justify-start gap-1.5 text-[10px]",
                    compact && "text-[9px]"
                  )}
                  aria-hidden
                >
                  <span className="mr-1">less</span>
                  <span className={cn("border-border/40 rounded-[2px] border", compact ? "size-[0.55rem]" : "size-3", "bg-muted/40")} />
                  <span className={cn("border-border/40 rounded-[2px] border", compact ? "size-[0.55rem]" : "size-3", "bg-primary/40 border-primary/40")} />
                  <span className={cn("border-border/40 rounded-[2px] border", compact ? "size-[0.55rem]" : "size-3", "bg-primary/70 border-primary/70")} />
                  <span className={cn("border-border/40 rounded-[2px] border", compact ? "size-[0.55rem]" : "size-3", "bg-primary border-primary")} />
                  <span className="ml-1">more</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }
)
StreakCalendar.displayName = "StreakCalendar"

export { StreakCalendar }
export type { StreakCalendarProps, StreakPeriod }
