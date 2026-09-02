/* PRESS BENCH / REACT BITS DEPTH CAROUSEL: manual asset browser backed only by persisted STUDIO source and post URLs. */
"use client";

import { useEffect, useId, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

export type AssetDepthItem = { id: string; url: string; label: string; kind: string };

function relativeOffset(index: number, active: number, total: number) {
  let offset = index - active;
  if (offset > total / 2) offset -= total;
  if (offset < -total / 2) offset += total;
  return offset;
}

export function AssetDepthCarousel({ items }: { items: AssetDepthItem[] }) {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const labelId = useId();
  const total = items.length;

  useEffect(() => setActive((index) => Math.min(index, Math.max(0, total - 1))), [total]);
  if (total < 2) return null;

  const move = (direction: -1 | 1) => setActive((index) => (index + direction + total) % total);

  return (
    <section className="studio-asset-depth" aria-labelledby={labelId}>
      <header className="studio-asset-depth__header"><div><span className="studio-kicker">ASSET DEPTH</span><h3 id={labelId}>Browse source angles</h3></div><span>{active + 1} / {total}</span></header>
      <div className="studio-asset-depth__stage" role="region" aria-label="Asset depth carousel" tabIndex={0} onKeyDown={(event) => { if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); } if (event.key === "ArrowRight") { event.preventDefault(); move(1); } }}>
        {items.map((item, index) => {
          const offset = relativeOffset(index, active, total);
          const distance = Math.abs(offset);
          const visible = distance <= 2;
          const current = offset === 0;
          return <motion.button type="button" key={item.id} className="studio-asset-depth__card" aria-current={current ? "true" : undefined} aria-label={`${current ? "Current asset" : "View asset"}: ${item.label}`} onClick={() => setActive(index)} initial={false} animate={{ x: reduceMotion ? 0 : offset * 72, y: reduceMotion ? 0 : distance * 10, rotateY: reduceMotion ? 0 : offset * -10, rotateZ: reduceMotion ? 0 : offset * 3, scale: 1 - distance * 0.085, opacity: visible ? 1 - distance * 0.28 : 0, zIndex: 10 - distance }} transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 26 }} style={{ pointerEvents: visible ? "auto" : "none" }}><img src={item.url} alt="" draggable={false} /><span>{item.kind}</span></motion.button>;
        })}
      </div>
      <footer className="studio-asset-depth__footer"><div><strong>{items[active]?.label}</strong><small>{items[active]?.kind}</small></div><div role="group" aria-label="Asset carousel controls"><button type="button" onClick={() => move(-1)} aria-label="Previous asset"><ChevronLeft size={16} /></button><button type="button" onClick={() => move(1)} aria-label="Next asset"><ChevronRight size={16} /></button></div></footer>
    </section>
  );
}
