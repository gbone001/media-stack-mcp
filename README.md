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
RADARR_URL=http://192.168.1.151:7878
SONARR_URL=http://192.168.1.151:8989
PROWLARR_URL=http://192.168.1.151:9696
SABNZBD_URL=http://192.168.1.151:8080
QBITTORRENT_URL=http://192.168.1.151:5080
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

## Required `.env` Values

These MCP settings should be present for QNAP Docker mode:

```env
MCP_SERVER_NAME=media-stack-mcp
MCP_TRANSPORT=http
MCP_HTTP_HOST=0.0.0.0
MCP_HTTP_PORT=3000
MCP_HTTP_PATH=/mcp
MCP_HTTP_TOKEN=use_a_long_random_secret_here
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
RADARR_URL=http://192.168.1.151:7878
SONARR_URL=http://192.168.1.151:8989
PROWLARR_URL=http://192.168.1.151:9696
SABNZBD_URL=http://192.168.1.151:8080
QBITTORRENT_URL=http://192.168.1.151:5080
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
      "url": "http://192.168.1.151:3000/mcp",
      "headers": {
        "Authorization": "Bearer your_long_random_token"
      }
    }
  }
}
```

Replace `192.168.1.151` with your QNAP IP and `your_long_random_token` with `MCP_HTTP_TOKEN` from `.env`.

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
RADARR_URL=http://192.168.1.151:7878
SONARR_URL=http://192.168.1.151:8989
PROWLARR_URL=http://192.168.1.151:9696
SABNZBD_URL=http://192.168.1.151:8080
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
        "RADARR_URL": "http://192.168.1.151:7878",
        "RADARR_API_KEY": "your_key",
        "SONARR_URL": "http://192.168.1.151:8989",
        "SONARR_API_KEY": "your_key",
        "SABNZBD_URL": "http://192.168.1.151:8080",
        "SABNZBD_API_KEY": "your_key",
        "PROWLARR_URL": "http://192.168.1.151:9696",
        "PROWLARR_API_KEY": "your_key",
        "QBITTORRENT_URL": "http://192.168.1.151:5080",
        "QBITTORRENT_USERNAME": "admin",
        "QBITTORRENT_PASSWORD": "your_password"
      }
    }
  }
}
```

## Security

Do not expose port `3000` directly to the public internet.

Use LAN/VPN access only unless the service is behind HTTPS, a reverse proxy, and strong access control. Rotate `MCP_HTTP_TOKEN` if it is shared or exposed.
