// Gradient palettes per card variant — single source of truth for hash → HSL palette.

// Cover: hero cards (WorldCard, CampaignDetailPage header) — strong opacity, void endpoint
export const coverGradients = [
  'radial-gradient(ellipse 70% 55% at 50% 32%, rgba(155,138,255,0.55) 0%, rgba(80,50,200,0.28) 45%, var(--void) 78%)',
  'radial-gradient(ellipse 65% 52% at 50% 35%, rgba(220,90,80,0.4) 0%, rgba(155,138,255,0.22) 50%, var(--void) 78%)',
  'radial-gradient(ellipse 65% 52% at 50% 35%, rgba(62,207,178,0.32) 0%, rgba(60,80,200,0.28) 50%, var(--void) 78%)',
  'radial-gradient(ellipse 65% 50% at 45% 35%, rgba(245,180,50,0.28) 0%, rgba(155,138,255,0.32) 50%, var(--void) 78%)',
]

// Accent: compact cards (Campaign) — medium opacity, transparent endpoint
export const accentGradients = [
  'radial-gradient(ellipse 70% 55% at 50% 32%, rgba(155,138,255,0.4) 0%, rgba(80,50,200,0.18) 55%, transparent 80%)',
  'radial-gradient(ellipse 65% 52% at 50% 35%, rgba(220,90,80,0.3) 0%, rgba(155,138,255,0.15) 55%, transparent 80%)',
  'radial-gradient(ellipse 65% 52% at 50% 35%, rgba(62,207,178,0.22) 0%, rgba(60,80,200,0.18) 55%, transparent 80%)',
  'radial-gradient(ellipse 65% 50% at 45% 35%, rgba(245,180,50,0.2) 0%, rgba(155,138,255,0.22) 55%, transparent 80%)',
]

// Session: side-weighted, lighter
export const sessionGradients = [
  'radial-gradient(ellipse 70% 55% at 30% 40%, rgba(155,138,255,0.22) 0%, rgba(80,50,200,0.10) 55%, transparent 80%)',
  'radial-gradient(ellipse 65% 52% at 28% 42%, rgba(220,90,80,0.18) 0%, rgba(155,138,255,0.10) 55%, transparent 80%)',
  'radial-gradient(ellipse 65% 52% at 30% 42%, rgba(62,207,178,0.14) 0%, rgba(60,80,200,0.12) 55%, transparent 80%)',
  'radial-gradient(ellipse 65% 50% at 25% 40%, rgba(245,180,50,0.14) 0%, rgba(155,138,255,0.16) 55%, transparent 80%)',
]

// Location: teal-tinted
export const locationGradients = [
  'radial-gradient(ellipse 70% 55% at 30% 40%, rgba(62,207,178,0.18) 0%, rgba(60,120,80,0.10) 55%, transparent 80%)',
  'radial-gradient(ellipse 65% 52% at 28% 42%, rgba(245,180,50,0.16) 0%, rgba(62,207,178,0.10) 55%, transparent 80%)',
  'radial-gradient(ellipse 65% 52% at 30% 42%, rgba(155,138,255,0.16) 0%, rgba(62,207,178,0.12) 55%, transparent 80%)',
  'radial-gradient(ellipse 65% 50% at 25% 40%, rgba(220,90,80,0.14) 0%, rgba(62,207,178,0.14) 55%, transparent 80%)',
]

// Lore: violet-tinted
export const loreGradients = [
  'radial-gradient(ellipse 70% 55% at 30% 40%, rgba(155,138,255,0.18) 0%, rgba(80,50,200,0.10) 55%, transparent 80%)',
  'radial-gradient(ellipse 65% 52% at 28% 42%, rgba(245,180,50,0.16) 0%, rgba(155,138,255,0.10) 55%, transparent 80%)',
  'radial-gradient(ellipse 65% 52% at 30% 42%, rgba(62,207,178,0.16) 0%, rgba(155,138,255,0.12) 55%, transparent 80%)',
  'radial-gradient(ellipse 65% 50% at 25% 40%, rgba(220,90,80,0.14) 0%, rgba(155,138,255,0.14) 55%, transparent 80%)',
]

// NPC: crimson-tinted
export const npcGradients = [
  'radial-gradient(ellipse 70% 55% at 30% 40%, rgba(220,90,80,0.18) 0%, rgba(180,50,80,0.10) 55%, transparent 80%)',
  'radial-gradient(ellipse 65% 52% at 28% 42%, rgba(220,90,80,0.14) 0%, rgba(155,138,255,0.12) 55%, transparent 80%)',
  'radial-gradient(ellipse 65% 52% at 30% 42%, rgba(245,150,50,0.16) 0%, rgba(220,90,80,0.12) 55%, transparent 80%)',
  'radial-gradient(ellipse 65% 50% at 25% 40%, rgba(155,138,255,0.14) 0%, rgba(220,90,80,0.14) 55%, transparent 80%)',
]

// Character: azure-tinted
export const characterGradients = [
  'radial-gradient(ellipse 70% 55% at 30% 40%, rgba(56,152,255,0.18) 0%, rgba(30,80,200,0.10) 55%, transparent 80%)',
  'radial-gradient(ellipse 65% 52% at 28% 42%, rgba(56,152,255,0.14) 0%, rgba(155,138,255,0.12) 55%, transparent 80%)',
  'radial-gradient(ellipse 65% 52% at 30% 42%, rgba(62,207,178,0.14) 0%, rgba(56,152,255,0.12) 55%, transparent 80%)',
  'radial-gradient(ellipse 65% 50% at 25% 40%, rgba(245,180,50,0.14) 0%, rgba(56,152,255,0.14) 55%, transparent 80%)',
]

// Bestiary: deep teal/green-tinted (natural/creature theme)
export const bestiaryGradients = [
  'radial-gradient(ellipse 70% 55% at 30% 40%, rgba(62,207,178,0.20) 0%, rgba(30,120,90,0.12) 55%, transparent 80%)',
  'radial-gradient(ellipse 65% 52% at 28% 42%, rgba(62,207,178,0.16) 0%, rgba(155,138,255,0.10) 55%, transparent 80%)',
  'radial-gradient(ellipse 65% 52% at 30% 42%, rgba(30,160,110,0.18) 0%, rgba(62,207,178,0.12) 55%, transparent 80%)',
  'radial-gradient(ellipse 65% 50% at 25% 40%, rgba(245,180,50,0.14) 0%, rgba(62,207,178,0.16) 55%, transparent 80%)',
]

// Encounter: crimson/danger-tinted (combat theme)
export const encounterGradients = [
  'radial-gradient(ellipse 70% 55% at 30% 40%, rgba(220,90,80,0.22) 0%, rgba(180,50,80,0.12) 55%, transparent 80%)',
  'radial-gradient(ellipse 65% 52% at 28% 42%, rgba(220,90,80,0.18) 0%, rgba(155,138,255,0.12) 55%, transparent 80%)',
  'radial-gradient(ellipse 65% 52% at 30% 42%, rgba(180,50,80,0.20) 0%, rgba(220,90,80,0.12) 55%, transparent 80%)',
  'radial-gradient(ellipse 65% 50% at 25% 40%, rgba(155,138,255,0.16) 0%, rgba(220,90,80,0.16) 55%, transparent 80%)',
]

// Quest: gold-tinted (treasure/adventure theme)
export const questGradients = [
  'radial-gradient(ellipse 70% 55% at 30% 40%, rgba(245,180,50,0.22) 0%, rgba(200,120,30,0.12) 55%, transparent 80%)',
  'radial-gradient(ellipse 65% 52% at 28% 42%, rgba(245,180,50,0.18) 0%, rgba(155,138,255,0.12) 55%, transparent 80%)',
  'radial-gradient(ellipse 65% 52% at 30% 42%, rgba(155,138,255,0.18) 0%, rgba(245,180,50,0.14) 55%, transparent 80%)',
  'radial-gradient(ellipse 65% 50% at 25% 40%, rgba(245,180,50,0.16) 0%, rgba(62,207,178,0.14) 55%, transparent 80%)',
]

export function pickGradient(id: string, gradients: string[] = accentGradients): string {
  // charCodeAt returns NaN for empty strings; NaN ?? 0 is still NaN, so use || 0 instead
  const code = (id.charCodeAt(0) || 0) + (id.charCodeAt(id.length - 1) || 0)
  return gradients[code % gradients.length]
}
