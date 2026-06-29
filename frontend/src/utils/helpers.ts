import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely, resolving conflicts */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format seconds into mm:ss display */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Format a percentage to 1 decimal place */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** Truncate text to a max character count */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/** Capitalize first letter of a string */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Get initials from a full name */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Map difficulty to a Tailwind color class */
export function difficultyColor(difficulty: string): string {
  const map: Record<string, string> = {
    easy: "text-accent-600 bg-accent-50 border-accent-200",
    medium: "text-yellow-600 bg-yellow-50 border-yellow-200",
    hard: "text-red-600 bg-red-50 border-red-200",
    mixed: "text-primary-600 bg-primary-50 border-primary-200",
  };
  return map[difficulty] ?? "text-dark-500 bg-dark-100 border-dark-200";
}

/** Format a date string to a readable format */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Calculate score color based on percentage */
export function scoreColor(pct: number): string {
  if (pct >= 80) return "text-accent-600";
  if (pct >= 60) return "text-yellow-500";
  return "text-red-500";
}
