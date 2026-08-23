/* SHADCN / REACT BITS SUPPORT: shared class-name merge utility for future registry components; no existing application behavior depends on this file. */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
