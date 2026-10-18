# Heatwave — racing market research and multiplayer decision

Research date: 18 October 2026. Status: proposal, not implemented. Read with [the story/freemium proposal](../FREEMIUM_STORY.md).

## Decision in brief

Recommend free entry, free friend competition, permanent cosmetic purchases and optional post-run rewarded ads. Introduce asynchronous friend challenges first, then an actual two-player live cooperative escape. Consider a separately purchased cosmetic season pass only after retention and content-production tests. Do not start with an automatically renewing subscription or require payment to join friends.

This is a hypothesis for Heatwave, not proof that copying a large publisher's business model will reproduce its revenue. Our advantage should be a lightweight game about getting people home, where a friend can become part of a memorable escape.

## Evidence quality and commercial scope

“Top paying” is interpreted as commercially successful/high-grossing racing games. Public data does not establish a complete current worldwide revenue ranking across stores, ads, PC/console and direct sales. We have not accessed a paid market-intelligence export or publisher profit statements. This report therefore compares a commercial reference cohort and clearly separates financial evidence from feature evidence.

The strongest publisher financial evidence found: Zynga reports the **CSR franchise**, not CSR2 alone, surpassed **$1 billion in lifetime player spending**, with over **180 million lifetime players**. This is cumulative spending, not annual revenue, net revenue or profit. It cannot establish the incremental revenue caused by crews, multiplayer or a particular offer. [Zynga milestone](https://www.zynga.com/blog/a-billion-dollar-ride-celebrating-csrs-franchise-milestone/).

For a dated external cross-check, Sensor Tower's public Q2 2025 Italy report discusses CSR2, Asphalt Legends, Real Racing 3, Need for Speed No Limits and Pocket Champs. It is geographically and temporally limited, carries an AI Insights label, and is not a 2026 worldwide ranking. We do not extrapolate its estimates into a Heatwave forecast. [Sensor Tower report](https://sensortower.com/blog/2025-q2-unified-top-5-racing%20games-revenue-it-62fbc03af5dff393904ee927).

Before spending on user acquisition, obtain a consistent last-90-day India/US/global iOS+Android grossing export, including measurement definitions and whether ad/direct-store revenue is excluded. Compare revenue per download, retention where available, update cadence and acquisition spend. Those data remain unavailable here; no precise current “number one racing game” claim is justified.

## Competitor findings

| Reference | Verified pattern | What Heatwave should learn | What does not transfer automatically |
|---|---|---|---|
| CSR Racing 2 | Free download, real-time races, crews, garage collection, customization and recurring events | Give players a car identity, a social home and short repeatable competition | Licensed supercars, mature acquisition operations and collection depth are substantial investments; revenue does not prove each mechanic causes success |
| Asphalt Legends | Cross-platform play/co-op; paid passes and ongoing multiplayer balancing | Easy friend access, readable competition, evolving events | Many pass types and performance-dependent collections complicate balance and operations |
| F1 Clash | Free/premium progression tracks; paid pass benefits expire with an Exhibition | Show progress and precise rewards; reward participation as well as wins | A finite exhibition pass is not evidence for an auto-renewing subscription; avoid transferring competitive boosts |
| Beach Buggy Racing 2 mobile | Asynchronous online opponents and leaderboard tournaments | Social competition can work without live collision synchronization | Avatars are not live players; label Heatwave's ghost mode honestly |
| GRID Autosport mobile | Buy-once complete game | A clear permanent purchase can build trust and simplify the offer | Upfront purchase adds a barrier to friend acquisition; its console-scale content/device requirements differ from ours |
| Mario Kart Tour (historical) | Gold Pass monthly subscription; multiplayer expansion; service ended September 2026 | Ongoing benefits can support repeat payments, but online-service continuity matters | Nintendo's brand and catalog are not available to us; discontinued service is not a current launch template |
| Horizon Chase 2 / Apple Arcade reference | Publisher listing describes friend crews, online competition and World Tour together; Arcade is a catalog subscription without ads/IAP | Friends can share an adventure, not only a leaderboard | A platform subscription is a distribution/business partnership, not simply adding a Heatwave monthly product |

Sources for the feature comparison: [CSR2 publisher page](https://www.zynga.com/games/csr-racing-2/), [Asphalt crossplay announcement](https://asphaltlegendsunite.com/), [Asphalt pass roadmap](https://asphaltlegends.com/news/roadmap-may), [current F1 pass FAQ](https://hutch.helpshift.com/hc/en/10-f1-clash/faq/1472-what-do-i-get-for-purchasing-the-premium-pit-pass/?contact=1&l=en&p=web), [F1 original progression explanation, 2022](https://www.hutch.io/blog/games/f1-clash-introducing-pit-pass/), [Vector Unit multiplayer FAQ](https://vector-unit-faq.groovehq.com/help/is-there-online-multiplayer), [GRID store listing](https://play.google.com/store/apps/details?hl=en-US&id=com.feralinteractive.gridas), [Nintendo historical Gold Pass FAQ](https://en-americas-support.nintendo.com/app/answers/detail/a_id/47593/), [Nintendo service-end confirmation](https://faq.mariokarttour.com/hc/en-us/articles/55861637745305-About-the-End-of-Service-for-Mario-Kart-Tour), [Horizon Chase 2 publisher listing](https://apps.apple.com/us/app/horizon-chase-2/id1534920947), [Apple Arcade model](https://www.apple.com/apple-arcade/).

### A specific lesson from a successful game's correction

On September 29, 2026, Gameloft described changing Asphalt's ad rewards because finishing second could previously yield more credit opportunity than first. It also announced reduced milestone grind and adjustments to car leagues. The lesson for Heatwave is to test the whole reward economy: winning, losing, watching an ad and playing with a friend must not create perverse incentives. This is evidence of a design correction, not proof of its financial effect. [Official multiplayer update](https://asphaltlegends.com/news/multiplayer-update).

### Subscription evidence needs context

Nintendo's 2020 investor presentation reported increasing active players and Gold Pass subscribers after multiplayer was added. This is historical association, not a controlled causal experiment. Nintendo confirms Mario Kart Tour ended service on September 29, 2026. We cannot infer the shutdown's profitability or cause from that notice. Heatwave should preserve its standalone offline campaign even if online services later stop. [Nintendo 2020 investor presentation](https://www.nintendo.co.jp/ir/pdf/2020/200507_4e.pdf), [service notice](https://en-americas-support.nintendo.com/app/answers/detail/a_id/71752/).

## Business-model choice

| Model | Player promise | Growth effect (our inference) | Operating burden | Heatwave decision |
|---|---|---|---|---|
| Paid upfront | Buy the complete game before playing | Adds friction before accepting an invitation | Content quality upfront; store support; ongoing servers still cost money | Not the initial mobile growth model |
| Free demo + permanent campaign unlock | Try, then own the story | Free challenge mode can keep invitations usable | Strong demo and purchase restoration | Credible fallback if story completion is strong but cosmetic demand is weak |
| Free + cosmetics + optional rewarded ads | Play with friends free; buy visible self-expression | Lowest payment barrier to invitations | Cosmetic production, billing, consent, ad reliability | Recommended first commercial test |
| Individually purchased season pass | Pay once for that season's clear cosmetic reward track | Works only when regular players value its rewards | Reliable content cadence; attainable progression | Later experiment; explicitly no auto-renewal |
| Auto-renewing subscription | Receive valuable ongoing benefits until canceled | Can discourage occasional players if core social play is gated | Continuous value, renewal support, churn management | Defer; no evidence Heatwave can sustain it yet |
| Catalog subscription partnership | Included in a platform's library | Discovery depends on partner | Negotiated distribution/content obligations | Separate future business opportunity |

Proposed first catalog remains one permanent supporter pack (₹199–₹399 test range), selected permanent liveries (₹79–₹149 test range), earned free cosmetics and opt-in post-run reward doubling. These are unvalidated India price hypotheses, not competitor prices or final store prices. No paid performance in standardized competition, paid continues in ranked sessions, paid random rewards or paywalled core ending. Offer previews must show exactly what is owned.

A later cosmetic pass must be achievable by ordinary play in measured sessions, have transparent duration and no automatic renewal. Prefer letting an activated track remain completable after its sales window rather than selling anxiety. Test this only after producing two content cycles on time. A subscription needs separate evidence of recurring value; it is not the default upgrade from a pass.

## Multiplayer concept: Nobody Drives Home Alone

Keep Mara and Jun's main story playable solo. Online drivers are allies in the roadside network, not duplicate versions of Mara. They help recover supplies and bring travelers home between story milestones. Paid decoration does not change the family reunion or a friend's eligibility to join.

### Stage A — Rival Routes (asynchronous)

A 60–90 second escape challenge uses a fixed route, pursuit seed, rules version and standardized car class. A player shares a result card and code/link. A friend drives later against a recorded translucent ghost. The ghost has no collision or physical effect and is explicitly marked “recorded run.” Compare objective completion, then time or score using one declared mode-specific ranking rule. Incomplete runs are classified separately, not above successful escapes because of farmed points.

This mode works without a simultaneous audience or low network latency. Initially allow code entry; add HTTPS invite links, Android App Links/iOS Universal Links and browser fallback in a later verified integration. Preserve an invite until onboarding ends. A plain seed code can work offline, but server-backed discovery, verified rankings and retrieval of somebody else's ghost need connectivity.

### Stage B — Convoy Escape (actual live multiplayer)

Two friends enter a private room with a short code. A ready check starts a shared 90–120 second mission: recover two supply caches, regroup at the exit and escape together. One can draw pursuit while the other collects; roles can swap. One limited proximity rescue creates a cooperative comeback without selling revives. Friendly cars do not ram each other in the first version. AI pursuit and mission state are shared and authoritative.

The signature moment: one driver's car stalls near the exit, their friend returns, both cross with seconds remaining, and the garage gains an earned memento. The optional joint result card celebrates both drivers. Friendly callouts use a few preset pings, not open voice/chat at launch.

Private rooms come before public matchmaking. Avoid dividing a small population among five worlds, ranked tiers and many playlists. If public play comes later, start with one rotating queue; disclose any AI fill as AI. Never advertise a bot as a live friend.

### Stage C — Crews and rivalry

Small crews (initial hypothesis: eight members) contribute to a weekly garage/community objective asynchronously. Contribution is capped for reward calculations so a single grinder is not required. No missed-day penalties or invitation quotas. Crew activity earns shared visual restoration, while individual free rewards remain available without joining. Add four-player private escape races only after the two-player simulation and costs pass their gates; defer cops-versus-runners and open chat because they multiply balancing/moderation work.

## Viral loop and measurement

The intended loop is: meaningful close escape → voluntary personalized card/code → friend opens free challenge → completes it → sends rematch → both see their garage/crew progress. The story gives the chase a purpose; multiplayer supplies surprising moments people may want to share. Neither is evidence that the game will become viral.

Track invite created, share sheet opened, invite landing, game start, invite claimed, challenge completed and rematch. Treat share-sheet opening separately from confirmed sharing; many platforms cannot confirm delivery. Use anonymous referral tokens with expiry and no recipient/contact collection. Record device tier, mode and acquisition cohort so a share feature does not mask low-end performance loss.

Report invited activated players per active player and invited-player D1/D7 alongside organic retention. A hypothetical viral coefficient is invitations actually sent per player × acceptance × activation. For example 0.5 × 0.2 × 0.6 = 0.06 activated players per player, far below self-sustaining growth. These are illustrative numbers, not Heatwave measurements. Do not pay to acquire users on a “viral” assumption.

## Architecture and mobile budgets (design targets to benchmark)

Current source has a single-player Canvas loop and localStorage progression. Police spawning uses Math.random; effects/rendering also consume Math.random. Existing seeded layouts alone cannot reproduce a fair run. The Android wrapper currently has no INTERNET permission, and there is no deployed match service, identity service or authoritative result validator.

1. Extract the fixed-step simulation from rendering/DOM/audio. Provide a per-run seeded gameplay RNG independent of visual RNG. Define tick-indexed input, stable object IDs, versioned objective/scoring rules and run hashes. Rendering quality must never affect gameplay RNG or rewards.
2. Record bounded input plus periodic state snapshots. Floating-point replay across JS engines may diverge; validate Android WebView, desktop browsers and iOS WKWebView rather than assuming bit-exact determinism. Use snapshot correction for ghost playback. Competitive verification requires server re-simulation with the supported engine or an equivalently authoritative method; bounds checks alone do not establish a fair score.
3. For live play, prototype a TLS WebSocket room service. A server simulates collisions, AI, objectives and rewards; clients send sequenced inputs, predict their own vehicle and interpolate remote state. Target fixed 60 Hz shared simulation with 10–15 Hz delta snapshots initially, then benchmark. WSS is a simplicity-first prototype transport; test head-of-line stalls on mobile before committing to it for public ranked play.
4. Keep network transport out of the offline campaign. Add Android INTERNET only when implementing online mode, preserve HTTPS/WSS allowlists and trusted WebView message boundaries, and validate iOS networking/lifecycle. Pause/background means leaving or reconnecting to a live match, not freezing everyone else's game.
5. Proposed targets: one extra ghost draw; no second terrain canvas; 30 fps Eco with the existing simulation rate; no mandatory video/voice assets. Aim for under 10 KB/s per client in each direction on average for two-player play and a bounded replay payload under 256 KB for a short challenge. These are acceptance hypotheses, not measured results or promises.
6. Prototype a 10-second reconnect grace period with neutral/coasting server input, token-bound reconnection and a clear status. Suppress duplicate rewards; do not penalize private-match network failure with ranked loss. Test packet loss, jitter, reconnect, app background and build mismatch explicitly.
7. Backend needs guest sessions, invite expiry, room limits, rate limits, authoritative reward IDs, replay retention/deletion and purchase entitlement verification. Store credentials stay native/server-side. Paid entitlements and ranked results never rely on editable localStorage. Public names/crews require report/block and moderation before release; audience choice affects social design.

Do not select a paid provider or activate a billing account from this proposal. Compare a small custom authoritative service with managed room hosting using a real load test and current written quotes. KMP can share account/session/entitlement models, while the web simulation remains common to Android, iOS and browser.

## Cost and viability before scale

DAU alone does not size multiplayer. Average concurrency ≈ DAU × average online minutes per daily player / 1,440. Illustratively, 10,000 DAU × 8 minutes / 1,440 ≈ 56 concurrent players; a hypothetical 4× peak is 224, or 112 full two-player rooms. Actual regional peaks, empty rooms, spectators and reconnects must be measured.

At an assumed 10 KB/s server outbound per connected player, that example is about 1.44 TB/month of outbound payload at average concurrency, before protocol overhead, retries, CDN/replay transfers and logging. It is not a hosting quote. CPU room density, regional availability and observability may dominate bandwidth cost.

Monthly contribution = net store receipts + net ad receipts − multiplayer/backend/egress − moderation/support − live-content production − acquisition spend. Use actual fee/tax/refund/territory treatment and ad receipts; do not treat store sticker price as net revenue. Break-even paying users = uncovered monthly cost / net contribution per payer, only after separating variable costs. Track cost per completed live match and per retained multiplayer player.

## Delivery and decision gates

| Milestone | Reviewable output | Gate before next investment |
|---|---|---|
| 1. Solo/story foundation | Opening 20-level slice; deterministic gameplay RNG; standardized challenge preset | Existing campaign and saves intact; gameplay replay checks and Eco performance tested |
| 2. Async friend alpha | Code entry, ghost playback, result card; minimal invite/result backend | Two distinct devices complete the same challenge; no quality-tier scoring drift; invited-player retention measured |
| 3. Live private alpha | Two real clients on separate networks in Convoy Escape | Shared AI/objectives agree; latency/loss/background/reconnect tested; rewards issued once; measured room cost |
| 4. Commercial test | Store sandbox purchases, earned/free cosmetics, audience-appropriate optional ads | Restore/cancellation/refund/reward tests; no purchase-dependent competitive advantage; net receipts and retention reviewed |
| 5. Controlled growth | One public queue if population supports it; crews; then optional cosmetic pass | Match-fill time, retained friends and content economics justify continuing |

Suggested pilot gates to agree before testing (not industry benchmarks): at least 95% of valid private joins reach a match, p95 ready-to-match under 10 seconds excluding player readiness, at least 99% crash-free completed pilot sessions, and no more than a 10% p95 frame-time regression versus equivalent solo scenes on the selected low-end test phone. Small samples require confidence intervals and qualitative review; these figures do not substitute for competitive latency testing or retention evidence.

Run monetization tests after a stable gameplay baseline. Compare cosmetics-only against cosmetics plus optional ads in otherwise equivalent cohorts; measure D1/D7, completed friend sessions, refunds and contribution, not only purchase conversion. Use sample-size planning from observed baseline; if traffic is small, use interviews and sequential usability tests instead of claiming statistically significant revenue uplift.

Consider premium campaign unlock only if the campaign is valued but the cosmetic model fails economically. Consider a cosmetic pass only after two dependable content cycles and retained multiplayer use. Consider subscription only if players demonstrably value a continuing service that the team can fund. Multiplayer stays free in each growth-oriented experiment.

## Originality and emotional quality

Adopt principles—car attachment, fair repeatable mastery, social belonging, clear value—not another game's assets, scripts or licensed vehicle identities. Continue with original car designs unless real vehicle rights are secured. Heatwave's distinguishing promise is a small, responsive chase where helping another driver connects to restoring a family garage. Test whether players remember Mara and Jun and voluntarily return to help a friend. Awards and commercial success remain outcomes to pursue, not claims to put in the product.
