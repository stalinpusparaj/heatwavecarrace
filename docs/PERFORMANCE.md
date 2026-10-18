# Mobile performance profiles

Auto uses conservative CPU/memory/save-data hints, then observes frame intervals and rendering work during active play. It reduces quality after sustained overload and restores detail only after prolonged headroom. Manual overrides persist in browser storage.

| Mode | Render cap | Canvas pixel budget | Terrain cache | Particles | Skid marks |
|---|---:|---:|---:|---:|---:|
| Eco | 30 FPS | 600,000 | 768 × 768 | 32 | 40 |
| Balanced | 60 FPS | 1,200,000 | 1024 × 1024 | 64 | 80 |
| High | 60 FPS | 2,000,000 | 1536 × 1536 | 110 | 140 |

Canvas budgets apply regardless of high device pixel ratio, including large/high-refresh displays. Rendering is capped even when requestAnimationFrame runs at 90/120 Hz. Physics remains fixed at 60 Hz with bounded catch-up in every profile; AI counts, damage, upgrades, and mission difficulty are unchanged.

Eco's terrain backing store is 2.25 MiB instead of the previous 9 MiB (75% less). Postprocessing and persistent wreck rendering are disabled in Eco. Balanced/High use a half-resolution vignette. Decorative terrain work scales with detail. Menus release both the gameplay canvas backing store and terrain/vignette caches. Paused, background, menu, and game-over states do not continually request animation frames; audio is silenced on pause/end.

Runtime assets total 710,208 bytes, including 81,344 bytes of local Latin-subset fonts. Menu artwork dropped from 517,009 to 346,876 bytes (about 33%). No Google Fonts CSS/font fetches are needed. Original artwork lives outside the deployed static directory.

Verification: syntax checks; all 500 campaign layouts; purchase/reward/nitro tests; simulated hardware tiers; canvas pixel-budget tests at phone, desktop, and 4K sizes; auto downgrade/recovery hysteresis; saved/manual mode tests; 30/60 FPS paint-cap tests with equal simulation elapsed time. Chrome QA exercised Eco/High switching, observed a roughly 29–30 FPS Eco run, and verified a 1×1 idle gameplay canvas.

These are resource limits and targets, not guaranteed frame rates on every phone. Real low-end Android/iOS testing, thermal soak, power profiling, and browser-specific GPU testing remain outstanding. The attached Android phone was previously blocked by device parental controls, so these checks do not constitute physical-device validation.
