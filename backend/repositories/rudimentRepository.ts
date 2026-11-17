import type { Rudiment } from "../types.ts";

// Die Startliste kommt aus einer JSON-Datei im Ordner seed/.
// "with { type: 'json' }" sagt Deno: Das ist keine Code-Datei, sondern JSON.
// Deno liest die Datei einmal beim Start. Nach einer Änderung das Backend neu starten.
import rudimentsFromFile from "../seed/rudiments.json" with { type: "json" };

const RUDIMENTS: Rudiment[] = rudimentsFromFile;

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
