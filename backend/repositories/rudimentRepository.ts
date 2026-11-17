import type { Rudiment } from "../types.ts";

// Feste Liste aller Rudimente.
// Die id ist ein lesbarer Text statt einer UUID, weil die Liste fest ist.
const RUDIMENTS: Rudiment[] = [
  { id: "single-stroke-roll", name: "Single Stroke Roll" },
  { id: "double-stroke-roll", name: "Double Stroke Roll" },
  { id: "single-paradiddle", name: "Single Paradiddle" },
  { id: "double-paradiddle", name: "Double Paradiddle" },
  { id: "paradiddle-diddle", name: "Paradiddle-diddle" },
  { id: "flam", name: "Flam" },
  { id: "flam-tap", name: "Flam Tap" },
  { id: "drag", name: "Drag" },
  { id: "five-stroke-roll", name: "Five Stroke Roll" },
];

// Gibt alle Rudimente zurück
export function findAllRudiments(): Rudiment[] {
  return RUDIMENTS;
}

// Sucht ein Rudiment anhand seiner id
export function findRudimentById(id: string): Rudiment | undefined {
  for (const rudiment of RUDIMENTS) {
    if (rudiment.id === id) {
      return rudiment;
    }
  }
  return undefined;
}