# Crews — persistence foundation (not live)

The live game still offers Rival Routes and two-player Convoy Escape. Crews are not exposed in the UI and do not currently save progress.

The proposed first release restores Mara and Jun's community garage through successful Convoy escapes: lights at 5 wins, open doors at 15, a welcoming home at 30. These are shared cosmetic/story milestones, with no handling, speed or rescue advantages. Eight members per crew is the initial target; four-player live matches remain a later performance milestone.

## Prepared

- `server/crew-progress.mjs`: builds a contribution from a trusted authoritative match and two distinct authenticated account IDs. Lobby, incomplete and lost runs produce no contribution.
- `server/migrations/001_crews.sql`: Supabase PostgreSQL tables and a transaction to record wins. It resolves membership on the server and deduplicates each crew/match pair. Two members of the same crew earn one shared win, not two. Two different crews can each receive a win.
- Client roles have no table access or permission to invoke the reward function. Service credentials must stay on Render, never in web or bundled Android assets.
- Unit tests cover event eligibility, identity validation and milestone thresholds. The SQL has not been applied or integration-tested against PostgreSQL.

## Required before release

Connect Supabase and select/create an eligible free project without adding paid resources. Confirm current free-plan limits during provisioning. Apply and test the migration in a development database, including concurrent duplicate submissions and unauthorized calls.

Implement account sign-in for web and Android; bind authenticated identities to WebSocket seats. A room code or reconnect token is not an account. Add authenticated create/join/leave/read endpoints with an atomic eight-member cap, hashed expiring invitation tokens, rate limits and membership checks. Do not expose database service credentials in the browser.

Wire authoritative terminal results to a durable retry/outbox mechanism and the database transaction. Match IDs must be random 128-bit values, separate from room codes. A database outage must show pending synchronization, never a false saved success. Account deletion and crew departure behavior require integration tests. Then add and verify the garage UI, redeploy Render, publish the game and rebuild Android.

Render Free memory and local files are not durable storage. Do not enable persistent crew rewards against either. Existing local campaign progress remains independent.
