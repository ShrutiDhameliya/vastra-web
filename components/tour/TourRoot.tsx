"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { selectCartCount, useCartStore } from "@/lib/cart-store";
import { useTourStore } from "@/lib/tour-store";
import { buildTourSteps, type TourContext, type TourStep } from "@/lib/tour-steps";

const GAP = 12;          // tooltip distance from the target
const MARGIN = 12;        // viewport edge clamp
const PAD = 6;            // spotlight padding around the target
const SEEK_TIMEOUT_MS = 5000; // missing-target grace before skipping the step

// useLayoutEffect during SSR logs a warning; this component renders null on
// the server, so gate it — position must land before first paint.
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function TourRoot() {
    const activeTour = useTourStore((s) => s.activeTour);
    const stepIndex = useTourStore((s) => s.stepIndex);
    const next = useTourStore((s) => s.next);
    const back = useTourStore((s) => s.back);
    const stop = useTourStore((s) => s.stop);

    const router = useRouter();
    const pathname = usePathname();

    const { data: session, isPending } = authClient.useSession();
    const cartCount = useCartStore(selectCartCount);
    const [isMobile, setIsMobile] = useState(false);

    const [plan, setPlan] = useState<TourStep[] | null>(null); // steps filtered once, at start
    const [target, setTarget] = useState<HTMLElement | null>(null);
    const [waiting, setWaiting] = useState(false);
    const [sessionTimedOut, setSessionTimedOut] = useState(false);

    const prevFocus = useRef<HTMLElement | null>(null);
    const holeRef = useRef<SVGRectElement | null>(null);
    const ringRef = useRef<SVGRectElement | null>(null);
    const tipRef = useRef<HTMLDivElement | null>(null);

    const step = plan && stepIndex < plan.length ? plan[stepIndex] : null;
    const isLast = plan != null && stepIndex === plan.length - 1;

    /* ── responsive: mobile = bottom-docked tooltip ── */
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 639px)");
        const update = () => setIsMobile(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    /* ── a slow session query must never block the tour from starting ── */
    useEffect(() => {
        if (!isPending) {
            setSessionTimedOut(false);
            return;
        }
        const t = window.setTimeout(() => setSessionTimedOut(true), 2000);
        return () => window.clearTimeout(t);
    }, [isPending]);

    /* ── open/close: snapshot focus, reset state ── */
    useEffect(() => {
        if (activeTour) {
            prevFocus.current = document.activeElement as HTMLElement | null;
        } else {
            setPlan(null);
            setTarget(null);
            setWaiting(false);
            if (prevFocus.current?.isConnected) prevFocus.current.focus({ preventScroll: true });
            prevFocus.current = null;
        }
    }, [activeTour]);

    /* ── build the plan once per tour from a context snapshot (waits for the
          session so guest/account/admin steps filter correctly) ── */
    useEffect(() => {
        if (!activeTour || plan) return;
        if (isPending && !sessionTimedOut) return;
        const ctx: TourContext = {
            isLoggedIn: !!session?.user,
            // role is an additionalField — cast because authClient's inferred type is loose
            isAdmin: (session?.user as { role?: string } | undefined)?.role === "ADMIN",
            cartCount,
            isMobile,
        };
        setPlan(buildTourSteps(activeTour, ctx));
    }, [activeTour, isPending, sessionTimedOut, plan, session, cartCount, isMobile]);

    /* ── ran past the last step (auto-skips) → finish cleanly ── */
    useEffect(() => {
        if (plan && stepIndex >= plan.length) stop(true);
    }, [plan, stepIndex, stop]);

    /* ── resolve the target: navigate if needed, poll, skip if unreachable ── */
    /* ── resolve the target: navigate if needed, poll, skip if unreachable ── */
    useEffect(() => {
        if (!step) return;
        let cancelled = false;
        let pollTimer = 0;
        let skipTimer = 0;

        // Navigate first — for centered steps too (welcome/admin-welcome).
        // The effect re-runs when pathname updates; the timer below only fires
        // if navigation never lands (guarded route, redirect loop).
        if (step.path && pathname !== step.path) {
            setWaiting(true);
            setTarget(null);
            router.push(step.path);
            skipTimer = window.setTimeout(() => {
                if (!cancelled) next(); // graceful skip, never a wedged pill
            }, SEEK_TIMEOUT_MS);
            return () => {
                cancelled = true;
                window.clearTimeout(skipTimer);
            };
        }

        if (!step.selector) {
            setTarget(null);
            setWaiting(false);
            return;
        }

        const attach = (el: HTMLElement) => {
            const r = el.getBoundingClientRect();
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            el.scrollIntoView({
                block: r.height > window.innerHeight * 0.6 ? "nearest" : "center",
                behavior: reduced ? "auto" : "smooth",
            });
            setTarget(el);
            setWaiting(false);
        };

        let found = false;
        const seek = () => {
            if (cancelled) return;
            const el = document.querySelector<HTMLElement>(step.selector!);
            if (el) {
                found = true;
                attach(el);
                return;
            }
            setWaiting(true);
            pollTimer = window.setTimeout(seek, 120);
        };
        seek();

        skipTimer = window.setTimeout(() => {
            if (!cancelled && !found) next();
        }, SEEK_TIMEOUT_MS);

        return () => {
            cancelled = true;
            window.clearTimeout(pollTimer);
            window.clearTimeout(skipTimer);
        };
    }, [step, pathname, router, next]);
    //   useEffect(() => {
    //     if (!step) return;
    //     let cancelled = false;
    //     let pollTimer = 0;

    //     if (!step.selector) {
    //       setTarget(null); // centered step — nothing to find
    //       setWaiting(false);
    //       return;
    //     }

    //     const attach = (el: HTMLElement) => {
    //       const r = el.getBoundingClientRect();
    //       const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    //       el.scrollIntoView({
    //         block: r.height > window.innerHeight * 0.6 ? "nearest" : "center",
    //         behavior: reduced ? "auto" : "smooth",
    //       });
    //       setTarget(el);
    //       setWaiting(false);
    //     };

    //     if (step.path && pathname !== step.path) {
    //       setWaiting(true);
    //       setTarget(null);
    //       router.push(step.path); // this effect re-runs when the pathname updates
    //       return;
    //     }

    //     let found = false;
    //     const seek = () => {
    //       if (cancelled) return;
    //       const el = document.querySelector<HTMLElement>(step.selector!);
    //       if (el) {
    //         found = true;
    //         attach(el);
    //         return;
    //       }
    //       setWaiting(true);
    //       pollTimer = window.setTimeout(seek, 120);
    //     };
    //     seek();

    //     // Requirement: a missing element must never break the tour — skip forward.
    //     const skipTimer = window.setTimeout(() => {
    //       if (!cancelled && !found) next();
    //     }, SEEK_TIMEOUT_MS);

    //     return () => {
    //       cancelled = true;
    //       window.clearTimeout(pollTimer);
    //       window.clearTimeout(skipTimer);
    //     };
    //   }, [step, pathname, router, next]);

    /* ── positioning loop: runs every frame while a step is showing, so scroll,
          resize, smooth-scroll and layout shifts (images loading) all track ── */
    useIsoLayoutEffect(() => {
        if (!step || waiting) return;
        let raf = 0;

        const place = () => {
            const tip = tipRef.current;
            if (tip) {
                tip.style.visibility = "visible";

                if (target) {
                    const r = target.getBoundingClientRect();
                    const x = Math.round(r.left - PAD);
                    const y = Math.round(r.top - PAD);
                    const w = Math.round(r.width + PAD * 2);
                    const h = Math.round(r.height + PAD * 2);
                    for (const rect of [holeRef.current, ringRef.current]) {
                        if (!rect) continue;
                        rect.setAttribute("x", String(x));
                        rect.setAttribute("y", String(y));
                        rect.setAttribute("width", String(w));
                        rect.setAttribute("height", String(h));
                    }

                    if (isMobile) {
                        // bottom-docked sheet — can never be clipped
                        tip.style.left = `${MARGIN}px`;
                        tip.style.right = `${MARGIN}px`;
                        tip.style.top = "auto";
                        tip.style.bottom = `${MARGIN}px`;
                        tip.style.transform = "none";
                    } else {
                        const tw = tip.offsetWidth;
                        const th = tip.offsetHeight;
                        const vw = window.innerWidth;
                        const vh = window.innerHeight;
                        const fitsBelow = r.bottom + GAP + th <= vh - MARGIN;
                        const fitsAbove = r.top - GAP - th >= MARGIN;
                        const top = fitsBelow
                            ? r.bottom + GAP
                            : fitsAbove
                                ? r.top - GAP - th
                                : Math.min(Math.max(MARGIN, r.bottom + GAP), Math.max(MARGIN, vh - th - MARGIN));
                        const left = Math.min(Math.max(MARGIN, r.left), Math.max(MARGIN, vw - tw - MARGIN));
                        tip.style.top = `${Math.round(top)}px`;
                        tip.style.left = `${Math.round(left)}px`;
                        tip.style.right = "auto";
                        tip.style.bottom = "auto";
                        tip.style.transform = "none";
                    }
                } else {
                    // centered step — hide the spotlight, center the tooltip
                    for (const rect of [holeRef.current, ringRef.current]) {
                        if (!rect) continue;
                        rect.setAttribute("x", "-100");
                        rect.setAttribute("y", "-100");
                        rect.setAttribute("width", "0");
                        rect.setAttribute("height", "0");
                    }
                    tip.style.left = "50%";
                    tip.style.top = "50%";
                    tip.style.right = "auto";
                    tip.style.bottom = "auto";
                    tip.style.transform = "translate(-50%, -50%)";
                }
            }
            raf = requestAnimationFrame(place);
        };
        raf = requestAnimationFrame(place);
        return () => cancelAnimationFrame(raf);
    }, [step, waiting, target, isMobile]);

    /* ── focus the primary action on every step ── */
    useEffect(() => {
        if (!step || waiting) return;
        tipRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus({ preventScroll: true });
    }, [step, waiting, target]);

    /* ── keyboard: Escape closes, arrows navigate, Tab stays inside the tooltip ── */
    const handleNext = useCallback(() => (isLast ? stop(true) : next()), [isLast, next, stop]);
    const handleBack = useCallback(() => back(), [back]);

    useEffect(() => {
        if (!step) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                stop();
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                handleNext();
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                handleBack();
            } else if (e.key === "Tab") {
                const buttons = tipRef.current?.querySelectorAll<HTMLElement>("button");
                if (!buttons || buttons.length === 0) return;
                const first = buttons[0];
                const last = buttons[buttons.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [step, handleNext, handleBack, stop]);

    /* ── inert page chrome while touring — screen readers follow the dialog,
          and the page can't receive stray focus ── */
    useEffect(() => {
        if (!step) return;
        const chrome = [
            document.querySelector("header"),
            document.getElementById("main"),
            document.querySelector("footer"),
        ].filter((el): el is HTMLElement => el !== null);
        chrome.forEach((el) => el.setAttribute("inert", ""));
        return () => chrome.forEach((el) => el.removeAttribute("inert"));
    }, [step]);

    if (!plan || !step) return null;

    return (
        <>
            {/* Overlay: blocks pointer interaction everywhere; page scroll stays
          available (fixed overlays don't stop wheel/touch chaining). */}
            <div className="fixed inset-0 z-[90]" aria-hidden="true">
                <svg className="h-full w-full">
                    <defs>
                        <mask id="vastra-tour-mask">
                            <rect width="100%" height="100%" fill="white" />
                            <rect ref={holeRef} fill="black" rx="10" />
                        </mask>
                    </defs>
                    <rect width="100%" height="100%" fill="rgba(28,25,23,0.55)" mask="url(#vastra-tour-mask)" />
                    <rect ref={ringRef} fill="none" stroke="#1c1917" strokeWidth="2" rx="10" />
                </svg>
            </div>

            {waiting ? (
                <div
                    role="status"
                    className="fixed left-1/2 top-1/2 z-[95] -translate-x-1/2 -translate-y-1/2 rounded-full border border-stone-200 bg-paper px-5 py-2.5 text-sm text-stone-600 shadow-xl"
                >
                    On its way…
                </div>
            ) : (
                <div
                    ref={tipRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="vastra-tour-title"
                    style={{ visibility: "hidden", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
                    className="fixed z-[95] w-[min(20rem,calc(100vw-1.5rem))] rounded-xl border border-stone-200 bg-paper p-5 shadow-2xl"
                >
                    <div className="absolute inset-x-0 top-0 h-1 overflow-hidden rounded-t-xl bg-stone-200">
                        <div
                            className="h-full bg-ink transition-[width] duration-300"
                            style={{ width: `${((stepIndex + 1) / plan.length) * 100}%` }}
                        />
                    </div>

                    <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                        Step {stepIndex + 1} of {plan.length}
                    </p>
                    <h2 id="vastra-tour-title" className="mt-1 font-display text-lg font-semibold leading-snug">
                        {step.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-stone-600">{step.body}</p>

                    <div className="mt-5 flex items-center gap-2">
                        {stepIndex > 0 && (
                            <button
                                type="button"
                                onClick={handleBack}
                                className="inline-flex items-center gap-1 rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-ink"
                            >
                                <ArrowLeft className="size-3.5" /> Back
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => stop()}
                            className="ml-auto rounded-full px-3 py-2 text-sm font-medium text-stone-500 transition hover:text-ink"
                        >
                            Skip tour
                        </button>
                        <button
                            type="button"
                            data-autofocus
                            onClick={handleNext}
                            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper transition hover:bg-stone-800"
                        >
                            {isLast ? "Finish" : "Next"}
                            {!isLast && <ArrowRight className="size-3.5" />}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}