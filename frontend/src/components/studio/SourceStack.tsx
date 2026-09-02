/* Signal Workstation: React Bits Stack adaptation for real product-source images; no decorative or generated media. */
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

export type SourceStackItem = { url: string; label: string };

export function SourceStack({ items }: { items: SourceStackItem[] }) {
    const reduceMotion = useReducedMotion();
    const normalized = useMemo(() => items.filter((item) => item.url.trim().length > 0), [items]);
    const [stack, setStack] = useState<SourceStackItem[]>(normalized);

    useEffect(() => setStack(normalized), [normalized]);
    if (stack.length < 2) return null;

    const bringForward = (label: string) => setStack((current) => {
        const target = current.find((item) => item.label === label);
        return target ? [...current.filter((item) => item.label !== label), target] : current;
    });

    return (
        <div className="studio-source-stack" role="group" aria-label="Product source image stack">
            <span className="studio-source-stack__label">Sources</span>
            <div className="studio-source-stack__cards">
                {stack.map((item, index) => {
                    const depth = stack.length - index - 1;
                    const isFront = depth === 0;
                    return (
                        <motion.button
                            type="button"
                            key={item.label}
                            className="studio-source-stack__card"
                            onClick={() => bringForward(item.label)}
                            aria-pressed={isFront}
                            aria-label={`${isFront ? "Front source" : "Bring"} ${item.label}${isFront ? "" : " forward"}`}
                            initial={false}
                            animate={{
                                x: reduceMotion ? 0 : depth * -7,
                                y: reduceMotion ? 0 : depth * 5,
                                rotate: reduceMotion ? 0 : depth * -2.4,
                                scale: 1 - depth * 0.045,
                                zIndex: index + 1,
                            }}
                            transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 24 }}
                        >
                            <img src={item.url} alt="" draggable={false} />
                            <span>{item.label}</span>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
