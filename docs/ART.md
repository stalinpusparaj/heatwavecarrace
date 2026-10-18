# Cinematic artwork

Created in Google Flow through Chrome on 18 October 2026, using the signed-in user's existing Nano Banana 2.1 image generator, one output per prompt. The interface showed 0 credits for this generation configuration. No subscription was changed.

Flow project: https://flow.google.com/project/305b53ea-8920-48d9-bbee-3c9af2d8b7f0

- `dist/assets/hero.jpg`: cinematic tangerine sports coupe drifting through a sunset desert, negative space on the left for interface typography.
- `dist/assets/cars.jpg`: five equally spaced car portraits: orange sports coupe, green rally SUV, yellow drift coupe, violet street supercar, white hypercar.
- `dist/assets/worlds.jpg`: five world panels: sunset desert, icy alpine pass, neon harbor, volcanic badlands, jungle ruins.

Original downloaded JPGs are retained without pixel edits. CSS selects the appropriate panel from each shared atlas. Total source image payload is approximately 505 KiB. Artwork is loaded for menus; gameplay uses the lightweight procedural canvas renderer and does not stream or generate media.
