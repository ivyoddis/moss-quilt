# Moss Quilt — Decision Log

## Why Supabase for photo storage?
Free tier is generous, US West Oregon region is closest to our users in the PNW, and Cursor can connect to it directly via MCP so we never have to leave the editor to manage uploads. Chose storage (not a database) because we only need to store photos, not complex relational data yet.

## Why static HTML/CSS/JS and not Next.js or React?
This is a first vibe coding project. Keeping it simple means fewer things can go wrong. A static site is enough to handle a photo gallery with uploads via Supabase. Can migrate to Next.js later if needed.

## Why 6 quilt blocks in a 2x3 grid?
Chosen for visual balance and variety. The six blocks (Log Cabin, Ohio Star, Flying Geese, Nine Patch, Chimneys and Cornerstones, Courthouse Steps) represent a mix of geometric styles — stars, triangles, strips — which makes the overall quilt visually interesting.

## Why #B8E600 for the empty state?
Electric yellow-green was chosen to make the empty quilt feel graphic and intentional rather than blank. Slightly muted from pure neon (#CDFF00) to feel more connected to nature and moss without losing the visual punch. The color also ties the moss facts popup together with the quilt.

## Why 0.5px lines?
Ultra thin lines make the quilt feel delicate and drawn, not heavy or grid-like. Keeps the focus on the photos and the quilt geometry rather than the borders.

## Why Neue Haas Grotesk Text Pro 55?
Clean, minimal, Swiss. Doesn't compete with the quilt. Feels considered without being decorative.

## Why no header background?
The quilt should feel full page and immersive. A header background would break the edge-to-edge feeling. Black text with a subtle text shadow handles legibility over photos.

## Why lorem ipsum for moss facts popup?
Copy can be decided and refined later without blocking the build. Structure first, content second.

## Why no photo moderation for now?
Audience is coworkers — trusted group, low risk. Can add an approval flow later if the site opens up to strangers.

## Why no scroll transition on header text color?
Kept simple for a first project. Black text works well against the yellow-green empty state. Can add a white transition on scroll in a future iteration once core functionality is solid.

## Why individual pieces as upload slots rather than whole blocks?
Makes the quilt feel genuinely handmade and collaborative — each tiny piece contributed by a different person. More interesting visually and conceptually than one photo per block.

