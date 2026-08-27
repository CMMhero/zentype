import { Skeleton } from "~/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "~/components/ui/table";

export function LeaderboardSkeleton() {
  return (
    <div className="border-border/60 overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-14">#</TableHead>
            <TableHead>typist</TableHead>
            <TableHead className="text-right">wpm</TableHead>
            <TableHead className="text-right">accuracy</TableHead>
            <TableHead className="hidden text-right sm:table-cell">consistency</TableHead>
            <TableHead className="hidden text-right md:table-cell">date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 8 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-5 w-6" /></TableCell>
              <TableCell><Skeleton className="h-5 w-32" /></TableCell>
              <TableCell className="text-right"><Skeleton className="ml-auto h-5 w-10" /></TableCell>
              <TableCell className="text-right"><Skeleton className="ml-auto h-5 w-12" /></TableCell>
              <TableCell className="hidden text-right sm:table-cell"><Skeleton className="ml-auto h-5 w-12" /></TableCell>
              <TableCell className="hidden text-right md:table-cell"><Skeleton className="ml-auto h-5 w-20" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
