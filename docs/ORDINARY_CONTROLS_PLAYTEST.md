# Ordinary-controls playtest

19 October 2026, 390×844 browser viewport, Eco profile. Used the visible menu, story brief, arrow-key presses, steering drags, brake-area input and pause/retry UI. No teleports, modified player state, forced completion or audit driver were used. This is an agent UI playtest, not a study with human participants. Tool round-trip delays and short synthesized drags limit conclusions about continuous thumb control and reaction time.

## Observations

- Completed One More Seat through normal movement and steering; result showed Jun safe, clean completion and the existing local best. Pickup happened quickly enough that its emotional beat was easy to miss.
- Attempted The Road Home and failed before choosing a route. The scenic/shortcut world markers could be outside the viewport, while the HUD had no direction indicator during that phase. Patrol pressure began before the route was found.
- Auto acceleration gave no explicit way to slow down for navigation/pickups. A brake is more understandable than relying solely on automatic zone slowdown.
- Small-screen wanted stars crowded the sound/action area. A stylesheet overwrite during implementation also surfaced during retest; restored it and added tests/assets.cjs to prevent HTML/JS accidentally entering CSS.

## Changes and verification

- Added HOLD BRAKE (touch) / B (keyboard) to solo modes. Releasing touch, cancelling a pointer, resetting or pausing releases the held control. Rival Routes and live Convoy keep their original rules; the solo brake is disabled/hidden there.
- After Jun boards, a two-second departure pause and persistent onboard status mark the transition. The car decelerates using existing physics; no transport/teleport occurs.
- Scenic route guidance appears before route choice, with distance and a clear explanation that the shortcut lies east. New patrols wait until route selection. Existing boundary/obstacle damage remains; this is not invulnerability.
- Retried the route scene and verified the arrow, distance, brake placement and pause behavior on the phone-size UI. Did not complete the full second mission after these changes; no claim is made that its entire flow is manually validated.
- Tests cover touch/keyboard brake release and competitive isolation, route-choice protection/guidance, intro state flow, all existing campaign/Rival checks, rescue gating and CSS integrity. Retention, willingness to replay, thermal performance and human motor-control comfort remain unmeasured.

The intended result is clearer control and a more readable rescue payoff. These changes do not establish that the game is addictive, commercially ready or likely to retain players. The next evidence should come from observing new players without coaching.

## Follow-up Android touch session

Installed the debug APK and used sustained Android touch swipes (no bot/audit driver). The Road Home advanced through route selection and the north passage to its garage-return phase. Repeated steering corrections did not complete the final homeward leg; collisions and loss of orientation remained visible. Back/pause was used between observations. This is not claimed as a complete second-mission win. Tool delays mean the attempt is not a measure of human reaction speed.

Changes prompted by this session:
- Small 88×88 route map: player heading, actual obstacle locations and current destination; updates at HUD cadence, disabled in competitive modes.
- Campaign failures restart directly instead of repeating the dispatch text.
- Result gives a phase-specific retry hint or a cleaner-hull/time target, plus a named preview of the next rescue.
- Successful rescue times are compared only within a versioned mission/car/upgrade key; at most 500 best-time entries are kept. No leaderboard or extra currency is awarded.
- District progress counts unique completed rescue homecomings, not legacy stars or repeated replays. Old saves start this new rescue count at zero.
- Successful campaign runs offer a direct replay button. Results scroll on small screens.

Integration tests verify slower replays do not overwrite a best, different builds have separate records, repeat wins do not inflate district counts and failed retries skip the briefing. Map placement was checked on a phone-size browser; its initial inherited canvas inset overlapped the score and was corrected. These changes are candidate improvements for clarity and voluntary replay, not evidence of increased retention or virality.
