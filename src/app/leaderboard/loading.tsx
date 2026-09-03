import {
  IconBolt,
  IconCalendar,
  IconCalendarMonth,
  IconTrophy,
  IconTrophyFilled,
} from "@tabler/icons-react";
import { LeaderboardSkeleton } from "~/components/leaderboard-skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";

export default function LeaderboardLoading() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-8">
      {/* Header — exact same structure as real leaderboard */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <IconTrophyFilled className="text-primary size-5" />
          leaderboard
        </h1>
        <div className="flex items-center gap-2">
          <Tabs defaultValue="wpm">
            <TabsList>
              <TabsTrigger value="wpm" className="gap-1.5">
                <IconTrophy className="size-3.5" /> wpm
              </TabsTrigger>
              <TabsTrigger value="level" className="gap-1.5">
                <IconBolt className="size-3.5" /> level
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Filters — exact same structure as real leaderboard */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Select defaultValue="time">
            <SelectTrigger size="sm" className="w-24 sm:w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="time">time</SelectItem>
              <SelectItem value="words">words</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="30">
            <SelectTrigger size="sm" aria-label="variant filter" className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15s</SelectItem>
              <SelectItem value="30">30s</SelectItem>
              <SelectItem value="60">60s</SelectItem>
              <SelectItem value="120">120s</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Tabs defaultValue="all" className="w-full sm:w-auto">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="all" className="flex-1 gap-1.5 sm:flex-none">
              <IconCalendarMonth className="size-3.5" />{" "}
              <span className="hidden xs:inline">all time</span>
              <span className="xs:hidden">all</span>
            </TabsTrigger>
            <TabsTrigger value="week" className="flex-1 gap-1.5 sm:flex-none">
              <IconCalendar className="size-3.5" />{" "}
              <span className="hidden xs:inline">this week</span>
              <span className="xs:hidden">week</span>
            </TabsTrigger>
            <TabsTrigger value="today" className="flex-1 gap-1.5 sm:flex-none">
              <IconCalendar className="size-3.5" /> today
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Leaderboard rows — use the shared skeleton component */}
      <LeaderboardSkeleton />
    </div>
  );
}
