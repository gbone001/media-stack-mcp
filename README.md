# media-stack-mcp

## What This Is

`media-stack-mcp` is a Model Context Protocol server for operating a self-hosted media stack:

- Radarr
- Sonarr
- Prowlarr
- SABnzbd
- qBittorrent

The primary deployment target is **QNAP Docker**. In Docker mode this runs as a persistent Streamable HTTP MCP endpoint:

```text
http://<qnap-ip>:3000/mcp
```

For Claude remote MCP/custom connector usage, publish the same MCP server through Cloudflare Tunnel:

```text
https://mcp.yourdomain.com/mcp
```

Clients must send:

```http
Authorization: Bearer <MCP_HTTP_TOKEN>
```

The container exposes an unauthenticated health endpoint:

```text
http://<qnap-ip>:3000/healthz
```

## Clone The Repo Locally And Build Docker

Use this path if you want to clone the repository on your workstation, build the Docker image locally, and optionally smoke-test the HTTP server before deploying it on the QNAP.

Clone the repo locally:

```bash
git clone https://github.com/gbone001/media-stack-mcp.git
cd media-stack-mcp
```

Create a local `.env` from the example:

```bash
cp .env.example .env
```

Edit `.env` and set at least:

```env
MCP_TRANSPORT=http
MCP_HTTP_HOST=0.0.0.0
MCP_HTTP_PORT=3000
MCP_HTTP_TOKEN=use_a_long_random_secret_here
```

If you want to run the container locally, use LAN IP URLs for Radarr, Sonarr, Prowlarr, SABnzbd, and qBittorrent unless those services are also running on the same local Docker network:

```env
RADARR_URL=http://<qnap-ip>:7878
SONARR_URL=http://<qnap-ip>:8989
PROWLARR_URL=http://<qnap-ip>:9696
SABNZBD_URL=http://<qnap-ip>:8080
QBITTORRENT_URL=http://<qnap-ip>:5080
```

Build the Docker image locally:

```bash
docker build -t media-stack-mcp .
```

This does not require Node.js or pnpm on your workstation. The Dockerfile installs and builds everything inside the image.

Optional local smoke test:

```bash
docker run --rm -p 3000:3000 --env-file .env -e MCP_TRANSPORT=http media-stack-mcp
```

In another terminal, check:

```bash
curl http://localhost:3000/healthz
```

Expected response:

```json
{"ok":true,"name":"media-stack-mcp","transport":"http"}
```

When you are ready to run it on the QNAP, SSH into the QNAP and either clone the same repo there or pull the latest code in the existing QNAP checkout:

```bash
cd /share/Container/media-stack-mcp
git pull
docker compose up -d --build
```

The included `docker-compose.yml` is the preferred QNAP runtime path because it publishes port `3000`, loads `.env`, and attaches the container to the expected `media-stack` Docker network.

For Claude, also configure Cloudflare Tunnel so the public HTTPS URL routes to the internal Docker service:

```text
https://mcp.yourdomain.com -> http://media-stack-mcp:3000
```

## QNAP Docker Quick Start

SSH into your QNAP and choose an install location:

```bash
mkdir -p /share/Container
cd /share/Container
git clone https://github.com/gbone001/media-stack-mcp.git
cd media-stack-mcp
```

Create your runtime config:

```bash
cp .env.example .env
vi .env
```

At minimum, change the token:

```env
MCP_HTTP_TOKEN=use_a_long_random_secret_here
```

Build and start the MCP container:

```bash
docker compose up -d --build
```

Watch startup logs:

```bash
docker compose logs -f media-stack-mcp
```

## Claude HTTPS Setup

Claude remote MCP/custom connectors need a trusted HTTPS URL. This project ships an optional `cloudflared` sidecar in Docker Compose so the MCP app can stay plain HTTP inside Docker while Cloudflare publishes HTTPS externally.

The sidecar is **off by default** and lives behind the `cloudflare` Compose profile. Enable it by adding `--profile cloudflare` to your compose commands (see below). If you reach the MCP another way (LAN only, your own reverse proxy, etc.), you can ignore this section entirely and leave `CLOUDFLARED_TOKEN` blank.

The important lesson from Claude setup is that Claude does not connect to the QNAP LAN URL directly. Use the Cloudflare HTTPS hostname in Claude, not `http://<qnap-ip>:3000/mcp`, not `localhost`, and not a self-signed HTTPS URL.

Claude needs:

- a publicly reachable `https://` URL with a trusted certificate
- the full MCP path, for example `https://mcp.yourdomain.com/mcp`
- the bearer token header: `Authorization: Bearer <MCP_HTTP_TOKEN>`
- no extra browser-only login page in front of `/mcp`

In the Cloudflare Zero Trust dashboard:

1. Create a Cloudflare Tunnel.
2. Choose Docker as the connector environment.
3. Add a public hostname, for example `mcp.yourdomain.com`.
4. Set the tunnel service target to:

```text
http://media-stack-mcp:3000
```

Copy the tunnel token into `.env`:

```env
CLOUDFLARED_TOKEN=your_cloudflare_tunnel_token
```

Set the public MCP URL and allowed Host header:

```env
MCP_PUBLIC_URL=https://mcp.yourdomain.com/mcp
MCP_ALLOWED_HOSTS=mcp.yourdomain.com
```

Start or update the stack with the tunnel enabled:

```bash
docker compose --profile cloudflare up -d --build
```

Check the Cloudflare Tunnel logs:

```bash
docker compose logs -f cloudflared
```

Use this URL in Claude:

```text
https://mcp.yourdomain.com/mcp
```

Use this header:

```http
Authorization: Bearer <MCP_HTTP_TOKEN>
```

Do not put Cloudflare Access in front of `/mcp` unless your Claude client can send the required Cloudflare Access headers. Keep `MCP_HTTP_TOKEN` as the MCP protection layer.

Claude connector values should look like this:

```text
Name: media-stack
URL: https://mcp.yourdomain.com/mcp
Authorization header: Bearer your_long_random_mcp_token
```

If Claude asks for separate auth fields, use:

```text
Header name: Authorization
Header value: Bearer your_long_random_mcp_token
```

The token must be the value from `MCP_HTTP_TOKEN`, not the Cloudflare tunnel token.

Do not paste `CLOUDFLARED_TOKEN` into Claude. That token is only for the `cloudflared` Docker sidecar.

## Required `.env` Values

These MCP settings should be present for QNAP Docker mode:

```env
MCP_SERVER_NAME=media-stack-mcp
MCP_TRANSPORT=http
MCP_HTTP_HOST=0.0.0.0
MCP_HTTP_PORT=3000
MCP_HTTP_PATH=/mcp
MCP_HTTP_TOKEN=use_a_long_random_secret_here
MCP_PUBLIC_URL=https://mcp.yourdomain.com/mcp
MCP_ALLOWED_HOSTS=mcp.yourdomain.com
CLOUDFLARED_TOKEN=your_cloudflare_tunnel_token
```

Configure whichever media apps you want enabled. A tool returns a clear configuration error if its matching app URL/key is missing.

```env
RADARR_URL=http://radarr:7878
RADARR_API_KEY=your_radarr_api_key

SONARR_URL=http://sonarr:8989
SONARR_API_KEY=your_sonarr_api_key

PROWLARR_URL=http://prowlarr:9696
PROWLARR_API_KEY=your_prowlarr_api_key

SABNZBD_URL=http://sabnzbd:8080
SABNZBD_API_KEY=your_sabnzbd_api_key

QBITTORRENT_URL=http://vpn:5080
QBITTORRENT_USERNAME=admin
QBITTORRENT_PASSWORD=your_qbittorrent_password
```

For Radarr, Sonarr, and Prowlarr, get the API key from each app's UI under `Settings` -> `General` -> `Security` / `API Key`.

For SABnzbd, get the API key from `Config` -> `General` -> `Security` / `API Key`.

For qBittorrent, use the WebUI URL and WebUI username/password.

## Docker Networking On QNAP

The included [docker-compose.yml](docker-compose.yml) expects an existing external Docker network named `media-stack`:

```yaml
networks:
  media-stack:
    external: true
```

List Docker networks on the QNAP:

```bash
docker network ls
```

Inspect which networks your existing media containers use:

```bash
docker inspect radarr --format '{{json .NetworkSettings.Networks}}'
docker inspect sonarr --format '{{json .NetworkSettings.Networks}}'
docker inspect prowlarr --format '{{json .NetworkSettings.Networks}}'
docker inspect sabnzbd --format '{{json .NetworkSettings.Networks}}'
docker inspect vpn --format '{{json .NetworkSettings.Networks}}'
```

If `media-stack` already exists and your media containers are on it, no compose change is needed.

If your media stack uses a different network name, update `docker-compose.yml` to use that network instead of `media-stack`.

If the network does not exist, create it:

```bash
docker network create media-stack
```

Then attach existing containers as needed:

```bash
docker network connect media-stack radarr
docker network connect media-stack sonarr
docker network connect media-stack prowlarr
docker network connect media-stack sabnzbd
docker network connect media-stack vpn
```

When this MCP container shares a Docker network with your media apps, use container DNS names:

```env
RADARR_URL=http://radarr:7878
SONARR_URL=http://sonarr:8989
PROWLARR_URL=http://prowlarr:9696
SABNZBD_URL=http://sabnzbd:8080
QBITTORRENT_URL=http://vpn:5080
```

If it does not share a Docker network, use your QNAP or LAN IP instead:

```env
RADARR_URL=http://<qnap-ip>:7878
SONARR_URL=http://<qnap-ip>:8989
PROWLARR_URL=http://<qnap-ip>:9696
SABNZBD_URL=http://<qnap-ip>:8080
QBITTORRENT_URL=http://<qnap-ip>:5080
```

If qBittorrent runs behind Gluetun and the WebUI is exposed by the VPN/Gluetun container, use the container that exposes the WebUI. Commonly:

```env
QBITTORRENT_URL=http://vpn:5080
```

## Validate The Deployment

Check container status:

```bash
docker compose ps
```

Check logs:

```bash
docker compose logs -f media-stack-mcp
```

Check the health endpoint:

```bash
curl http://<qnap-ip>:3000/healthz
```

Expected response:

```json
{"ok":true,"name":"media-stack-mcp","transport":"http"}
```

Check the Cloudflare HTTPS health endpoint:

```bash
curl https://mcp.yourdomain.com/healthz
```

Expected response:

```json
{"ok":true,"name":"media-stack-mcp","transport":"http"}
```

Check that `/mcp` rejects unauthenticated requests:

```bash
curl -i -X POST http://<qnap-ip>:3000/mcp \
  -H 'Content-Type: application/json' \
  -d '{}'
```

Expected status:

```text
401 Unauthorized
```

Check that the public HTTPS `/mcp` endpoint also rejects unauthenticated requests:

```bash
curl -i -X POST https://mcp.yourdomain.com/mcp \
  -H 'Content-Type: application/json' \
  -d '{}'
```

Expected status:

```text
401 Unauthorized
```

MCP clients must call `/mcp` with:

```http
Authorization: Bearer <MCP_HTTP_TOKEN>
```

## MCP Client Config

Use this shape for clients that support remote Streamable HTTP MCP servers:

```json
{
  "mcpServers": {
    "media-stack": {
      "url": "https://mcp.yourdomain.com/mcp",
      "headers": {
        "Authorization": "Bearer your_long_random_token"
      }
    }
  }
}
```

Replace `mcp.yourdomain.com` with your Cloudflare Tunnel hostname and `your_long_random_token` with `MCP_HTTP_TOKEN` from `.env`.

HTTP MCP sessions are stored in memory. Restarting the container resets active MCP sessions, which is expected.

## Operations

Start or update after config changes:

```bash
docker compose up -d --build
```

Stop:

```bash
docker compose down
```

Restart:

```bash
docker compose restart media-stack-mcp
```

Follow logs:

```bash
docker compose logs -f media-stack-mcp
```

Follow Cloudflare Tunnel logs:

```bash
docker compose logs -f cloudflared
```

Pull the latest code and rebuild:

```bash
git pull && docker compose up -d --build
```

## Troubleshooting

### `.env` Not Found

Create the runtime env file:

```bash
cp .env.example .env
vi .env
```

### `network media-stack declared as external, but could not be found`

Create the expected network:

```bash
docker network create media-stack
```

Or edit `docker-compose.yml` to use the Docker network your media containers already use.

### `MCP_HTTP_TOKEN is required when MCP_TRANSPORT=http`

Set a token in `.env`:

```env
MCP_HTTP_TOKEN=use_a_long_random_secret_here
```

Then restart:

```bash
docker compose up -d --build
```

### `CLOUDFLARED_TOKEN` Is Missing Or Invalid

Create a Cloudflare Tunnel in the Cloudflare Zero Trust dashboard, copy the Docker tunnel token, and set:

```env
CLOUDFLARED_TOKEN=your_cloudflare_tunnel_token
```

Then restart with the `cloudflare` profile and check logs:

```bash
docker compose --profile cloudflare up -d --build
docker compose logs -f cloudflared
```

### Cloudflare Tunnel Shows `502` Or Cannot Reach The Service

In the Cloudflare Tunnel public hostname settings, the service target should be:

```text
http://media-stack-mcp:3000
```

Confirm both containers are on the same Docker network:

```bash
docker compose ps
docker inspect media-stack-mcp --format '{{json .NetworkSettings.Networks}}'
docker inspect media-stack-mcp-cloudflared --format '{{json .NetworkSettings.Networks}}'
```

### Claude Cannot Connect To The MCP URL

Use the public Cloudflare URL in Claude:

```text
https://mcp.yourdomain.com/mcp
```

Do not use these in Claude remote MCP/custom connector setup:

```text
http://<qnap-ip>:3000/mcp
http://localhost:3000/mcp
https://<qnap-ip>:3000/mcp
```

Then validate from outside your LAN if possible:

```bash
curl https://mcp.yourdomain.com/healthz
```

If health works but Claude still fails, check that Claude has the bearer token header exactly:

```http
Authorization: Bearer <MCP_HTTP_TOKEN>
```

Also confirm Cloudflare is not presenting an Access login page or other browser challenge in front of `/mcp`.

### Public HTTPS URL Returns Host Header Errors

Set `MCP_ALLOWED_HOSTS` to your Cloudflare Tunnel hostname:

```env
MCP_ALLOWED_HOSTS=mcp.yourdomain.com
```

Then restart:

```bash
docker compose restart media-stack-mcp
```

### `401 Unauthorized`

Your MCP client is missing the bearer token or using the wrong token. Configure:

```http
Authorization: Bearer <MCP_HTTP_TOKEN>
```

### Media App Connection Failures

Check that each URL works from inside the MCP container's network. If container names do not resolve, either attach the MCP container to the same Docker network or use LAN IP URLs.

Common same-network URLs:

```env
RADARR_URL=http://radarr:7878
SONARR_URL=http://sonarr:8989
PROWLARR_URL=http://prowlarr:9696
SABNZBD_URL=http://sabnzbd:8080
```

Common LAN URLs:

```env
RADARR_URL=http://<qnap-ip>:7878
SONARR_URL=http://<qnap-ip>:8989
PROWLARR_URL=http://<qnap-ip>:9696
SABNZBD_URL=http://<qnap-ip>:8080
```

Also confirm the API key is copied from the matching app, not another service.

### qBittorrent Auth Failure

Confirm `QBITTORRENT_URL` points to the WebUI endpoint and that the WebUI credentials are correct:

```env
QBITTORRENT_URL=http://vpn:5080
QBITTORRENT_USERNAME=admin
QBITTORRENT_PASSWORD=your_qbittorrent_password
```

If you use Gluetun, the correct host is often the VPN/Gluetun container rather than a separate `qbittorrent` container.

## Current MCP Tools

### Health

- `media_health_check`

### Radarr

- `radarr_lookup_movie`
- `radarr_add_movie`
- `radarr_get_queue`

### Sonarr

- `sonarr_lookup_series`
- `sonarr_add_series`
- `sonarr_get_queue`

### SABnzbd

- `sabnzbd_get_queue`
- `sabnzbd_pause`
- `sabnzbd_resume`

### Prowlarr

- `prowlarr_search`
- `prowlarr_test_indexers`

### qBittorrent

- `qbittorrent_list_torrents`
- `qbittorrent_pause_all`
- `qbittorrent_resume_all`

## Local Stdio Mode

For local process-spawned MCP clients, set:

```env
MCP_TRANSPORT=stdio
```

Install and build locally:

```bash
corepack enable
pnpm install
pnpm run build
```

Example local stdio MCP config:

```json
{
  "mcpServers": {
    "media-stack": {
      "command": "node",
      "args": ["/path/to/media-stack-mcp/dist/index.js"],
      "env": {
        "MCP_TRANSPORT": "stdio",
        "RADARR_URL": "http://<qnap-ip>:7878",
        "RADARR_API_KEY": "your_key",
        "SONARR_URL": "http://<qnap-ip>:8989",
        "SONARR_API_KEY": "your_key",
        "SABNZBD_URL": "http://<qnap-ip>:8080",
        "SABNZBD_API_KEY": "your_key",
        "PROWLARR_URL": "http://<qnap-ip>:9696",
        "PROWLARR_API_KEY": "your_key",
        "QBITTORRENT_URL": "http://<qnap-ip>:5080",
        "QBITTORRENT_USERNAME": "admin",
        "QBITTORRENT_PASSWORD": "your_password"
      }
    }
  }
}
```

## Security

Do not expose port `3000` directly to the public internet.

Use Cloudflare Tunnel for Claude HTTPS connectivity instead of opening inbound ports on the QNAP. Keep bearer-token auth enabled, use a long random `MCP_HTTP_TOKEN`, set `MCP_ALLOWED_HOSTS` to your public tunnel hostname, and rotate both `MCP_HTTP_TOKEN` and `CLOUDFLARED_TOKEN` if either value is shared or exposed.
