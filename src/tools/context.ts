import { env, requireSetting } from '../config/env.js';
import { RadarrClient } from '../clients/radarr.js';
import { SonarrClient } from '../clients/sonarr.js';
import { ProwlarrClient } from '../clients/prowlarr.js';
import { SabnzbdClient } from '../clients/sabnzbd.js';
import { QBittorrentClient } from '../clients/qbittorrent.js';

export function clients() {
  return {
    radarr: env.RADARR_URL && env.RADARR_API_KEY ? new RadarrClient(env.RADARR_URL, env.RADARR_API_KEY) : undefined,
    sonarr: env.SONARR_URL && env.SONARR_API_KEY ? new SonarrClient(env.SONARR_URL, env.SONARR_API_KEY) : undefined,
    prowlarr: env.PROWLARR_URL && env.PROWLARR_API_KEY ? new ProwlarrClient(env.PROWLARR_URL, env.PROWLARR_API_KEY) : undefined,
    sabnzbd: env.SABNZBD_URL && env.SABNZBD_API_KEY ? new SabnzbdClient(env.SABNZBD_URL, env.SABNZBD_API_KEY) : undefined,
    qbittorrent: env.QBITTORRENT_URL && env.QBITTORRENT_USERNAME && env.QBITTORRENT_PASSWORD
      ? new QBittorrentClient(env.QBITTORRENT_URL, env.QBITTORRENT_USERNAME, env.QBITTORRENT_PASSWORD)
      : undefined
  };
}

export function requireClient<T>(client: T | undefined, name: string): T {
  if (!client) throw new Error(`${name} is not configured. Check .env values.`);
  return client;
}

/**
 * Reports which media apps are configured, and for those that are, the base URL
 * they will be reached at. Never includes API keys or passwords, so it is safe
 * to write to logs.
 */
export function configuredApps() {
  return [
    { name: 'radarr', configured: Boolean(env.RADARR_URL && env.RADARR_API_KEY), url: env.RADARR_URL },
    { name: 'sonarr', configured: Boolean(env.SONARR_URL && env.SONARR_API_KEY), url: env.SONARR_URL },
    { name: 'prowlarr', configured: Boolean(env.PROWLARR_URL && env.PROWLARR_API_KEY), url: env.PROWLARR_URL },
    { name: 'sabnzbd', configured: Boolean(env.SABNZBD_URL && env.SABNZBD_API_KEY), url: env.SABNZBD_URL },
    {
      name: 'qbittorrent',
      configured: Boolean(env.QBITTORRENT_URL && env.QBITTORRENT_USERNAME && env.QBITTORRENT_PASSWORD),
      url: env.QBITTORRENT_URL
    }
  ];
}
