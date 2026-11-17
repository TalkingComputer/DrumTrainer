// Tests für das Notations-Modul aus shared/.
// Ausführen im Ordner backend/ mit: deno task test
//
// Deno.test() ist der eingebaute Test-Runner von Deno, kein Paket nötig.
// assert kommt aus "node:assert", das bringt Deno ebenfalls schon mit.

import assert from "node:assert/strict";
// @ts-types="../../shared/rudimentNotation.d.ts"
import { parsePattern, PRESETS, renderRudiment } from "../../shared/rudimentNotation.js";
import rudimentsFromFile from "../seed/rudiments.json" with { type: "json" };

Deno.test("alle PRESETS lassen sich fehlerfrei einlesen und als SVG zeichnen", () => {
  for (const preset of PRESETS) {
    const result = parsePattern(preset.pattern);
    assert.deepEqual(result.errors, [], "Fehler in Preset " + preset.id);

    const svg = renderRudiment(preset.pattern, { beamGroup: preset.beamGroup });
    assert.ok(svg.startsWith("<svg"), "Kein SVG für Preset " + preset.id);
  }
});

Deno.test("alle Rudimente aus seed/rudiments.json lassen sich zeichnen", () => {
  for (const rudiment of rudimentsFromFile) {
    const svg = renderRudiment(rudiment.pattern, { beamGroup: rudiment.beamGroup });
    assert.ok(svg.startsWith("<svg"), "Kein SVG für " + rudiment.id);
  }
});

Deno.test("unbekanntes Zeichen im Pattern liefert eine Fehlermeldung", () => {
  const result = parsePattern("16X");
  assert.equal(result.errors.length, 1);
});

Deno.test("nicht geschlossene Triole liefert eine Fehlermeldung", () => {
  const result = parsePattern("16R (3 16L 16R");
  assert.ok(result.errors.length > 0);
});

Deno.test("verschachtelte Tuplets werden abgelehnt", () => {
  const result = parsePattern("(3 (3 8R) 8L)");
  assert.ok(result.errors.length > 0);
});

Deno.test("die SVG enthält keinen Text aus dem Pattern (Schutz für v-html)", () => {
  // Ein Pattern mit HTML darin darf nicht in der SVG landen
  const svg = renderRudiment('16R <script>alert("x")</script>');
  assert.ok(!svg.includes("<script"), "Pattern-Text ist in der SVG gelandet");
});
