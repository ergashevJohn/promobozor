# PromoBozor Design System 2.0

Last updated: 2026-08-07

## Purpose

This system exists to make PromoBozor feel:

- more intentional than the old PromoBozor look
- less like a generic coupon directory
- more like a trusted savings product

## Color System (Cold monochrome + brand coral)

Live tokens in `app/globals.css`:

- Background: `#f1f3f5` (cool canvas, not warm cream)
- Card: `#ffffff`
- Foreground / ink: `#0f1419`
- Secondary / muted: `#e8ebef`
- Border: `#d8dde3`
- Accent (brand CTA): `#e84e42`
- Accent soft surface: `#eef2f6`

Dark:

- Background: `#0b0f14`
- Card: `#141a22`
- Same coral accent

## Radius lock

- Controls: `0.75rem` (`rounded-xl`)
- Surfaces: `1rem`
- Hero: `1.25rem`
- Pill (`rounded-full`) only for floating header chrome

## Typography

- Sans: Manrope (`--font-brand-sans`)
- Mono: JetBrains Mono (`--font-brand-mono`)

## Icons

Phosphor (`@phosphor-icons/react`). `components.json` iconLibrary: phosphor.

## Eyebrow discipline

Max `ceil(sectionCount / 3)` `brand-kicker` labels per page. Prefer plain headlines.

See also: `docs/ui-taste-audit.md`.
