/** Deterministic accent colour per module, cycled from the palette in globals.css.
 *  Keeps module icon chips visually distinct across the sidebar and Apps screen
 *  without hand-assigning a colour to every module. */
const PALETTE = ["blue", "violet", "teal", "amber", "rose", "indigo"] as const;
export type AccentColor = (typeof PALETTE)[number];

export function accentColorForModule(moduleId: string): AccentColor {
  let hash = 0;
  for (let i = 0; i < moduleId.length; i++) hash = (hash * 31 + moduleId.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}
