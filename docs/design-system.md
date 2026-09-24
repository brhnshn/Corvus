<div align="center">

[![English](https://img.shields.io/badge/Language-English-blue?style=for-the-badge)](design-system.md)
[![Türkçe](https://img.shields.io/badge/Dil-T%C3%BCrk%C3%A7e-red?style=for-the-badge)](design-system.tr.md)

</div>

# Design System — Self-Hosted Dashboard

## 1. Design Philosophy

- Dark theme by default (technical, low eye strain in homelab/server operations)
- Professional aesthetic: industry-standard dark console palette
- Colors are functional indicators representing runtime health, not arbitrary decoration

---

## 2. Color Palette

### Dark Theme (Default)

| Purpose | Semantic Role | Hex |
|---|---|---|
| Background | Deep navy-charcoal | `#0f1117` |
| Card / Surface | Elevated dark slate | `#1a1d29` |
| Surface (Hover / Layer 2) | Interactive highlight | `#1e2130` |
| Borders & Dividers | Subtle structural lines | `#2a2e3f` |
| Primary Text | High-contrast body | `#e5e7eb` |
| Secondary Text | Muted labels & timestamps | `#9ca3af` |

### Accent Colors

| Purpose | Semantic Role | Hex |
|---|---|---|
| Primary Accent | Pale silver / platinum | `#d4d4d8` |
| Secondary Accent | Polished silver (hover/focus) | `#e4e4e7` |
| Accent Contrast Text | Dark text inside filled buttons | `#0f1117` |

> The silver/platinum accent evokes the sheen of a raven's feathers, serving as the sole focal highlight in an otherwise monochrome structure. It does not clash with operational status hues.

### Operational Status Colors (Standardized)

| State | Color | Hex |
|---|---|---|
| Healthy / Operational | Green | `#22c55e` |
| Warning / Degraded | Amber | `#f59e0b` |
| Critical / Down | Red | `#ef4444` |
| Unknown / Inactive | Gray | `#6b7280` |

---

## 3. Typography

| Usage | Font Category | Example Font Families |
|---|---|---|
| Headings, UI labels | Sans-serif | Inter, Geist, system-ui |
| Telemetry values (CPU%, RAM, Latency) | Monospace | JetBrains Mono, Fira Code, monospace |

---

## 4. Component Standards

- **Cards:** Subtle borders (`#2a2e3f`), rounded corners (8–12px), minimal shadow.
- **Status Badges:** Compact dot indicator + color token + descriptive label.
- **Charts:** Silver/platinum line traces for performance; status colors reserved for threshold boundaries.
- **Buttons:** Primary action uses filled silver background with `#0f1117` dark text; secondary actions use subtle borders.

---

## 5. Logo & Brand Mark

- **Master Symbol:** Monochrome silhouette of a raven's head — icon-only geometric design.
- **Wordmark:** "Corvus" in clean geometric typography placed alongside the icon.
