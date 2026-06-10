// SRD 5.1 — regels voor het bepalen van ability scores op level 1.

export const POINT_BUY_BUDGET = 27
export const POINT_BUY_MIN = 8
export const POINT_BUY_MAX = 15

// Totale kosten per eindscore (niet per stap).
export const POINT_BUY_COSTS: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9,
}

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const

export const MANUAL_MIN = 3
export const MANUAL_MAX = 20

// 3×3 raster: rijen = goed/neutraal/kwaad, kolommen = rechtmatig/neutraal/chaotisch.
export const ALIGNMENTS: readonly (readonly string[])[] = [
  ['Rechtmatig Goed', 'Neutraal Goed', 'Chaotisch Goed'],
  ['Rechtmatig Neutraal', 'Neutraal', 'Chaotisch Neutraal'],
  ['Rechtmatig Kwaad', 'Neutraal Kwaad', 'Chaotisch Kwaad'],
]
