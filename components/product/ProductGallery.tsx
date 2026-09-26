"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type GalleryImage = { url: string; alt: string | null };

export function ProductGallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [canHover, setCanHover] = useState(false);
  const zoomBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCanHover(window.matchMedia("(hover: hover)").matches);
  }, []);

  if (images.length === 0) {
    return <div className="aspect-[3/4] rounded-xl bg-stone-100" />;
  }

  const many = images.length > 1;

  function track(e: React.MouseEvent<HTMLDivElement>) {
    const box = zoomBoxRef.current;
    if (!box) return;
    const r = e.currentTarget.getBoundingClientRect();
    box.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
  }

  function step(delta: number) {
    setZoom(false);
    setActive((a) => (a + delta + images.length) % images.length);
  }

  return (
    <div>
      <div
        className={`relative aspect-[3/4] overflow-hidden rounded-xl bg-stone-100 ${canHover ? "cursor-zoom-in" : ""}`}
        onMouseMove={canHover ? track : undefined}
        onMouseEnter={canHover ? () => setZoom(true) : undefined}
        onMouseLeave={canHover ? () => setZoom(false) : undefined}
      >
        <div
          ref={zoomBoxRef}
          className="absolute inset-0 transition-transform duration-200"
          style={zoom ? { transform: "scale(1.9)" } : undefined}
        >
          <Image
            src={images[active].url}
            alt={images[active].alt ?? name}
            fill
            priority={active === 0}
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover"
          />
        </div>

        {many && (
          <>
            <button
              type="button" onClick={() => step(-1)} aria-label="Previous image"
              className="absolute left-3 top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 shadow-sm transition hover:bg-white"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button" onClick={() => step(1)} aria-label="Next image"
              className="absolute right-3 top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 shadow-sm transition hover:bg-white"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
      </div>

      {many && (
        <div className="mt-3 flex gap-2">
          {images.map((image, i) => (
            <button
              key={image.url}
              type="button"
              onClick={() => { setZoom(false); setActive(i); }}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === active}
              className={`relative aspect-[3/4] w-16 overflow-hidden rounded-md border-2 transition ${
                i === active ? "border-ink" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={image.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}