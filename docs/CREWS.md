# Crews — game integration (activation pending)

The live game still offers Rival Routes and two-player Convoy Escape. The hosted crew database is provisioned and verified, but The crew garage and sign-in screens are implemented. The deployed match service still needs its server-only database configuration before account-backed progress can be enabled.

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

The API is absent by default. Set both `SUPABASE_URL` (the project's HTTPS origin) and `SUPABASE_SECRET_KEY` in the backend host's secret environment, after applying both migrations. Partial configuration fails startup. Do not place these values in `dist`, Android assets, Git or share links. The hosted database exists, but the Render secret environment has not been configured and these routes remain disabled in the deployed match service.

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

Supabase is connected and the RUNROAD project has been created in the existing Free organization. The migrations are applied. Still verify Auth/Data API behavior and concurrent joins/duplicate submissions through independent connections before exposing the feature.

Implement account sign-in for web and Android; bind authenticated identities to WebSocket seats. A room code or reconnect token is not an account. The backend endpoints are prepared; connect them to the client only after provider validation. Android must explicitly allow the new HTTPS routes through its WebView request filter. Do not expose database service credentials in the browser.

Wire authoritative terminal results to a durable retry/outbox mechanism and the database transaction. Match IDs must be random 128-bit values, separate from room codes. A database outage must show pending synchronization, never a false saved success. Explicit crew departure is covered locally; test account deletion and provider-side cascading separately. Deleting an account removes its membership and invitations through foreign keys; an empty garage left by account deletion still needs a cleanup policy. Then add and verify the garage UI, redeploy Render, publish the game and rebuild Android.

Render Free memory and local files are not durable storage. Do not enable persistent crew rewards against either. Existing local campaign progress remains independent.

Implementation references: [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys), [server verification of user tokens](https://supabase.com/docs/guides/auth/jwts), and [database function permissions](https://supabase.com/docs/guides/database/functions).

## Hosted database — 18 October 2026

- Project: **RUNROAD**, ID `rajkcmbdsnxdtajchuuy`, region `ap-southeast-1` (Singapore).
- Organization: `stalinpusparaj's Org`, ID `ygkqwgpvoighvvpqxysi`, confirmed Free. No plan upgrade or paid branch was requested.
- [Project dashboard](https://supabase.com/dashboard/project/rajkcmbdsnxdtajchuuy).
- Status after provisioning: `ACTIVE_HEALTHY`, PostgreSQL 17.
- Applied migrations: `20261018152149_runroad_crew_progress`, `20261018152223_runroad_crew_membership`, and `runroad_invite_crew_index`. Initial sources are the two files in `server/migrations`; the CLI-generated index source is `supabase/migrations/20261018152438_runroad_invite_crew_index.sql`. This checkout is not yet a complete linked Supabase CLI migration history; do not blindly run `db push`.
- Hosted transactional verification passed create, join, eight-member cap, shared rewards, duplicate reward rejection and invitation revocation after departure. All synthetic accounts, crews and results were rolled back.
- Catalog checks confirmed RLS on all four tables, no table privileges for `anon`/`authenticated`, and server-only execution of all six functions.
- Security advisor has only informational [RLS enabled without policies](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) findings. This is deliberate: access is server-only and browser grants are revoked.
- The advisor's missing invitation foreign-key index was added. Its current [unused-index information](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index) is expected before live traffic.
- Database provisioning did not change the game or Render credentials. Subsequent game integration is described below. Existing projects in this organization were not modified.

## Game and account integration — 19 October 2026

`dist/crews.js` and `dist/crews.css` add the Community Crew Garage to the header and friend menu. The garage shows eight membership places, shared escape/supply/rescue counts and the 5/15/30-win restoration stages. Forms support create, join, invite, refresh, explicit departure and sign-out. Names and account data are HTML escaped. The garage art is CSS; no image or SDK download is added.

Sign-in uses Supabase's existing default email links with the public project key. The dashboard currently requires custom SMTP or a paid upgrade to customize templates, so the UI does not promise numeric OTP emails. Players can paste the private verification link into the game; it is accepted only for this project's HTTPS verification endpoint and email/signup/magiclink types. Pasting a link does not navigate to its redirect target. Web sign-in also consumes the verified return session from a URL fragment and immediately removes the fragment from browser history. Sessions and refresh tokens stay in memory for the open tab; refreshing/closing the page requires a new sign-in. Logout attempts to revoke this refresh session and always clears local memory.

The default mail service is suitable only for approved alpha test addresses and limited delivery. Custom SMTP and representative delivery testing remain necessary before inviting public players. No test emails were sent automatically. The email flow cannot be called verified end-to-end until a person receives and uses a link.

The sign-in button first checks `/health` for `crews: true`; an unconfigured backend does not trigger an email request. Server settings to activate are `SUPABASE_URL=https://rajkcmbdsnxdtajchuuy.supabase.co` and a server-only `SUPABASE_SECRET_KEY`. The existing secret must be stored in Render's secret environment only. Web redirects should be configured to the owner-private game URL. No key is embedded in the APK or Site.

WebSocket create/join messages optionally include a user access token, restricted by the client to the trusted match origin. The server verifies it with Auth, binds the verified account to the seat, and rejects a second seat with the same account. Guest drivers remain supported. Reconnect uses the existing private seat token. Initial handshake frames allow up to 12 KB for JWTs; subsequent messages remain capped at 1 KB.

An authoritative two-account victory captures an immutable terminal simulation copy, uses a separate random 128-bit match ID, and calls the server-only reward transaction. The final screen shows pending until the database acknowledges. Positive updates show saved; zero updates show checked (an already processed match or changed membership can produce zero). Guest, incomplete and lost matches grant no crew contribution. No campaign credits are granted. Membership is resolved at result transaction time, not locked for the entire race.

Saving retries up to five times in the running server, with pending rooms retained up to three minutes. **This retry queue is memory-only**, not a durable outbox. A server restart before the database accepts the result can lose an unconfirmed contribution. The UI never labels such a result saved. Completed database updates survive restarts and are deduplicated on retry. Durable recovery across a backend crash remains a production hardening item.

Android permits only the exact crew routes, the project's selected Auth routes, and health checks through its WebView request filter. Other remote paths and lookalike origins remain blocked. Solo campaign remains offline. The Android debug build and shared JVM checks are required after each asset/allowlist change; a physical-device account flow is still unverified.

Local verification includes small-screen browser inspection, all solo/campaign/ghost checks, 33 crew/multiplayer tests, and Android build/shared tests. The local WebSocket suite uses an injected provider and controlled terminal fixture; it does not claim a real user account or naturally completed live hosted race.

Activation still requires confirmed placement of the Supabase server credential in Render, a backend deployment, redirect configuration and a human email sign-in test. The Site audience remains owner-private.
