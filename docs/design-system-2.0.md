# PromoBozor Design System 2.0

Last updated: 2026-04-29

## Purpose

This system exists to make PromoBozor feel:

- more intentional than the old Promokoduz look
- less like a generic coupon directory
- more like a trusted savings product

This is not a color refresh only.
This is a new component language for the next implementation phase.

## Core Principles

1. Trust before decoration
2. Savings discovery before catalog browsing
3. Clean structure with stronger section contrast
4. Repetition reduction across cards and blocks
5. Fewer “same-looking modules”, more page-role-specific modules

## Color System

Base tokens remain:

- Primary: `#111827`
- Background: `#FFFFFF`
- Secondary surface: `#F8FAFC`
- Accent: `#FF5A4F`
- Border: `#E5E7EB`
- Muted text: `#6B7280`
- Success: `#16A34A`
- Warning: `#F59E0B`

Usage rules:

- dark text and white space should dominate
- coral should signal action, emphasis or freshness
- success green should mean proof, not decoration
- warning should be used only for urgency or expiry contexts

## Surface Hierarchy

We need more distinct section layers.

### Surface A: Base canvas

Use for:

- page background
- neutral reading zones

Style:

- white or very soft warm-neutral white

### Surface B: Soft utility surface

Use for:

- helper modules
- educational blocks
- content support zones

Style:

- light neutral background
- low contrast border

### Surface C: Elevated action surface

Use for:

- featured deals
- highlighted conversion blocks
- hero support cards

Style:

- stronger shadow
- tighter content
- more deliberate emphasis

### Surface D: Dark insight surface

Use for:

- hero insight
- confidence / system / methodology blocks
- limited premium emphasis

Style:

- dark background
- white text
- sparse usage only

## Radius Scale

Reduce random-feeling rounding and make it intentional.

- `radius-sm`: 12px
- `radius-md`: 16px
- `radius-lg`: 24px
- `radius-xl`: 32px

Usage:

- inputs and chips: 12px / pill
- cards: 16px or 24px
- major panels: 24px or 32px

## Shadow Scale

The UI should feel premium but quiet.

- `shadow-soft`: cards in standard grids
- `shadow-elevated`: hero / featured / sticky controls
- `shadow-none`: text-heavy content sections

Rule:

- never use equally heavy shadows on every module
- featured and standard cards must not feel identical

## Typography System

### Headlines

- H1: bold, compact, purposeful
- H2: strong but calmer than H1
- H3: section or module lead

Rules:

- fewer giant headings
- more meaningful subheads
- better tension between title and support copy

### Body

- default body should stay easy to scan
- helper text should be quieter, not tiny
- metadata should be visible but clearly secondary

### Numbers

Numbers should carry more importance in:

- stats
- savings values
- success rates
- counts

## Section Types

Homepage and listings should use different section families.

### 1. Discovery section

Contains:

- searchable entry
- chips
- high-intent routes

### 2. Deal section

Contains:

- active cards
- ranking logic
- confidence cues

### 3. Proof section

Contains:

- verification
- freshness
- methodology
- stats

### 4. Browse section

Contains:

- stores
- categories
- brands

### 5. Editorial section

Contains:

- educational content
- FAQ
- how to save

Each section type should not reuse the exact same visual wrapper.

## Card System

### Deal Card

Purpose:

- show one actionable offer

Must prioritize:

1. title / savings value
2. CTA
3. trust / freshness cue
4. source context

### Directory Card

Purpose:

- navigate to store / brand / category

Must prioritize:

1. entity identity
2. short supporting signal
3. click path

### Insight Card

Purpose:

- explain, reassure, guide

Must prioritize:

1. idea
2. proof or reason
3. low-friction reading

These 3 card types should no longer feel like visual siblings with only content swapped.

## Badge System

Badges should be fewer and more meaningful.

Primary badges:

- Verified
- New
- Popular
- Ending soon
- Exclusive

Secondary utility badges:

- Code
- Deal
- Free shipping
- Cashback

Rules:

- no more than 2 primary badges per card
- badge color should encode meaning, not random style

## CTA System

### Primary CTA

Use for:

- copy code
- get deal
- open top offer

Style:

- coral fill
- high contrast
- strongest hierarchy

### Secondary CTA

Use for:

- view all
- explore store
- compare offers

Style:

- outline or subtle filled

### Tertiary CTA

Use for:

- helper links
- methodology links
- secondary support actions

Rule:

- one obvious primary action per module

## Search & Filter System

Search should feel like product functionality, not a basic form field.

Needed characteristics:

- clearer focus ring
- stronger spacing
- better selected state for filters
- quick route chips near search
- easier mobile layout

## Motion Rules

Motion should support comprehension.

Allowed:

- hover lift
- fade / reveal
- chip state transitions
- CTA feedback

Avoid:

- flashy pulses everywhere
- equal animation on all sections
- motion that competes with text

## Page-Level Differences

### Homepage

Should feel:

- directional
- editorial
- conversion-aware

### Listing Pages

Should feel:

- efficient
- sortable
- useful under scanning behavior

### Entity Pages

Should feel:

- specific
- contextual
- more informative than listings

### Detail Pages

Should feel:

- trustworthy
- actionable
- clear about what to do next

## Immediate Use In Next Tasks

PB-10 must use:

- section-family differences
- new homepage hierarchy
- at least 1 dark proof surface and 1 editorial support surface

PB-11 / PB-12 must use:

- separate directory card vs deal card patterns
- stronger filter/search state design

PB-13 must use:

- deal card priority rules
- badge discipline
- CTA hierarchy

## Success Criteria

The design system is working when:

- homepage modules no longer look like repeated white cards
- deal cards and browse cards are clearly different systems
- trust signals are visible before users need to hunt for them
- section order and section styling reinforce product intent
