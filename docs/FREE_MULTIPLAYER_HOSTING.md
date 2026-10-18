# Free multiplayer hosting — Render alpha

Checked 18 October 2026. Recommended: run the existing authoritative Node/WebSocket server on **one Render Free web service**, in Singapore as an initial region for India-focused tests. No engine migration is required. This is for a limited alpha, not a production reliability promise.

## Ready in the repository

`render.yaml` declares a free Node service, eight-room cap, health check and exact allowed game/Android origins. It adds no database, disk, paid compute or automatic deployment. `SERVE_GAME=false` prevents this public backend from serving a second, public copy of the owner-private game. Only the health route and WebSocket endpoint are exposed.

The client performs a user-triggered health warm-up for approximately 90 seconds before opening the match socket. It sends no credentials, tokens or room codes to health checks. Closing the dialog cancels warming; normal offline gameplay does not ping the server. An active match uses the existing WebSocket input/heartbeat flow. No artificial keep-awake service is added.

## Deployment

Install/connect the Render integration, then create the service from this repository's `render.yaml` on `main`. Confirm the actual service is Free, review the account's included usage and billing safeguards, and do not add a payment method or upgrade. Render's existing account settings matter: a free compute instance does not itself prohibit bandwidth/build overage billing on an account that already has a payment method.

Once Render reports a successful deployment, use its **returned** hostname, not an invented onrender.com URL. Verify `/health`, then two real WSS clients, and only then configure the game to default to that endpoint. Until those checks pass, leave the match-server field empty on the hosted Site. The service's name is a requested resource name, not proof its hostname is available.

If using the Dashboard manually: create one Web Service from `stalinpusparaj/heatwavecarrace`, branch main, runtime Node, region Singapore, build `npm ci --prefix server --omit=dev --ignore-scripts`, start `node server/index.mjs`, plan Free. Apply the environment values from `render.yaml` and health check `/health`. GitHub access or a new-account terms step may require the owner.

## Free-tier limits and cost boundary

Render documents 750 free instance hours per workspace/calendar month. An idle free service sleeps after 15 minutes without inbound HTTP/WebSocket messages and can take about a minute to wake. Existing connections can close during a restart; all room state here is in memory and disappears on restart. Build and outbound-bandwidth limits also apply.

Without a payment method, excess included usage can suspend free services/builds rather than charge; with an existing payment method, bandwidth/build overages can incur charges. Inspect the selected workspace before claiming a hard zero-cost deployment. Do not activate paid resources as a workaround for a quota or verification requirement. No physical-device latency or concurrent-room capacity is claimed measured yet.

## Why keep the current engine?

The game already has an authoritative two-player server and tests. Colyseus is open-source and free to self-host, but its managed cloud currently starts at $15/month. Migrating now adds work without removing the need for a host. Cloudflare Durable Objects has a free allowance and may be worth evaluating later, but requires a different runtime/room adapter and a Cloudflare account. Prefer testing gameplay and bandwidth first.

## Official references

- [Render free services and limitations](https://render.com/docs/free)
- [Render WebSocket support](https://render.com/docs/websocket)
- [Render billing FAQ](https://render.com/docs/faq)
- [Render Blueprint specification](https://render.com/docs/blueprint-spec)
- [Colyseus framework/cloud pricing](https://colyseus.io/pricing/)
- [Cloudflare Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)

Status: deployment configuration prepared; no Render account connection or live match-server deployment has been verified.
