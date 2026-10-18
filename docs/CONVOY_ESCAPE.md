# Convoy Escape — live private alpha

Status: implemented and tested locally with two real browser clients and two WebSocket test clients. The hosted game defaults to the verified free Render match service at `wss://runroad-convoy-alpha.onrender.com/convoy`. Two real WSS clients passed a live smoke test. See [free hosting status](FREE_MULTIPLAYER_HOSTING.md) for service/deploy IDs, source revision and limitations. The owner-private static Site remains separate from the backend; no paid plan, database or disk was added.

## Play locally

Requires Node 22+ and npm. From the repository root:

```sh
npm ci --prefix server --ignore-scripts
node server/index.mjs
```

Open `http://127.0.0.1:4180/` in two browser tabs/windows. Choose **Play with Friends**. The first driver creates a room; the second enters its eight-character code and joins. Both select Ready. A three-second countdown precedes the mission. Both clients connect to `/convoy` on the same local server. There are no simulated human players.

1. Recover both supply caches. The mission arrow points to the nearest remaining cache, then the exit.
2. Police target the nearest living driver, so one teammate can draw pursuit away.
3. If a car stalls, bring the other car within 95 world units and hold Rescue (or R on desktop) for two seconds. Helping stops the rescuer's car. One shared rescue restores 45 hull; it cannot be purchased or replenished in the match.
4. Both living, connected drivers must reach the green exit after both caches are recovered. The time limit is 120 seconds. A stalled driver has 18 seconds to be rescued.

Drag to steer; desktop WASD/arrows and Shift/N for nitro. Standard starter-car stats apply to both drivers. No campaign credits, paid entitlements or persistent ranked rewards are granted. The final result comes from the server.

The radio line from Jun during countdown and the joint success line connect the mode to “Nobody drives home alone.” The community crew garage is implemented with optional verified sign-in; production activation is tracked in [Crews](CREWS.md). Full authored story scenes remain a later milestone.

## What is authoritative

`server/simulation.mjs` owns positions, steering response, obstacles, police targeting/collisions, damage, nitro charge, pickups, rescue count, timer and victory. It advances at fixed 30 Hz. The server broadcasts snapshots at up to 15 Hz. Clients interpolate positions and send sequenced angle/boost/rescue/idle inputs at up to 15 Hz. This alpha does not yet use local movement prediction or lag compensation; slower mobile networks will feel less responsive than solo.

The client does not run the solo physics loop while connected. Each match has a seeded layout with reserved spawn/cache/exit zones. Existing Canvas rendering and Eco pixel/terrain budgets remain in use; no additional terrain canvas or media download is required.

## Connections, failure and limits

- Two seats, each with a random reconnect token delivered only to its own WebSocket. Tokens stay in memory, never in shared room codes, URLs, files or logs.
- If the socket drops, the client retries for nine seconds; the server allows ten seconds after marking that player disconnected. Losing a page/reloading loses this in-memory token; automatic resume after page reload is not implemented.
- Inputs expire after 0.6 seconds, so a dropped or inactive client stops accelerating. A pause overlay sends idle input; backgrounding does not freeze the shared match.
- The server ends a match if either disconnected driver exceeds the grace period. A network failure grants no ranked penalty or campaign loss.
- Invalid protocol, foreign Origin, non-finite steering, stale sequence and client-supplied position/HP are rejected or ignored. Frames are capped at 1 KB, input traffic at 25 messages/second, connections at eight per address and active room storage at 64 rooms. Backpressured sockets are terminated; ping/pong detects dead connections.
- Rooms expire after ten minutes; terminal rooms expire after 30 seconds. State is memory-only: restarting the server ends all matches. There is no open chat, voice or public queue. Optional account-backed crew persistence is implemented but requires backend configuration; see [Crews](CREWS.md).
- These limits are an alpha baseline, not a production security audit. Before public access, add hosting-level connection/creation-rate controls, observability and representative load/network testing. The room code is a private invite, not proof of account identity.

## Deploy the match service

Use one persistent Node process/container with WebSocket upgrade support and a valid HTTPS/TLS reverse proxy. A static asset host or an ordinary short-lived serverless request function is insufficient for this server. Do not run multiple independent replicas without room-aware routing and a defined shared-room design.

The supplied Dockerfile builds from the repository root:

```sh
docker build -f server/Dockerfile -t runroad-convoy .
docker run --rm -p 4180:4180 \
  -e ALLOWED_ORIGINS=https://heatwave-desert-run.stalinpusparaj47.chatgpt.site \
  runroad-convoy
```

The production ingress must terminate TLS and proxy `/convoy` with WebSocket upgrades to port 4180. Set its idle timeout above the five-second heartbeat interval, and set `ALLOWED_ORIGINS` to an exact comma-separated list of approved game origins. For a native Android build, also include `https://appassets.androidplatform.net`. The health route is `/health`; it exposes no room identifiers or tokens. No credentials belong in the browser's match-server input.

After deployment, enter `wss://<your-host>/convoy` in each game's Match Server field. The current HTTPS Site does not allow plaintext remote WebSockets. The client permits plaintext only for loopback testing; Android keeps cleartext disabled. This alpha deliberately does not prefill an unverified production address or send gameplay to a guessed service.

Android's INTERNET permission is now included for explicit live connections. Bundled startup, campaign and ghost challenges still work offline; file access and mixed-content protections remain. Native WSS play requires a deployed TLS endpoint and device testing. iOS native live networking is unverified.

## Verification

- `node --test tests/convoy.test.mjs`: seeded safe layouts, two-ready requirement, input validation, stale/idle stopping, boost limits, shared caches, both-driver victory, one proximity rescue, collision damage and loss conditions.
- `node --test tests/convoy-network.test.mjs`: actual two-socket create/join/countdown, authoritative movement despite spoofed fields, third-seat rejection, token-bound reconnection, identical terminal results, foreign-origin rejection and protocol mismatch. Completion uses controlled server-side fixture positions, not a claim that an autonomous test driver completed an unmodified public match.
- Browser QA: two independent game tabs joined one room, both readied, shared gameplay rendered both cars and police. Browser testing is not physical-device/network-loss certification.
- Existing campaign, ghost and performance regression scripts must continue passing.

## Before wider release

Deploy a chosen server, measure p50/p95 input-to-display latency, real payload/egress per match, frame time on low-end Android, reconnect behavior across Wi-Fi/mobile switching, background/foreground and sustained room concurrency. Test on two distinct physical devices/networks. Protect match entry with appropriate identity/abuse controls before persistent rewards. Crews and four-player expansion depend on these results; no server-cost or retention target is claimed achieved by this alpha.
