# Moss Quilt — Project Context

**Last Updated:** 2026-03-02

## What This Is
A crowdsourced photo gallery where visitors upload moss photos that fill individual pieces of traditional quilt blocks. The completed digital quilt will inspire a real physical quilt. Built to share with coworkers — fun, delightful, approachable.

## Tech Stack
- HTML, CSS, JavaScript (static site)
- Supabase (photo storage) — US West Oregon region
- Vercel (hosting, connected to GitHub)
- GitHub repo: moss-quilt

## Design System
- **Primary color:** #B8E600 (electric yellow-green, slightly muted)
- **Lines:** 0.5px black outlines between quilt pieces
- **Font:** Neue Haas Grotesk Text Pro 55 — used throughout entire site
- **Texture:** Medium grain overlay with 10% yellow-green tint across full page
- **Empty pieces:** Filled with #B8E600
- **Layout:** Truly edge to edge, full page, no margins

## Header
- Floats over the quilt, no background behind it
- 20px padding
- Black text
- Left: "Moss Quilt"
- Center: "Walk slow, touch moss, upload a photo"
- Right: "+" opens moss facts popup
- Popup: #B8E600 background, black type, lorem ipsum for now, closes on click outside or escape key

## The Quilt
2x3 grid (2 columns, 3 rows) of 6 traditional quilt blocks, all same size:

| Position | Block |
|----------|-------|
| Top left | Log Cabin |
| Top right | Ohio Star |
| Middle left | Flying Geese |
| Middle right | Nine Patch |
| Bottom left | Chimneys and Cornerstones |
| Bottom right | Courthouse Steps |

Each block is built from individual geometric pieces true to that traditional pattern. Every piece is its own photo upload slot, labeled in Supabase as block-[number]-piece-[number].

## Upload Behavior
- Desktop: subtle upload arrow appears on hover over each piece
- Mobile: faint CSS pulse animation on pieces to show they are tappable; tap to upload
- File size limit: 5MB
- After upload: photo fades in smoothly using object-fit cover
- No confirmation message after upload
- Photos stored in Supabase storage

## What's Built
- ✅ Edge-to-edge 2x3 quilt grid with 6 blocks in the specified order
- ✅ Floating header with centered tagline + “+” moss facts popup (closes on outside click / escape)
- ✅ Piece-level upload UI (desktop hover arrow, mobile pulse, tap/click to upload)
- ✅ Supabase Storage wiring (per-piece key `block-[number]-piece-[number]`, 5MB limit, upsert, smooth fade-in)
- ✅ Grain texture + 10% yellow-green tint overlay across the whole page

## Notes / Patterns
- Quilt pieces are rendered as SVG polygons (per block) so outlines stay at 0.5px and images can be clipped cleanly.
- Storage path convention: `pieces/block-[n]-piece-[m]` in bucket `moss-quilt` (configurable in `app.js`).

## Current Focus
Initial build — get the quilt layout rendering with #B8E600 empty state and upload working

## Browser Tab
Moss Quilt

