# Cinematic artwork

Created in Google Flow through Chrome on 18 October 2026, using the signed-in user's existing Nano Banana 2.1 image generator, one output per prompt. The interface showed 0 credits for this generation configuration. No subscription was changed.

Flow project: https://flow.google.com/project/305b53ea-8920-48d9-bbee-3c9af2d8b7f0

- `dist/assets/hero.webp`: cinematic tangerine sports coupe drifting through a sunset desert, negative space on the left for interface typography.
- `dist/assets/cars.webp`: five equally spaced car portraits: orange sports coupe, green rally SUV, yellow drift coupe, violet street supercar, white hypercar.
- `dist/assets/worlds.webp`: five world panels: sunset desert, icy alpine pass, neon harbor, volcanic badlands, jungle ruins.

Original downloaded JPGs are retained in `art-source/`. The deployed menu assets are compressed WebP versions. CSS selects the appropriate panel from each shared atlas. Menu WebP payload is about 339 KiB. Artwork is loaded for menus; gameplay uses the lightweight procedural canvas renderer and does not stream or generate media.

## Realistic gameplay assets

The same Google Flow project generated three additional atlases for the gameplay camera: seven orthographic vehicle roofs (five player cars and two police variants), five realistic collision obstacles, and five flat terrain materials. These are generated depictions inspired by real automotive designs, not licensed manufacturer models or 3D meshes.

Original downloads remain in `art-source/`. `scripts/prepare_gameplay_assets.py` keys the green background, extracts the sprite regions, and packs small runtime atlases. It also extracts terrain tiles. Run it with Pillow to reproduce `vehicles.webp`, `props.webp`, and `terrain.jpg`. Source images and their provenance remain available; presentation-only marks outside the sprite regions are not part of the game sprites.
