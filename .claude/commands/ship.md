---
description: Draai alle harde gates vóór commit/push (Definition of Done).
---

Draai de volledige **Definition of Done** gate-set:

1. `npm run check:all` (lint + type-check + test + check:styles:strict + check:docs).

Rapporteer per gate ✅/❌. Bij ❌: toon het commando en de eerste foutregels en **stop** — niet committen/pushen tot alles groen is. Bij volledig groen: vat samen wat klaar is om te committen; commit/push alleen als daar expliciet om is gevraagd.
