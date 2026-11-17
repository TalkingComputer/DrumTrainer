<script setup lang="ts">
// Zeigt das Notenbild eines Rudiments an.
//
// Die Bilder liegen als SVG-Dateien in frontend/public/rudiments/ und heißen wie die id
// des Rudiments, z. B. single-paradiddle.svg. Alles im Ordner public/ liefert Vite
// unverändert unter derselben Adresse aus: /rudiments/single-paradiddle.svg
//
// Neues Rudiment: im Rudiment Studio (tools/) bauen, "Download SVG" und die Datei
// in public/rudiments/ legen, dann den Eintrag in backend/seed/rudiments.json ergänzen.
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  rudimentId: string
  name: string
}>()

const imageUrl = computed(() => '/rudiments/' + props.rudimentId + '.svg')

// Fehlt die Datei, zeigt der Browser ein kaputtes Bild. Stattdessen einen Hinweis zeigen.
const hasError = ref(false)

// Wechselt das Rudiment, neuer Versuch mit dem neuen Bild
watch(
  () => props.rudimentId,
  () => {
    hasError.value = false
  },
)
</script>

<template>
  <div class="rudiment-notation">
    <!-- alt beschreibt das Bild für Screenreader und erscheint, falls es nicht lädt -->
    <img
      v-if="!hasError"
      :src="imageUrl"
      :alt="`Notation: ${name}`"
      class="notation-image"
      @error="hasError = true"
    />
    <p v-else class="notation-missing">No notation image for {{ name }}</p>
  </div>
</template>

<style scoped>
.rudiment-notation {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.notation-image {
  display: block;
  width: 100%;
  max-width: 560px;
  height: auto;
  max-height: 100%;
  object-fit: contain;
}

.notation-missing {
  margin: 0;
  padding: 1rem;
  text-align: center;
  color: var(--dt-text-muted);
  font-size: var(--dt-font-caption);
}
</style>
