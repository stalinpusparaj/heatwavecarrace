# 500-level campaign audit

19 October 2026. All 500 existing levels were simulated inside Android emulator emulator-5554 using the bundled game engine and a scripted driver. Completion is recorded in campaign-emulator-baseline.json and the saved emulator results screenshot. This was accelerated simulation, not 500 complete interactive rendered playthroughs, a GPU benchmark or evidence of human retention.

## Method

DEBUG → SIMULATE 500 LEVELS runs physics, police, objectives, damage and Nitro through the actual update function. It uses the starter car without upgrades, one pursuit seed per level and a simple goal-seeking/obstacle-avoidance driver. It never teleports to objectives, grants invulnerability or forces victory. Each attempt is limited to 150 simulated seconds. Work is split into short callbacks so the app remains responsive. No per-tick drawing is performed; the separate rendering comparison remains available.

Campaign reward settlement and best-score writes are disabled while auditing. Campaign data, selected mission and RNG are restored at completion/cancellation. Audit output is local. No invitation, email, purchase or server contribution is generated. This tool must not be treated as authoritative ranking or paid entitlement state.

## Emulator baseline

| World | Wins | Busts | Timeouts |
|---|---:|---:|---:|
| Desert County | 71 | 29 | 0 |
| Frostbite Pass | 61 | 39 | 0 |
| Neon Harbor | 57 | 43 | 0 |
| Ember Badlands | 44 | 56 | 0 |
| Verdant Ruins | 44 | 56 | 0 |

277 wins / 223 busts / 500 attempted levels. No invalid-state stop occurred. UI accessibility truncates the per-level report at 10,000 characters; the saved emulator JSON contains complete summary counts, not all rows. Full JSON remains in the on-device results textarea. The independent Node audit records all 500 per-level results in campaign-playthrough-audit.json. Counts differ between environments and quality profiles; they must not be represented as a controlled cross-device performance comparison.

## Findings and limited tuning

The separate baseline Node driver won 92/100 wreck missions but 20/125 survival and 6/50 boss missions. Later worlds also reduced wins. These are bot limitations and a starter-car baseline, not human difficulty estimates; later progression upgrades were deliberately absent.

Desert level 10 initially required six wrecks plus 24 seconds survival. The baseline driver failed at 28.55 seconds. A provisional target of four produced completion at 27 seconds in the same headless run. Only this introductory boss target was retained. Increasing early wreck targets from three to four barely changed their duration and was discarded. The final headless audit has 278 wins, no timeouts and no invalid states. It is not the exact build used for the emulator baseline; the boss change was subsequently validated headlessly and bundled in the updated APK.

## Product decisions

Do not globally reduce difficulty based on a single bot. Next validate the introductory boss with new players and an appropriately upgraded-car cohort. Keep authored rescue stories prominent, then add distinct world hazards/roadblock decisions rather than more repeated objective counts. Short wreck runs and survival/boss pressure deserve direct observation. A human beta must measure understanding, frustration, voluntary retries and whether rescuing a friend is memorable. Automation cannot establish fun, addictive behavior, virality or readiness for paid acquisition.

Emulator QA also exposed and repaired an accidental HTML document in progression.css, which caused low-contrast story buttons and overlapping debug controls. Corrected styles were verified on the emulator before the 500-level baseline capture.
