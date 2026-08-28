"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-10 text-center">
      <pre className="text-destructive text-sm">
        {`error: ${error.message}`}
      </pre>
      <button
        onClick={reset}
        className="text-primary underline underline-offset-4"
      >
        $ cd ~/
      </button>
    </div>
  );
}
