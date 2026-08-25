# GeoIssue — Design Style Spec (for coding agent)

Give this to the agent alongside the MVP Master Prompt whenever it touches UI. This is the concrete version of "Premium Minimal Civic UI" — tokens and rules, not vibes.

---

## 1. Reference Point (say this to the agent explicitly)

> Visual inspiration: Apple, Linear, Vercel. Do NOT default to a generic Bootstrap/Material admin look, a colorful dashboard, a crypto-style UI, glassmorphism, or a marketing-landing-page feel. The product should read as **calm, official, modern, trustworthy** — a civic tool people trust with real problems, not a consumer app trying to be exciting.

---

## 2. Color System

Monochrome base + exactly **one** accent color. No secondary/tertiary brand colors.

### Light theme
```
--bg:            #FAFAFA   (near white, not pure white)
--surface:       #FFFFFF
--text-primary:  #171717   (near black, not pure black)
--text-secondary:#6B6B6B
--border:        #E5E5E5
--hover-surface: #F0F0F0
```

### Dark theme
```
--bg:            #0E0E0F   (near black, not pure black)
--surface:       #18181A   (slightly elevated)
--text-primary:  #F2F2F2   (off-white, not pure white)
--text-secondary:#9B9B9B
--border:        #2A2A2C
--hover-surface: #222224
```

### Accent
Pick ONE and lock it before Phase 1 UI work starts — don't leave this open:
- Muted slate blue `#4C6FFF`-ish, OR
- Muted teal `#0F9B8E`-ish, OR
- Restrained civic green `#2F855A`-ish

Whichever is picked, define it as `--accent` and `--accent-hover` and use it **only** for: primary buttons, active nav state, focus rings, links. Never for large background fills.

### Status colors (semantic, muted — never saturated)
```
submitted   → neutral gray
in_review   → muted amber
accepted    → muted blue
in_progress → --accent (blue-ish)
resolved    → muted green
rejected    → muted red
```
Status color shows as a small badge/dot, never as a full-card background.

---

## 3. Typography

Font stack: **Geist** first choice, **Inter** fallback.

```
Hero   48–56px / weight 600
H1     36–40px / weight 600
H2     28–32px / weight 600
H3     20–24px / weight 600
Body   15–16px / weight 400
Small  13–14px / weight 400
Button 14–15px / weight 500
```
Rule: avoid bold text outside headings and buttons. Body copy stays weight 400 always — no bolding for "emphasis" in paragraphs.

---

## 4. Spacing Scale

Only these values, nothing arbitrary in between:
```
4  8  12  16  24  32  48  64
```
If a component needs "something between 16 and 24," that's a sign the layout needs rethinking, not a new spacing value.

---

## 5. Radius & Elevation

```
Radius: 8px (small controls) / 10px (default) / 12px (cards, modals)
```
Shadows: minimal by default. Prefer a 1px border + subtle surface contrast over a box-shadow. Reserve real elevation (stronger shadow) for things that are *actually floating above content*: dropdowns, modals, floating panels. A static card sitting in a page flow should not have a shadow.

---

## 6. Motion

```
Duration: 150–250ms
Easing: ease-out for entrances, ease-in for exits
```
What motion is for: hover state, focus state, pressed state, selection state, panel open/close, marker select on map. Typical hover: background shifts one step darker/lighter, border strengthens slightly, element may shift ~1px. Nothing more dramatic than that — no scale-up, no rotation, no bounce. Motion should read as "this responded to you," not "look at this effect." Respect `prefers-reduced-motion`.

---

## 7. Layout Discipline

- Not every section is a Card. Use whitespace and dividers before reaching for a bordered box.
- Desktop: map + side list side-by-side. Tablet: map stacked above list. Mobile: compact map + feed + bottom nav — restructure, don't just shrink the desktop layout.
- Build components only when a screen actually needs them (Button, Input, StatusBadge, MapMarker, IssueListRow first — Drawer/Tooltip/Skeleton only when a real screen requires one). Don't pre-build a full component library speculatively.

---

## 8. One-line brief for the agent

> "Every screen should look like it belongs in the same calm, minimal, monochrome-plus-one-accent product — closer to a well-designed internal tool at Linear than a public-facing marketing app. If a UI decision feels flashy, it's wrong for this product."
