# Crews — backend integration (not live)

The live game still offers Rival Routes and two-player Convoy Escape. Crews are not exposed in the UI and do not currently save progress.

The proposed first release restores Mara and Jun's community garage through successful Convoy escapes: lights at 5 wins, open doors at 15, a welcoming home at 30. These are shared cosmetic/story milestones, with no handling, speed or rescue advantages. Eight members per crew is the initial target; four-player live matches remain a later performance milestone.

## Prepared

- `server/crew-progress.mjs`: builds a contribution from a trusted authoritative match and two distinct authenticated account IDs. Lobby, incomplete and lost runs produce no contribution.
- `server/migrations/001_crews.sql`: Supabase PostgreSQL tables and a transaction to record wins. It resolves membership on the server and deduplicates each crew/match pair. Two members of the same crew earn one shared win, not two. Two different crews can each receive a win.
- Client roles have no table access or permission to invoke the reward function. Service credentials must stay on Render, never in web or bundled Android assets.
- `server/migrations/002_crew_membership.sql`: transactional create, join, read, invite and leave operations. A crew row lock serializes joins and departures; membership has an eight-driver cap. Invitation hashes expire after 24 hours; creating a new invitation revokes that member's previous code. Departing revokes the member's invitations. Remaining members retain garage progress; the last explicit departure deletes the abandoned crew.
- `server/crew-store.mjs`: server-only Supabase Auth verification and database adapter. Only confirmed email accounts can use crews. Guest accounts are rejected. Provider errors are sanitized and requests have a seven-second timeout. Uses the modern secret API key in the `apikey` header; user access tokens are sent to Auth only.
- `server/crew-api.mjs`: bounded JSON HTTP API, exact origin allowlist, verified identity binding and local rate limits. Requests cannot select another account or submit rewards.
- Both migrations pass embedded PostgreSQL (PGlite) integration tests for membership limits, rollback, reward deduplication, departures, expiration and browser-role denial. HTTP tests cover identity spoofing, origins, payload limits, authentication and throttling. This is not verification against a hosted Supabase instance or concurrent independent PostgreSQL sessions.

## API and configuration

The API is absent by default. Set both `SUPABASE_URL` (the project's HTTPS origin) and `SUPABASE_SECRET_KEY` in the backend host's secret environment, after applying both migrations. Partial configuration fails startup. Do not place these values in `dist`, Android assets, Git or share links. No production configuration was added in this change.

Every request needs an allowed `Origin` and `Authorization: Bearer <user access token>`. POST requests require `application/json` and accept at most 512 bytes. Responses are not cached.

| Route | Method | Body / result |
| --- | --- | --- |
| `/crews` | GET | `{crew: object or null}`; aggregate member count, no member identities |
| `/crews/create` | POST | `{name}`; returns the new crew |
| `/crews/invite` | POST | `{}`; returns a random 128-bit invite code and expiry |
| `/crews/join` | POST | `{code}`; returns the joined crew |
| `/crews/leave` | POST | `{}`; returns `{left: true}` |

Invite codes are private invitations and are not account credentials. Only their SHA-256 hashes are stored. No public listing, chat or client reward endpoint exists.

The alpha limiter permits 20 requests/minute per socket address and holds at most 1,000 active address counters. It deliberately does not trust arbitrary forwarded headers. Before enabling behind Render's reverse proxy, configure verified proxy-aware/edge and account limits; otherwise multiple users can share the proxy's address and throttle one another. These counters reset when the process restarts.

Run `npm ci --prefix server --ignore-scripts`, then `npm test --prefix server`. PGlite is a development dependency and is excluded by the Render/Docker production install. It does not add an asset, SDK or dependency to the web/Android game.

## Required before release

Connect Supabase and select/create an eligible free project without adding paid resources. Confirm current free-plan limits during provisioning. Apply both migrations to a development project and verify Auth/Data API behavior, including concurrent joins and duplicate submissions through independent database connections.

Implement account sign-in for web and Android; bind authenticated identities to WebSocket seats. A room code or reconnect token is not an account. The backend endpoints are prepared; connect them to the client only after provider validation. Android must explicitly allow the new HTTPS routes through its WebView request filter. Do not expose database service credentials in the browser.

Wire authoritative terminal results to a durable retry/outbox mechanism and the database transaction. Match IDs must be random 128-bit values, separate from room codes. A database outage must show pending synchronization, never a false saved success. Explicit crew departure is covered locally; test account deletion and provider-side cascading separately. Deleting an account removes its membership and invitations through foreign keys; an empty garage left by account deletion still needs a cleanup policy. Then add and verify the garage UI, redeploy Render, publish the game and rebuild Android.

Render Free memory and local files are not durable storage. Do not enable persistent crew rewards against either. Existing local campaign progress remains independent.

Implementation references: [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys), [server verification of user tokens](https://supabase.com/docs/guides/auth/jwts), and [database function permissions](https://supabase.com/docs/guides/database/functions).
