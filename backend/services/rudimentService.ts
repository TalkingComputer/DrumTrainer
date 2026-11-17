import type { Rudiment } from "../types.ts";
import { findAllRudiments, findRudimentById } from "../repositories/rudimentRepository.ts";

export function getAllRudiments(): Rudiment[] {
  return findAllRudiments();
}

export function getRudimentById(id: string): Rudiment | undefined {
  return findRudimentById(id);
}

// Prüft die komplette Startliste und gibt alle gefundenen Fehler zurück.
// Eine leere Liste heißt: alles in Ordnung.
// Die Noten selbst liegen als SVG-Dateien im Frontend, das Backend kennt nur id und name.
export function validateRudiments(): string[] {
  const errors: string[] = [];
  const seenIds: string[] = [];

  for (const rudiment of findAllRudiments()) {
    const label = "Rudiment '" + rudiment.id + "'";

    // id muss vorhanden und eindeutig sein
    if (typeof rudiment.id !== "string" || rudiment.id.trim() === "") {
      errors.push("A rudiment has no id");
      continue;
    }
    if (seenIds.includes(rudiment.id)) {
      errors.push(label + ": duplicate id");
    }
    seenIds.push(rudiment.id);

    // Die id ist zugleich der Dateiname der SVG (z. B. single-paradiddle.svg).
    // Deshalb nur Kleinbuchstaben, Ziffern und Bindestriche.
    if (!/^[a-z0-9-]+$/.test(rudiment.id)) {
      errors.push(label + ": id may only contain a-z, 0-9 and -");
    }

    // name muss vorhanden sein
    if (typeof rudiment.name !== "string" || rudiment.name.trim() === "") {
      errors.push(label + ": name is missing");
    }
  }

  return errors;
}
