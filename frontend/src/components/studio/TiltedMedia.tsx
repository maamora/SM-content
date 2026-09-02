/* Signal Workstation: React Bits TiltedCard adaptation for existing product media, with reduced-motion protection. */
"use client";

import { ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";

export function TiltedMedia({ children }: { children: ReactNode }) {
    const reduceMotion = useReducedMotion();
    const rotateX = useSpring(useMotionValue(0), { damping: 26, stiffness: 170, mass: 0.65 });
    const rotateY = useSpring(useMotionValue(0), { damping: 26, stiffness: 170, mass: 0.65 });
    const scale = useSpring(1, { damping: 26, stiffness: 170, mass: 0.65 });

    const reset = () => { rotateX.set(0); rotateY.set(0); scale.set(1); };
    const move = (event: React.PointerEvent<HTMLDivElement>) => {
        if (reduceMotion || event.pointerType !== "mouse") return;
        const bounds = event.currentTarget.getBoundingClientRect();
        rotateX.set(((event.clientY - bounds.top) / bounds.height - 0.5) * -5.5);
        rotateY.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 5.5);
        scale.set(1.025);
    };

    return <motion.div className="studio-tilted-media" style={{ rotateX, rotateY, scale }} onPointerMove={move} onPointerLeave={reset}>{children}</motion.div>;
}
