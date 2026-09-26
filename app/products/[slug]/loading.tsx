export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="h-4 w-40 animate-pulse rounded bg-stone-200" />
      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-14">
        <div>
          <div className="aspect-[3/4] animate-pulse rounded-xl bg-stone-200" />
          <div className="mt-3 flex gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 w-16 animate-pulse rounded-md bg-stone-200" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-3 w-24 animate-pulse rounded bg-stone-200" />
          <div className="h-8 w-3/4 animate-pulse rounded bg-stone-200" />
          <div className="h-4 w-32 animate-pulse rounded bg-stone-200" />
          <div className="h-8 w-40 animate-pulse rounded bg-stone-200" />
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-9 w-12 animate-pulse rounded-full bg-stone-200" />
            ))}
          </div>
          <div className="h-12 animate-pulse rounded-full bg-stone-200" />
        </div>
      </div>
    </div>
  );
}