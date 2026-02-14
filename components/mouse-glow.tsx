"use client";

import { useEffect } from "react";

const GLOW_SELECTOR = [
  ".brand-bubble",
  ".topnav a",
  ".cta-button",
  ".hero-copy",
  ".hero-sticker",
  ".panel",
  ".post-card",
  ".mood-chip",
  ".reaction-button",
].join(", " );

function clearGlow(target: HTMLElement | null): void {
  if (!target) return;
  target.style.removeProperty("--glow-x");
  target.style.removeProperty("--glow-y");
  target.style.removeProperty("--glow-opacity");
}

export function MouseGlow() {
  useEffect(() => {
    let active: HTMLElement | null = null;

    const onPointerMove = (event: PointerEvent): void => {
      const rawTarget = event.target as HTMLElement | null;
      const next = rawTarget?.closest(GLOW_SELECTOR) as HTMLElement | null;

      if (next !== active) {
        clearGlow(active);
        active = next;
      }

      if (!next) return;

      const rect = next.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      next.style.setProperty("--glow-x", `${x}px`);
      next.style.setProperty("--glow-y", `${y}px`);
      next.style.setProperty("--glow-opacity", "0.9");
    };

    const onLeave = (): void => {
      clearGlow(active);
      active = null;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      clearGlow(active);
    };
  }, []);

  return null;
}
