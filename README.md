# media-stack-mcp

A starter Model Context Protocol server for controlling a media stack:

- Radarr
- Sonarr
- SABnzbd
- Prowlarr
- qBittorrent

This scaffold uses TypeScript, the official MCP SDK, Axios, Zod validation, Docker, and environment-based configuration.

## Quick start

```bash
cp .env.example .env
corepack enable
pnpm install
pnpm run dev
```

By default, `.env.example` is set up for QNAP/Docker HTTP mode. For local stdio MCP clients, set:

```env
MCP_TRANSPORT=stdio
```

## QNAP Docker deployment

Copy this project to your QNAP, then create and edit `.env`:

```bash
cp .env.example .env
vi .env
```

At minimum, change:

```env
MCP_HTTP_TOKEN=use_a_long_random_secret_here
```

If this container joins the same Docker network as your media stack, keep service/container names:

```env
RADARR_URL=http://radarr:7878
SONARR_URL=http://sonarr:8989
PROWLARR_URL=http://prowlarr:9696
SABNZBD_URL=http://sabnzbd:8080
QBITTORRENT_URL=http://vpn:5080
```

If it does not share the same Docker network, use your QNAP/LAN IP instead:

```env
RADARR_URL=http://192.168.1.151:7878
SONARR_URL=http://192.168.1.151:8989
PROWLARR_URL=http://192.168.1.151:9696
SABNZBD_URL=http://192.168.1.151:8080
QBITTORRENT_URL=http://192.168.1.151:5080
```

Build and run:

```bash
docker compose up -d --build
```

Health check:

```bash
curl http://<qnap-ip>:3000/healthz
```

The HTTP MCP endpoint is:

```text
http://<qnap-ip>:3000/mcp
```

MCP clients must send:

```http
Authorization: Bearer <MCP_HTTP_TOKEN>
```

## Important QNAP note

If your media containers are attached to an existing Docker network, update `docker-compose.yml` so `media-stack-mcp` joins the same network. If you use Gluetun for qBittorrent and qBittorrent is exposed through the VPN container, set:

```env
QBITTORRENT_URL=http://vpn:5080
```

## Current MCP tools

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

## Claude Desktop / MCP config example

```json
{
  "mcpServers": {
    "media-stack": {
      "command": "node",
      "args": ["/path/to/media-stack-mcp/dist/index.js"],
      "env": {
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

## HTTP MCP client config example

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

## Safety

This scaffold intentionally starts with limited write actions. Expand carefully. Avoid exposing this MCP server publicly without HTTPS, authentication, network isolation, and strong secrets.
