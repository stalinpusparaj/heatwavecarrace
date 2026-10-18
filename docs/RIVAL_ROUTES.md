# RUNROAD — Rival Routes alpha

RUNROAD (tagline: Chase Home) is the new display name. Existing app IDs, storage keys, Git repository and hosted URL remain stable so saves/install updates continue working. A limited web search found no obvious exact racing-game match; this is not trademark clearance or evidence of popularity.

## Included

- Choose Rival Routes in the header, create a route or enter an HW1 code.
- A 75-second survival objective with standardized starter-car stats and no campaign credit or level rewards. Any of the five world appearances can be challenged without unlocking its campaign.
- Map and police spawning are seeded separately from visual randomness. Rendering quality does not change pursuit generation. Challenge mode disables frame-dependent hitstop.
- Export a JSON ghost after a run; send it to a friend yourself. They import it to see a translucent recorded vehicle. Ghosts do not collide or influence the simulation.
- Share challenge text with the browser share sheet/copy fallback, and export an original PNG result card.
- Bounded 10 Hz position samples (maximum 752); JSON imports limited to 120 KB and checked for version, code, numeric bounds and increasing timestamps. Ghost recordings are unverified local data; they do not qualify for ranked rewards.
- Android supports a system document picker for ghost imports/PNG and JSON exports through a bounded, exact-origin native message listener. No storage or network permission is added. iOS native document handling remains unimplemented/unverified.

Codes encode a route, not the ghost. Ghost files must be sent separately. There is no account, cloud storage, verified leaderboard, matchmaking or live cooperative session yet. The owner-private hosted site's audience is unchanged: friends need authorized site access or the Android build. No ads or billing are enabled.

## UI reference

The owner's local original.mp4 was sampled locally at eight-second intervals. The new HUD follows the observed layout principles: prominent top-left score, centered wanted stars, upper-right speed dial, segmented hull and a large green boost control. Existing original terrain/car assets remain. Both portrait and landscape layouts are supported; Android's activity permits rotation.

## Checks

Run `node tests/campaign.cjs`, `node tests/performance.cjs`, and `node tests/rivals.cjs`. Rival tests cover identical pursuit under Eco/High and unrelated visual RNG consumption, standardized car stats, no campaign progression changes, malformed ghosts, and restoring the campaign build. Browser QA should cover export/import across two separate tabs, result cards and portrait/landscape layouts. These are not real-device low-end benchmarks or cross-engine deterministic-replay certification.

## Next milestone

Authoritative result validation and invite/ghost retrieval service, followed by two-player private Convoy Escape. Keep the offline campaign independent, measure cost per completed match and perform real-device/network-loss testing before public live matchmaking or monetization.
