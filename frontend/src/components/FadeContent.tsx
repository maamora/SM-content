"use client";

/* REACT BITS ADAPTATION: dependency-safe reveal primitive based on the selected registry component, implemented with STUDIO's existing Motion runtime. */
import * as React from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";

interface FadeContentProps extends Omit<HTMLMotionProps<"div">, "ref" | "children"> {
  children: React.ReactNode;
  blur?: boolean;
  duration?: number;
  ease?: string;
  delay?: number;
  threshold?: number;
  initialOpacity?: number;
  distance?: number;
  onComplete?: () => void;
}

const toSeconds = (value: number) => (value > 10 ? value / 1000 : value);
const toEase = (value: string): [number, number, number, number] | "easeOut" =>
  value.includes("power") || value.includes("cubic") ? [0.22, 1, 0.36, 1] : "easeOut";

const FadeContent: React.FC<FadeContentProps> = ({
  children,
  blur = false,
  duration = 260,
  ease = "cubic-bezier(0.22, 1, 0.36, 1)",
  delay = 0,
  threshold = 0.1,
  initialOpacity = 0,
  distance = 10,
  onComplete,
  className = "",
  style,
  ...props
}) => {
  const reducedMotion = useReducedMotion();
  const motionIsDisabled = Boolean(reducedMotion);

  return (
    <motion.div
      className={className}
      style={style}
      initial={motionIsDisabled ? false : { opacity: initialOpacity, y: distance, filter: blur ? "blur(8px)" : "blur(0px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: Math.max(0, Math.min(threshold, 1)) }}
      transition={{ duration: motionIsDisabled ? 0 : toSeconds(duration), delay: motionIsDisabled ? 0 : toSeconds(delay), ease: toEase(ease) }}
      onAnimationComplete={onComplete}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default FadeContent;
