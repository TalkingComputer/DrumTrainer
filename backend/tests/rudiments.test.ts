// Tests für die Startliste der Rudimente.
// Ausführen im Ordner backend/ mit: deno task test
//
// Deno.test() ist der eingebaute Test-Runner von Deno, kein Paket nötig.
// assert kommt aus "node:assert", das bringt Deno ebenfalls schon mit.

import assert from "node:assert/strict";
import { getAllRudiments, getRudimentById, validateRudiments } from "../services/rudimentService.ts";

Deno.test("seed/rudiments.json ist fehlerfrei", () => {
  assert.deepEqual(validateRudiments(), []);
});

Deno.test("die Liste ist nicht leer", () => {
  assert.ok(getAllRudiments().length > 0);
});

Deno.test("ein Rudiment lässt sich über seine id finden", () => {
  const first = getAllRudiments()[0];
  const found = getRudimentById(first.id);
  assert.ok(found !== undefined);
  assert.equal(found.name, first.name);
});

Deno.test("eine unbekannte id liefert undefined", () => {
  assert.equal(getRudimentById("gibt-es-nicht"), undefined);
});
