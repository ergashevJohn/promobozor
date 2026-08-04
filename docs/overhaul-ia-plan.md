# PromoBozor IA Overhaul Plan

Last updated: 2026-04-29

## Goal

PromoBozor'ni eski `Promokoduz` ko'rinishidan faqat rang va logo bilan emas, balki mahsulot hissi, sahifa ketma-ketligi va foydalanuvchi oqimi bo'yicha ham aniq ajratish.

Target perception:

- trusted savings platform
- useful deal discovery product
- less “coupon directory”, more “decision support for saving money”

## Current State Summary

Current homepage structure:

1. Hero
2. Featured promocodes
3. Last updated strip
4. SEO intro / why choose us
5. Popular stores
6. Popular categories
7. Popular brands
8. How it works
9. Popular category content blocks
10. Results / stats
11. Trust block
12. FAQ
13. Footer

Why this is still too close to the old site:

- section order is still very similar
- homepage still feels like a browsable coupon list first
- stores / categories / brands blocks still behave like parallel directories
- trust and verification signals exist, but they do not yet drive the narrative

## IA Shift

Old mental model:

- “search or browse a coupon catalog”

New mental model:

- “find the most useful, verified savings opportunity quickly”

New homepage priorities:

1. Discovery
2. Trust
3. Freshness
4. Decision support
5. Conversion
6. Secondary browse paths

## Proposed Homepage IA

### 1. Hero + Intent Router

Purpose:

- immediately explain what PromoBozor is
- let users choose how they want to save

Contents:

- strong value proposition
- search
- quick paths:
  - top stores
  - food delivery deals
  - bank offers
  - latest codes
  - best verified deals
- small freshness / verification proof row

### 2. Best Deals Right Now

Purpose:

- replace generic “featured cards” feeling with urgency and usefulness

Contents:

- curated top live offers
- tabs or chips by intent:
  - trending
  - newly verified
  - ending soon
  - biggest savings

### 3. Why Users Trust PromoBozor

Purpose:

- trust should come before long browse sections

Contents:

- verification method summary
- last checked logic
- update cadence
- real usage / save proof

### 4. Savings Paths

Purpose:

- split discovery into meaningful routes instead of equal-weight catalogs

Contents:

- save by store
- save by category
- save by brand
- save by promo type

### 5. Local Market Highlights

Purpose:

- differentiate from generic international coupon sites

Contents:

- Uzbekistan-first shopping and delivery brands
- local bank/payment savings
- seasonal / city-relevant modules

### 6. Editorial Guidance Block

Purpose:

- help users decide, not just browse

Contents:

- how to use promocodes
- how to verify a deal is worth using
- when link deals are better than code deals
- short educational cards

### 7. Deep Browse Layer

Purpose:

- keep browseability, but lower on page

Contents:

- stores
- categories
- brands

### 8. Social Proof / Outcome Layer

Purpose:

- end with confidence and conversion support

Contents:

- stats
- trust proofs
- FAQ
- final CTA

## Proposed Listing IA

### Promocodes Listing

Goal:

- feel like a decision surface, not a raw archive

Structure:

1. page intro with trust context
2. active filters / sort panel
3. quick chips for freshness / verification / popularity
4. primary results grid
5. helper module every few rows
6. related links / browse paths

### Stores Listing

Goal:

- become a brand-discovery directory with stronger utility

Structure:

1. store finder intro
2. top active stores
3. all stores
4. supporting copy about where users save most

### Categories Listing

Goal:

- act as a shopping intent map

Structure:

1. category overview
2. featured categories by current usefulness
3. all categories
4. related educational block

### Brands Listing

Goal:

- support curated offer discovery, not just logos

Structure:

1. featured brands by live value
2. browse all brands
3. supporting insights

## Proposed Entity IA

### Store Page

Primary question:

- “How can I save money at this store right now?”

Structure:

1. store hero with trust + counts
2. best live offers
3. how this store's deals usually work
4. related brands / related categories
5. store-specific FAQ

### Category Page

Primary question:

- “What are the best deals in this shopping area?”

Structure:

1. market overview intro
2. top offers in category
3. leading stores / brands in this category
4. category-specific tips
5. FAQ

### Brand Page

Primary question:

- “What useful offers exist around this brand?”

Structure:

1. brand hero
2. curated offers
3. related stores / contexts
4. short brand positioning copy
5. FAQ

### Promocode Detail Page

Primary question:

- “Can I trust and use this deal right now?”

Structure:

1. main offer + CTA
2. verification / freshness / usage proof
3. steps to use
4. conditions
5. related alternatives

## Design Consequences For Next Tasks

PB-09 should define:

- new surface hierarchy
- stronger section contrast
- less repetitive card treatment
- page-type-specific headers

PB-10 should implement:

- homepage section reorder
- at least 2 new differentiating modules
- stronger hero/search narrative

PB-11 / PB-12 / PB-13 should implement:

- differentiated listing templates
- differentiated entity templates
- rebuilt promo cards and CTA logic

## SEO Consequences For Next Tasks

PB-14 and PB-15 should reflect this IA shift:

- every page type should answer a different intent
- homepage should target broader savings + deal discovery intent
- entity pages should gain unique editorial intros
- FAQ and educational blocks should support search depth, not just filler content

## Implementation Order

Recommended order:

1. PB-09 Design System 2.0
2. PB-10 Homepage Redesign From Structure Up
3. PB-13 Promo Card & CTA System Rebuild
4. PB-11 Listing & Discovery UX Redesign
5. PB-12 Entity Page Template Differentiation
6. PB-14 SEO Architecture V2
7. PB-15 Content Depth & Editorial Layer
8. PB-16 Trust, Conversion & Proof Layer
9. PB-17 Visual Content & Asset Direction
10. PB-18 Performance, Accessibility & Technical UX Pass
11. PB-19 Measurement & Experiment Readiness

## Success Criteria

We should feel done with the overhaul direction when:

- homepage no longer reads like a recolored version of the old site
- section order clearly supports trust and discovery first
- listing and entity pages have distinct roles
- promo cards communicate confidence and usefulness faster
- SEO pages have stronger unique intent and deeper internal linking
