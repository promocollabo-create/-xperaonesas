"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-xpera flex min-h-[60vh] flex-col items-center justify-center py-10 text-center">
      <p className="text-sm font-semibold text-red-600">Error</p>
      <h1 className="mt-2 text-3xl font-bold">Something went wrong</h1>
      <p className="mt-2 max-w-md text-slate-500">
        An unexpected error occurred. Please try again — if this keeps happening, contact support with the reference
        below.
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-slate-400">Ref: {error.digest}</p>}
      <button onClick={reset} className="btn-primary mt-8">Try Again</button>
    </div>
  );
}
