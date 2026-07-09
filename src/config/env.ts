import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  MCP_SERVER_NAME: z.string().default('media-stack-mcp'),
  MCP_TRANSPORT: z.enum(['stdio', 'http']).default('stdio'),
  MCP_HTTP_HOST: z.string().default('0.0.0.0'),
  MCP_HTTP_PORT: z.coerce.number().int().positive().default(3000),
  MCP_HTTP_PATH: z.string().default('/mcp'),
  MCP_HTTP_TOKEN: z.string().optional(),
  MCP_ALLOWED_HOSTS: z.string().optional(),
  LOG_LEVEL: z.string().default('info'),

  RADARR_URL: z.string().url().optional(),
  RADARR_API_KEY: z.string().optional(),

  SONARR_URL: z.string().url().optional(),
  SONARR_API_KEY: z.string().optional(),

  PROWLARR_URL: z.string().url().optional(),
  PROWLARR_API_KEY: z.string().optional(),

  SABNZBD_URL: z.string().url().optional(),
  SABNZBD_API_KEY: z.string().optional(),

  QBITTORRENT_URL: z.string().url().optional(),
  QBITTORRENT_USERNAME: z.string().optional(),
  QBITTORRENT_PASSWORD: z.string().optional()
});

export const env = EnvSchema.parse(process.env);

export const mcpAllowedHosts = env.MCP_ALLOWED_HOSTS
  ? env.MCP_ALLOWED_HOSTS.split(',').map(host => host.trim()).filter(Boolean)
  : undefined;

export function requireSetting(name: keyof typeof env): string {
  const value = env[name];
  if (!value || typeof value !== 'string') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
