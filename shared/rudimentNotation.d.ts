export interface NoteItem {
  type: "note";
  dur: 1 | 2 | 4 | 8 | 16 | 32;
  dots: number;
  rest: boolean;
  accent: boolean;
  grace: "flam" | "drag" | null;
  tremolo: 0 | 1 | 2 | 3;
  buzz: boolean;
  sticking: string;
  alt: string;
  tuplet: { id: number; n: number } | null;
}
export interface BarItem { type: "bar"; }
export type PatternItem = NoteItem | BarItem;

export interface RenderOptions {
  /** SVG color. Default "currentColor", so CSS `color` tints the notation. */
  color?: string;
  /** Background fill, default "none". */
  background?: string;
  /** Beam length in quarter notes. 1 = 4/4, 1.5 = 6/8 or sextuplets. */
  beamGroup?: number;
  showSticking?: boolean;
  staffLine?: boolean;
  padding?: number;
  fontFamily?: string;
}

export interface RudimentPreset {
  id: string;
  name: string;
  pattern: string;
  beamGroup?: number;
}

export function parsePattern(src: string): { items: PatternItem[]; errors: string[] };
export function serializePattern(items: PatternItem[]): string;
export function renderRudiment(pattern: string | PatternItem[], options?: RenderOptions): string;
export const PRESETS: RudimentPreset[];
