# 03 — Theming Strategy (meerdere thema's)

> **Doel:** beschrijven hoe PANGU straks met één knop van uitstraling, gevoel en stijl
> kan wisselen — tussen **meerdere** thema's — terwijl de functionaliteit exact gelijk
> blijft. Dit document is het contract waar elke component zich aan houdt.

## Kernprincipe

> **Componenten lezen uitsluitend design-tokens en canonieke klassen — nooit
> hardgecodeerde hex/`rgba()`.** Een thema is dan niets meer dan een set token-waarden.
> Wisselen = het actieve token-blok omzetten; geen enkele component verandert mee.

## Drie onafhankelijke assen

Het design-system levert dit mechanisme al via data-attributen op `<html>`. We gebruiken
drie orthogonale assen:

| As | Attribuut | Wat het regelt | Waarden |
|---|---|---|---|
| **Thema** | `data-theme` | Volledige skin (kleuren, radii, fonts, shadows) | `sanctum` (nu), later o.a. extra thema's |
| **Accent** | `data-accent` | Primaire tint (`--violet`-familie) | `violet` (default), `teal`, `gold`, `azure`, `crimson` |
| **Densiteit** | `data-density` | Tussenliggende spacing-stappen | `standard` (default), `cozy`, `compact` |

`data-accent` en `data-density` zitten al volledig in `src/index.css`
(`:root[data-accent="…"]`, `:root[data-density="…"]`). `data-theme` heeft nu een
identiteits-default (`sanctum` = huidige look); extra thema-blokken worden later toegevoegd.

## Token-lagen

```
:root { … basis-tokens (huidige look) … }          ← fase 1 (deze branch)
:root[data-theme="<naam>"] { … overrides … }        ← fase 2 (DS-v2) + fase 4 (extra thema's)
:root[data-accent="<naam>"] { … --violet-familie … } ← aanwezig
:root[data-density="<naam>"] { … --sp-* … }          ← aanwezig
```

Een thema-blok overschrijft alleen tokens. Omdat de canonieke klassen
(`.btn`, `.surface`, `.input`, `.badge`, `.tab`, …) en de Tailwind semantische aliassen
(`bg-surface`, `text-ink`, `border-hairline`, via `@theme inline`) **alleen** naar die
tokens verwijzen, herstyle je de hele app door het attribuut te zetten.

## Runtime-mechaniek (groundwork — aanwezig)

- **`src/stores/theme.store.ts`** — Zustand, persisted (`name: 'theme'`). State:
  `theme`, `accent`, `density` + setters. Default = huidige look.
- **`src/components/ThemeProvider.tsx`** — zet de attributen op `document.documentElement`
  in een `useEffect`. Default-waarden (`violet`/`standard`) verwijderen het attribuut, zodat
  geen override actief is → visueel inert nu. Gewikkeld rond de router in `App.tsx`.
- **`/design-system`** — live testoppervlak: knoppen wisselen `data-theme`/`data-accent`/
  `data-density` en de pagina her-styled zonder layout-/functionaliteitswijziging.

## Wat nog moet (fase 2 en 4)

**Fase 2 — DS-v2 als nieuwe basis (alleen tokens):**
- In `src/index.css` de token-waarden naar DS-v2 zetten: rondere radii
  (`--r-sm 8`, `--r 12`, `--r-md 20`, `--r-lg 28`, `--r-xl 36`) en eventueel verfijnde
  kleuren/shadows. Geen component-markup wijzigt.
- De `.pangu-*`-aliassen kunnen daarna uitgefaseerd worden (zie doc 01-checklist).
- Knop-convergentie (`<Button>` ↔ `.btn`) meenemen.

**Fase 4 — extra thema's + schakelaar:**
- Per thema een `:root[data-theme="<naam>"]`-blok met de volledige token-override.
- `ThemeName`-union + `THEMES` in `theme.store.ts` uitbreiden.
- Schakel-UI in `SettingsPage` (Voorkeuren-tab): segmented control per as, gekoppeld aan
  de store. `ThemeProvider` doet de rest.
- A11Y: respecteer `prefers-reduced-motion` (al afgedekt) en zorg dat elk thema
  WCAG-contrast haalt (≥4.5:1 tekst, ≥3:1 UI).

## Hard contract voor nieuwe code

1. Geen hex/`rgba()` in `className`/`style` — gebruik tokens (`var(--…)`), canonieke
   klassen of semantische Tailwind-aliassen.
2. Nieuwe semantische kleuren altijd als token in `:root` + (indien nodig) in het
   `@theme inline`-blok, daarna pas gebruiken.
3. Overlay/scrim-effecten via de bestaande overlay-tokens (`--scrim*`, `--overlay-*`),
   niet via losse rgba's.
4. Componenten blijven puur presentatie; geen thema-logica buiten `theme.store` +
   `ThemeProvider`.
