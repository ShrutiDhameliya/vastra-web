export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="border-b border-stone-200 py-8">
        <div className="h-9 w-56 animate-pulse rounded-lg bg-stone-200" />
        <div className="mt-3 h-4 w-28 animate-pulse rounded bg-stone-200" />
      </div>
      <div className="mt-8 grid gap-10 lg:grid-cols-[250px_1fr]">
        <div className="hidden space-y-5 lg:block">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3.5 w-16 animate-pulse rounded bg-stone-200" />
              <div className="h-8 w-full animate-pulse rounded bg-stone-200" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-[3/4] animate-pulse rounded-lg bg-stone-200" />
              <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-stone-200" />
              <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-stone-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}