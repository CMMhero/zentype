"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconCloudOff, IconHistory } from "@tabler/icons-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "~/components/ui/dialog";
import { WpmChart } from "~/components/charts/wpm-chart";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "~/components/ui/table";
import { getUserResults } from "~/server/results";
import { useResultsStore } from "~/stores/results-store";
import { useUser } from "~/components/user-provider";
import { modeLabel, type TestResult } from "~/lib/types";
import { formatDateTime } from "~/lib/utils";

export default function HistoryPage() {
  const user = useUser();
  const local = useResultsStore((s) => s.local);
  const [server, setServer] = useState<TestResult[] | null>(null);
  const [selected, setSelected] = useState<TestResult | null>(null);

  const results = (user ? server : null) ?? local;

  useEffect(() => {
    if (!user || server) return;
    let cancelled = false;
    void getUserResults({ limit: 200 }).then((r) => {
      if (!cancelled) setServer(r);
    });
    return () => { cancelled = true; };
  }, [user, server]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <IconHistory className="text-primary size-5" />
          history
          <span className="text-muted-foreground text-xs">/ {results.length} test{results.length === 1 ? "" : "s"}</span>
        </h1>
        {!user && (
          <Badge variant="secondary" className="gap-1.5 text-[10px]">
            <IconCloudOff className="size-3" /> guest — stored locally
          </Badge>
        )}
      </header>

      {!user && local.length === 0 ? (
        <EmptyState />
      ) : user && !server ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-muted h-11 animate-pulse rounded" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="border-border/60 overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>date</TableHead>
                <TableHead className="text-right">wpm</TableHead>
                <TableHead className="text-right">raw</TableHead>
                <TableHead className="text-right">accuracy</TableHead>
                <TableHead className="hidden text-right sm:table-cell">consistency</TableHead>
                <TableHead className="hidden text-right md:table-cell">mode</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((r) => (
                <TableRow key={r.id} onClick={() => setSelected(r)} className="cursor-pointer">
                  <TableCell className="text-muted-foreground text-xs">{formatDateTime(r.createdAt)}</TableCell>
                  <TableCell className="text-primary text-right font-bold tabular-nums">{r.wpm}</TableCell>
                  <TableCell className="text-muted-foreground text-right tabular-nums">{r.rawWpm}</TableCell>
                  <AccCell value={r.accuracy} />
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">{r.consistency}%</TableCell>
                  <TableCell className="text-muted-foreground hidden text-right text-xs md:table-cell">
                    {modeLabel(r)} · {r.source}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-baseline gap-4">
                  <span className="text-primary text-5xl font-bold tabular-nums">{selected.wpm}</span>
                  <span className="text-muted-foreground text-sm font-normal">wpm</span>
                  <span className="ml-auto text-lg tabular-nums">{selected.accuracy}%</span>
                  <span className="text-muted-foreground text-sm font-normal">accuracy</span>
                </DialogTitle>
                <DialogDescription>
                  {modeLabel(selected)} · {selected.source} · {new Date(selected.createdAt).toLocaleString()}
                </DialogDescription>
              </DialogHeader>
              <WpmChart timeline={selected.timeline} />
              <div className="grid grid-cols-3 gap-3 text-center sm:grid-cols-6">
                <Mini label="raw" value={String(selected.rawWpm)} />
                <Mini label="cons" value={`${selected.consistency}%`} />
                <Mini label="correct" value={String(selected.chars.correct)} />
                <Mini label="errors" value={String(selected.chars.incorrect)} />
                <Mini label="extra" value={String(selected.chars.extra)} />
                <Mini label="missed" value={String(selected.chars.missed)} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AccCell({ value }: { value: number }) {
  const tone = value >= 97 ? "text-chart-3" : value >= 90 ? "text-foreground" : "text-destructive";
  return <TableCell className={`text-right tabular-nums ${tone}`}>{value}%</TableCell>;
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary/40 rounded p-2">
      <div className="font-semibold tabular-nums">{value}</div>
      <div className="text-muted-foreground text-[10px] tracking-wider uppercase">{label}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border-border/60 flex flex-col items-center gap-3 rounded-md border border-dashed py-16 text-center">
      <IconHistory className="text-muted-foreground size-8" />
      <p className="text-muted-foreground text-sm">no tests recorded yet</p>
      <Button asChild size="sm">
        <Link href="/">start typing →</Link>
      </Button>
    </div>
  );
}
