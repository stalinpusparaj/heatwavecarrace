# Rescue opening — implementation and validation

Three authored solo stories are separate from the 500-level campaign, with explicit replay and skip controls. New campaign saves enter One More Seat from the home launch button. Existing campaign progress stays untouched; returning drivers can access each story from the home card. These stories are unranked and disclose 55% damage reduction. First completion grants 150 campaign credits per story; replay grants no further story credits. Local best times and clean completions persist separately in runroad-opening-v1. Old campaign saves require no migration.

1. **One More Seat:** approach Jun's visible amber rescue zone. Speed drops automatically nearby. Stay within 75 world units for 1.6 seconds; leaving resets pickup progress. Police are absent before pickup. After pickup, follow the direction indicator back to the garage. Passenger status and dialogue acknowledge Jun's rescue. Supplies milestone persists.
2. **The Road Home:** choose the left scenic route or right shortcut. The scenic route adds a wide western waypoint; the shortcut passes between two physical obstacle posts. Follow the north passage and return to the garage. First Light milestone persists. Nitro is optional; no boost-timing failure gate.
3. **Keep the Lights On:** collect two authored supply caches, then return home. Workbench milestone persists. This is a solo supply-return mission, explicitly not fake multiplayer.

Each mission has a 150-second limit, reduced damage, bounded pursuit (two or three cops), the existing touch controls, navigation, pause behavior and a free retry. First rescue uses automatic slowdown, not a new precision brake control. Existing Nitro and Perfect Nitro remain available. System reduced-motion preference suppresses camera shake in all modes. No video, network asset, analytics SDK or framework added.

Live friend rescue reuses existing server authority: within 95 units, hold Rescue for two seconds; interruption resets progress. A rescued driver receives 45 hull and three seconds protection. Only one shared rescue is available. Both living connected players must reach the unlocked exit. HUD navigation now prioritizes a stranded partner over supplies and shows hold progress. A real stalled-to-recovered snapshot triggers contextual feedback; no bot or ghost is described as a live friend. Existing ten-second reconnect grace and both-stalled loss rules are retained. No new recurring rescue rewards or server rule changes.

## Measurement

`Intro.debugEvents(true)` enables a bounded development-only in-memory event list (100 maximum). Call again to read; `false` disables collection. Events include started, pickup_interrupted, rescued, checkpoint, route, completed and failed. No telemetry leaves the device. There is no claim of measured retention or a production analytics funnel. Use observed tutorial completion, pickup interruptions, voluntary retries, route choices and successful friend joins as a beta baseline before choosing targets.

## Tests and limits

`node tests/intro.cjs` verifies pickup interruption, no pursuit before rescue, route selection, all three endings, once-only first-clear credits, replay, local persistence and mode exit. Campaign integration includes the new module and preserves original campaign/quality tests. Convoy simulation adds interrupted-hold and protected-recovery coverage alongside existing authoritative rescue, reconnect and win tests.

Browser testing is a separate manual check; simulated test positioning is not claimed as a human playthrough. Physical low-end device, thermal/battery, fresh-player comprehension, complete two-person human playthrough, cloud save and retention measurements remain outstanding. These stories are a playable initial slice, not the entire proposed 20-level onboarding campaign. There are no collectible human portraits, voiced cutscenes or production analytics. Garage restoration is currently a persistent milestone indicator and result text, not a new interactive 3D garage.
