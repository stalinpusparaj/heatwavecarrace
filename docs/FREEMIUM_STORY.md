# Heatwave: The Road Home — freemium and story proposal

Status: product proposal, not a live monetization change. Audience and business-model preferences are awaiting the owner's answer. Existing free gameplay stays available; no purchases or ad SDKs are activated by this document.

## Product promise

A fast, beautiful getaway game about a mechanic trying to bring her family home. Players return for better driving, a garage they care about, and the next radio message. The story and rewards should make a good chase matter; purchases should express personality rather than repair deliberately frustrating difficulty.

Working title: **Heatwave: The Road Home**. Brand line: **Every escape brings you closer.**

## Recommended commercial direction

For a teen/adult audience, start with a free campaign, optional rewarded ads, and permanent cosmetic purchases. Keeping challenge levels free makes it easier for friends to play the same route. Treat all prices below as product-test hypotheses; actual localized prices must come from each store's configured catalog.

| Offer | Contents | Initial price hypothesis |
|---|---|---|
| Free game | All five worlds, all 500 challenge levels, complete core story, every performance-affecting car/upgrade earnable | Free |
| Road Home supporter pack | Three distinct paint/wrap designs, a garage decoration set, cosmetic license plate frame, supporter badge | Test ₹199–₹399, region-localized |
| Individual livery | One clearly previewed, permanent visual design | Test ₹79–₹149 |
| Earned cosmetic rewards | Chapter memorabilia, garage decorations, and a selection of liveries | Earn by play |
| Optional rewarded ad | Player chooses to double the earned credit reward after a run; one reward per run, issued only after the native SDK's earned-reward callback | Free, opt-in |

No subscription is needed for the first release. Do not sell handling, speed, hull, ranked advantages, random paid crates, or access to a satisfying ending. Avoid a misleading “remove ads” offer when there are no forced ads. The supporter pack's contents should be visible before purchase, and owned content must remain restorable.

If the owner prefers a premium-unlock model instead: offer a substantial free opening chapter, sell the remaining story campaign as one permanent unlock, and keep an equivalent free daily/friend challenge mode. Preserve already-earned access for existing players; never silently retroactively lock their progress. Validate this alternative against the free-campaign model before committing to 500 levels of premium content.

If families/children are the audience, revisit ads, consent, purchase gates, and social features before integration. Do not apply the teen/adult setup by default.

## The emotional story

**Mara** left her family's roadside garage after an argument with her father. Years later, her younger brother **Jun** calls: the garage is being seized, their father has disappeared, and a private utility company is blaming him for a series of blackouts. Mara returns in his unfinished orange car. Inside its dashboard is a damaged recorder and a route marked across five regions.

The company has put out a false alert on the car. Mara cannot fight the pursuers; she must outdrive them, collect evidence, and get people to safety. The vehicle gradually becomes a family keepsake rather than a disposable upgrade icon. Jun stays on the radio, first sounding like a mission dispatcher, later revealing how much he missed her.

The goal is concrete: find their father, expose the cover-up, and reopen the garage as a refuge for travelers. The story should acknowledge the danger without showing graphic violence or treating civilian harm as a reward. Pursuit units are disabled in exaggerated arcade crashes.

### Chapter arc

| World | Dramatic purpose | Existing mechanic used | Emotional payoff |
|---|---|---|---|
| Desert County | Return to the garage and follow the recorder's first lead | Short survival/tutorial, salvage pickups | Find the key tag Mara threw away years ago |
| Frostbite Pass | Reach stranded workers carrying a missing record | Checkpoints, route missions, controlled drifting | Jun admits he kept Mara's room ready |
| Neon Harbor | Recover shipping records proving the blackouts were engineered | Salvage and pursuit-baiting missions | Learn their father was protecting workers, not abandoning the family |
| Ember Badlands | Escort an evacuation through the company's industrial zone | Route/survival finales, heat hazards | Mara chooses to help a stranded pursuer; a choice of character rather than a paid advantage |
| Verdant Ruins | Reach an abandoned relay station and broadcast the evidence | Combined checkpoint and survival finale | The family reunites; the garage sign lights again |

The current 100 levels per world are challenge routes, not 100 distinct story chapters. Use approximately ten short story beats per world, attached to meaningful milestones, plus optional reactive radio lines. The full 50-beat script should follow a tested opening rather than being written and produced all at once.

### Story delivery and memory budget

- Skippable 10–20 second radio/text scenes at chapter starts and finales; after a failure, retry immediately without replaying dialogue.
- A short line, a portrait, and the existing world art can do more than a heavy video. Captions are the baseline; voice packs can be optional later.
- Reuse character portraits; load chapter art on demand. Keep the Eco profile and offline base game viable.
- Optional responses express personality, not hidden purchases or a “correct” paid ending.
- Every ten levels, restore a visible part of the garage. Decorations are emotional milestones and an appropriate place for optional cosmetics.
- No dialogue should shame a player for refusing an ad or purchase.

## A stronger opening: playable vertical slice

Build and playtest the first 20 levels before extending the script to every world.

1. **First 30 seconds:** Mara pulls away from the closed garage; teach steering, one readable police unit, first safe near miss. Jun's first line is short and interrupts no driving.
2. **Level 1 clear:** reveal the family car's key tag and a three-line radio exchange. Reward an earned stripe design so players understand cosmetics without a shop pitch.
3. **Level 3:** salvage crates become labeled recorder fragments; no changes to collision geometry or performance.
4. **Level 5:** show the garage restoration screen and Jun's workbench, with a clear next goal.
5. **Level 10:** a pursuit finale recovers the first recording. A brief flashback gives the player a reason to care about the next region.
6. **Level 20:** open Frostbite Pass, show a real payoff, and introduce the optional supporter offer only after the player has experienced that value. No fake discount countdown.

The companion `docs/story/opening.json` is a proposed data format and first-scene script. It is not yet connected to the runtime.

## Growth through shareable play

### “Can you make this escape?”

After a notable run, offer a share card: car, world, actual score, remaining hull, and a challenge identifier. Sharing opens the native share sheet only when the player taps; no automatic posting or contact access.

A challenge identifier represents the arena seed, rules version, car preset, and objective. A friend can enter that code in the free game. Both use a standardized performance preset; purchased cosmetics never confer a scoring advantage. The current procedural map seed is not enough by itself: pursuit/spawn randomness must also become deterministic for a fair shared challenge.

Start with generated still cards. Optional 5–8 second replay clips can come later, using a bounded input/state buffer rather than continuous screen recording. Replay/recording is disabled in Eco by default.

Other useful hooks:

- A daily community route with one shared seed; keep past routes playable rather than punishing a missed day.
- Earned “2% hull escape” or “five-car pileup” cards based on actual events.
- Community driving achievements that unlock visual garage items, without requiring invites.
- Contextual store-review requests after a genuine successful session, never rewards for a particular rating.

Do not build referral rewards until there is a real share flow, abuse protection, and evidence that players want to invite friends. Avoid claims that the game is already viral.

## Native implementation plan

### Phase 1 — prove the experience

Add the opening story runner, skip/caption controls, garage restoration milestones, result-card export, and a challenge-code prototype. Keep all existing gameplay access and progress. Test on lower-end Android hardware as well as the emulator. No real money or ad networking required.

### Phase 2 — real freemium infrastructure

- Define stable cosmetic IDs and supporter-pack contents; configure real product IDs in Play Console and App Store Connect.
- Implement native Google Play Billing and StoreKit purchases/restoration, or evaluate a cross-platform purchase service. The shared KMP layer models entitlements and purchase state; platform SDKs execute purchases.
- Pass only structured purchase requests from the trusted bundled WebView through an origin-restricted native message channel. JavaScript/localStorage must not be able to grant a paid entitlement or declare an ad completed.
- Apply a rewarded-ad credit bonus only from the SDK's earned-reward callback; make reward IDs idempotent. If no ad is available or the player cancels, keep their normal run reward and allow immediate continuation.
- Configure consent/audience behavior for the selected release audience before enabling ad requests.
- Keep the base game offline. Already-validated permanent cosmetic ownership should work offline; purchase/restore/ad actions need network access and clear status messages.
- Validate pending, canceled, duplicate, refunded/revoked, failed, and restored purchases in store sandboxes before production release. Account for the currently unverified iOS build first.

### Phase 3 — grow from evidence

Launch a small audience test; review first-session completion, next-day/next-week return rates, story skips, repeat runs, voluntary ad use, purchase conversion, refunds, crash/ANR rate, and performance by quality tier. Establish a baseline and predeclare experiments rather than inventing success numbers.

Then decide whether to invest in voice acting, more authored routes, replays, localization, and additional cosmetic packs. A conversion increase that comes with worse retention or frustration is not a win.

## What to measure

| Question | Useful measure |
|---|---|
| Is the chase satisfying? | Voluntary second run, retries after a fair loss, first clean drift/near miss |
| Does the story matter? | Chapter progression, optional dialogue engagement, qualitative recall of Mara/Jun |
| Are invitations useful? | Share-sheet opens, completed shares where observable, challenge opens, friend challenge completions |
| Is freemium fair and viable? | Purchase conversion, net revenue per active player, voluntary ad completion, refund rate, retention by exposure |
| Does it stay lightweight? | First-play latency, frame time, memory, crash/ANR rate, offline startup, thermal behavior |

Analytics should use a minimal documented event schema. Do not collect message recipients, contact lists, dialogue text entered by players, or advertising identifiers for the core game. Multiplayer is now part of the proposed roadmap below; its servers, score integrity and social features remain unimplemented.

## Store references checked on 18 October 2026

- Google Play's payments policy generally requires Play Billing for digital goods in Play-distributed apps, subject to the policy's exceptions and regional programs: https://support.google.com/googleplay/android-developer/answer/9858738
- Apple requires a restore mechanism for restorable in-app purchases: https://developer.apple.com/in-app-purchase/
- Apple's sandbox setup guidance: https://developer.apple.com/help/app-review/before-submitting-for-review/configure-in-app-purchases/
- AdMob rewarded ads are opt-in; reward granting is tied to the native earned-reward callback: https://admob.google.com/home/resources/rewarded-ads-win-for-everyone/ and https://developers.google.com/admob/android/rewarded

The implementation must check the applicable store, territory, and audience rules at release. No claim of awards, virality, or guaranteed revenue is made by this plan.

## Multiplayer and competitor research update — 18 October 2026

See [the racing market study and multiplayer decision](research/RACING_MULTIPLAYER_MONETIZATION.md) for evidence, commercial-model comparison, operating costs and acceptance gates. The recommendation remains provisional until audience choice and product tests. No subscriptions or multiplayer servers are activated.

- **Rival Routes first:** asynchronous friend challenges with recorded ghosts, standardized stats and full gameplay seeds; label recorded opponents clearly. This provides social play without requiring friends online together.
- **Convoy Escape next:** real two-player private cooperative missions. Recover supplies, draw pursuit for a friend and reach the exit together. One limited earned rescue creates a memorable comeback; no paid match advantage.
- **Crews later:** small groups restore a community garage, followed by public matchmaking/four-player modes only when population, mobile performance and operating costs justify them.
- **Commercial order:** free friend access + permanent cosmetics + optional rewarded ads; test a separately purchased cosmetic pass only after sustainable content production. Defer auto-renewing subscriptions. A permanent campaign unlock remains an alternative to test, not an additional launch paywall.
- **Story connection:** online allies belong to the roadside network helping Mara and Jun bring people home. Solo story and the ending remain available offline; online missions add shared memories and earned mementos.

The research includes CSR2, Asphalt, F1 Clash, Beach Buggy Racing 2, GRID Autosport, historical Mario Kart Tour and Horizon Chase 2/Apple Arcade. It distinguishes verified publisher features from recommendations and avoids claiming an unavailable current worldwide revenue ranking. Nintendo confirms Mario Kart Tour ended service in September 2026, so its subscription model is a historical reference.
