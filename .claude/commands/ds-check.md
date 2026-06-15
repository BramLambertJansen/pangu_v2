---
description: Controleer de design-system-discipline van de huidige wijziging.
---

Voer de **Design-System-First** controle uit op de huidige wijziging (zie CLAUDE.md → "Design-System-First werkwijze"):

1. Draai `npm run check:styles:strict` en rapporteer blokkers (hex / gekleurde rgba / color-mix / `.pangu-*`).
2. Voegt deze wijziging UI toe? Zo ja, controleer:
   - **Hergebruik** — is een bestaande primitive uit `src/components/ui/` gebruikt waar mogelijk?
   - **Primitive** — is nieuwe gedeelde UI een getypeerde primitive in `src/components/ui/` (geen one-off in een pagina/feature-component)?
   - **Registry** — staat elke nieuwe primitive op `/design-system` (`src/pages/DesignSystemPage.tsx`)?
3. Draai `npm run check:docs` (primitives + migraties gedocumenteerd in CLAUDE.md).

Rapporteer per facet ✅/❌, met bij ❌ de concrete vindplaats en de fix.
