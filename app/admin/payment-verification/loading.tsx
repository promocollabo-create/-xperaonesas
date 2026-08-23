export default function Loading() {
  return (
    <div className="container-xpera py-10">
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl2 border border-slate-100 bg-white p-3 shadow-soft">
            <div className="aspect-[4/3] rounded-lg bg-slate-100" />
            <div className="mt-3 h-3 w-3/4 rounded bg-slate-100" />
            <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
