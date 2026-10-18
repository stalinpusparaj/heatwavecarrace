# Heatwave — World Tour

A buildless mobile web arcade chase game. Serve `dist/` with any static HTTP server:

```sh
python3 -m http.server 4173 --directory dist
```

Open http://localhost:4173. On a phone, drag anywhere in the arena to steer the floating joystick. The car accelerates automatically. Desktop uses WASD or arrow keys. Escape/Space pauses.

## Campaign

Five themed worlds each contain 100 seeded arena layouts with scaling objectives: survival, police wrecks, salvage collection, checkpoint routes, and a finale every tenth level. Worlds unlock after clearing level 20 of the previous world. Frostbite has reduced steering grip; Ember has damaging heat vents. Objective markers include direction/distance guidance.

Earn credits for clears and attempts. First clears pay full rewards; replays pay reduced rewards. Stars depend on completion and remaining hull. Five cars have different base speed, steering, and hull. Each car has five tiers of engine, handling, and armor upgrades. No paid purchases.

Campaign credits, unlocked cars, upgrades, completed levels, and best stars persist in localStorage under `heatwave-campaign-v1`. Progress is browser-local; it does not sync across devices or survive clearing site data.

## Rendering and verification

Canvas 2D; capped pixel ratio; adaptive resolution; fixed 60 Hz simulation with bounded catch-up; capped active police; 110 pooled particles; viewport culling for scenery; objective HUD updates throttled to about 7 Hz. Background tabs pause automatically. The 60 FPS target requires physical-device testing.

```sh
node --check dist/game.js
node --check dist/campaign.js
node tests/campaign.cjs
```

Tests validate all 500 layout definitions and safe spawns, all five objective completion conditions, rewards/stars, reward duplication protection, purchases and upgrades, insufficient funds, upgrade caps, world unlock progress, game over, and saved progression using an isolated browser mock. Browser QA covers garage purchasing, reload persistence, and portrait layout. Level layouts are generated from fixed seeds; they are not 500 individually hand-authored maps.

## Cinematic edition

Google Flow artwork now supplies the main menu, five vehicle portraits, and five world backdrops. See `docs/ART.md` for provenance. Shared image atlases keep the total artwork payload near 505 KiB. Menu screens skip canvas painting.

Gameplay adds nitro (tap the button or press Shift/N), charged by drifting, near misses, and wrecks. Initial charge allows one boost; boosts have a cooldown and require 40 charge. Wreck/near-miss chains multiply score up to ×5 and expire after five seconds or on a damaging hit. Drift trails reuse 140 marks. Skilled driving adds a capped credit bonus to the result. No entry fee, paid boost, or energy timer is introduced.

## Realistic chase renderer

The chase now uses Google Flow overhead vehicle sprites, keyed obstacle sprites, and terrain textures for all five worlds. A single 1536×1536 environment canvas caches road surfaces, lane markings, guardrails, vegetation, obstacles, and their shadows. Only one arena cache is retained. Realistic sprites replace the original block cars; fallback cars still render if image loading fails. Night worlds add headlight cones. Wreck silhouettes, smoke, flashes, dust, nitro exhaust, speed streaks, and a speed-responsive camera complete the chase view. This remains a lightweight 2D overhead renderer, not a 3D engine.

Additional checks:

```sh
node --check dist/renderer.js
```

For the browser renderer test, serve the repository root and open `/tests/renderer.html`. Its visible PASS status confirms all five world caches render and the seven sprite assets load. The test does not alter campaign saves. Physical-device thermal and battery testing remains outstanding.

## Adaptive mobile optimization

Use the **Auto / Eco / Balanced / High** graphics selector in the top-right corner. Auto adapts detail to sustained frame performance; Eco caps rendering at 30 FPS, while Balanced/High target 60. Canvas pixel budgets prevent excessive GPU work on high-DPI and high-refresh phones. Menus release the scene buffers, and inactive screens stop the animation loop. Physics and difficulty remain identical across quality modes. Fonts are bundled locally, and menu images use smaller WebP assets.

Run `node tests/performance.cjs` for profile/adaptation tests, alongside `node tests/campaign.cjs` for gameplay and frame-cap checks. See `docs/PERFORMANCE.md` for budgets, measured file sizes, and verification limits.

## Native KMP mobile app

The `mobile/` project wraps the bundled game in a native Android WebView, with shared Kotlin Multiplatform shell logic and an iOS WKWebView host scaffold. Android runs offline without Chrome, a local web server, or hosted-site sign-in. See [mobile/README.md](mobile/README.md) for build, install, lifecycle, storage, and iOS verification details.
