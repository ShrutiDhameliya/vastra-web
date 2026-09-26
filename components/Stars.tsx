import { Star } from "lucide-react";

export function Stars({ value }: { value: number }) {
  const rounded = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`size-3.5 ${
            i < rounded ? "fill-amber-400 text-amber-400" : "fill-stone-200 text-stone-200"
          }`}
        />
      ))}
    </span>
  );
}