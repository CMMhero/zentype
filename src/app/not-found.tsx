import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-10 text-center font-mono">
      <pre className="text-primary text-2xl">404</pre>
      <p className="text-muted-foreground text-sm">
        command not found — try <span className="text-foreground">$ cd /</span>
      </p>
      <Link
        href="/"
        className="mt-2 border border-border px-3 py-1.5 text-sm hover:bg-muted"
      >
        go home
      </Link>
    </div>
  );
}
