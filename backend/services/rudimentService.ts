import type { Rudiment } from "../types.ts";
import { findAllRudiments, findRudimentById } from "../repositories/rudimentRepository.ts";

// Dasselbe Modul nutzt auch das Frontend zum Zeichnen der Noten.
// Die Zeile mit @ts-types sagt Deno, wo die TypeScript-Typen zur JS-Datei liegen.
// @ts-types="../../shared/rudimentNotation.d.ts"
import { parsePattern } from "../../shared/rudimentNotation.js";

export function getAllRudiments(): Rudiment[] {
  return findAllRudiments();
}

export function getRudimentById(id: string): Rudiment | undefined {
  return findRudimentById(id);
}

// Prüft die komplette Startliste und gibt alle gefundenen Fehler zurück.
// Eine leere Liste heißt: alles in Ordnung.
export function validateRudiments(): string[] {
  const errors: string[] = [];
  const seenIds: string[] = [];

  for (const rudiment of findAllRudiments()) {
    const label = "Rudiment '" + rudiment.id + "'";

    // id muss vorhanden und eindeutig sein
    if (typeof rudiment.id !== "string" || rudiment.id.trim() === "") {
      errors.push("Ein Rudiment hat keine id");
      continue;
    }
    if (seenIds.includes(rudiment.id)) {
      errors.push(label + ": id kommt doppelt vor");
    }
    seenIds.push(rudiment.id);

    // name muss vorhanden sein
    if (typeof rudiment.name !== "string" || rudiment.name.trim() === "") {
      errors.push(label + ": name fehlt");
    }

    // beamGroup ist optional, aber wenn vorhanden eine Zahl größer 0
    if (rudiment.beamGroup !== undefined) {
      if (typeof rudiment.beamGroup !== "number" || rudiment.beamGroup <= 0) {
        errors.push(label + ": beamGroup muss eine Zahl größer 0 sein");
      }
    }

    // pattern muss sich fehlerfrei einlesen lassen
    if (typeof rudiment.pattern !== "string" || rudiment.pattern.trim() === "") {
      errors.push(label + ": pattern fehlt");
      continue;
    }
    const result = parsePattern(rudiment.pattern);
    for (const patternError of result.errors) {
      errors.push(label + ": " + patternError);
    }
  }

  return errors;
}
