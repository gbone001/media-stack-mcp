import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { clients, requireClient } from './context.js';
import { jsonText, errorText } from '../utils/result.js';

async function safe(handler: () => Promise<unknown>) {
  try {
    return jsonText(await handler());
  } catch (error) {
    return errorText(error instanceof Error ? error.message : String(error));
  }
}

export function registerTools(server: McpServer) {
  server.tool('media_health_check', 'Check connectivity and versions for the configured media apps.', {}, async () => {
    return safe(async () => {
      const c = clients();
      const results: Record<string, unknown> = {};
      if (c.radarr) results.radarr = await c.radarr.systemStatus();
      if (c.sonarr) results.sonarr = await c.sonarr.systemStatus();
      if (c.prowlarr) results.prowlarr = await c.prowlarr.systemStatus();
      if (c.sabnzbd) results.sabnzbd = await c.sabnzbd.version();
      if (c.qbittorrent) results.qbittorrent = await c.qbittorrent.appVersion();
      return results;
    });
  });

  server.tool('radarr_lookup_movie', 'Search Radarr/TMDB for a movie by title.', { term: z.string() }, async ({ term }) => {
    return safe(async () => requireClient(clients().radarr, 'Radarr').lookupMovie(term));
  });

  server.tool('radarr_add_movie', 'Add a movie to Radarr by TMDB ID. Use radarr_lookup_movie first.', {
    title: z.string(),
    tmdbId: z.number(),
    qualityProfileId: z.number(),
    rootFolderPath: z.string(),
    monitored: z.boolean().optional(),
    searchForMovie: z.boolean().optional(),
    minimumAvailability: z.string().optional()
  }, async (input) => {
    return safe(async () => requireClient(clients().radarr, 'Radarr').addMovie(input));
  });

  server.tool('radarr_get_queue', 'Get Radarr download/import queue.', {}, async () => {
    return safe(async () => requireClient(clients().radarr, 'Radarr').queue());
  });

  server.tool('sonarr_lookup_series', 'Search Sonarr/TVDB for a TV series by title.', { term: z.string() }, async ({ term }) => {
    return safe(async () => requireClient(clients().sonarr, 'Sonarr').lookupSeries(term));
  });

  server.tool('sonarr_add_series', 'Add a TV series to Sonarr by TVDB ID. Use sonarr_lookup_series first.', {
    title: z.string(),
    tvdbId: z.number(),
    qualityProfileId: z.number(),
    rootFolderPath: z.string(),
    monitored: z.boolean().optional(),
    seasonFolder: z.boolean().optional(),
    searchForMissingEpisodes: z.boolean().optional()
  }, async (input) => {
    return safe(async () => requireClient(clients().sonarr, 'Sonarr').addSeries(input));
  });

  server.tool('sonarr_get_queue', 'Get Sonarr download/import queue.', {}, async () => {
    return safe(async () => requireClient(clients().sonarr, 'Sonarr').queue());
  });

  server.tool('sabnzbd_get_queue', 'Get SABnzbd queue.', {}, async () => {
    return safe(async () => requireClient(clients().sabnzbd, 'SABnzbd').queue());
  });

  server.tool('sabnzbd_pause', 'Pause SABnzbd.', {}, async () => {
    return safe(async () => requireClient(clients().sabnzbd, 'SABnzbd').pause());
  });

  server.tool('sabnzbd_resume', 'Resume SABnzbd.', {}, async () => {
    return safe(async () => requireClient(clients().sabnzbd, 'SABnzbd').resume());
  });

  server.tool('prowlarr_search', 'Search Prowlarr indexers.', {
    query: z.string(),
    type: z.enum(['search', 'movie', 'tvsearch']).optional()
  }, async ({ query, type }) => {
    return safe(async () => requireClient(clients().prowlarr, 'Prowlarr').search(query, type));
  });

  server.tool('prowlarr_test_indexers', 'Return Prowlarr indexers. Use this before testing individual indexers.', {}, async () => {
    return safe(async () => requireClient(clients().prowlarr, 'Prowlarr').indexers());
  });

  server.tool('qbittorrent_list_torrents', 'List qBittorrent torrents.', {
    filter: z.string().optional()
  }, async ({ filter }) => {
    return safe(async () => requireClient(clients().qbittorrent, 'qBittorrent').torrents(filter));
  });

  server.tool('qbittorrent_pause_all', 'Pause all qBittorrent torrents.', {}, async () => {
    return safe(async () => requireClient(clients().qbittorrent, 'qBittorrent').pauseAll());
  });

  server.tool('qbittorrent_resume_all', 'Resume all qBittorrent torrents.', {}, async () => {
    return safe(async () => requireClient(clients().qbittorrent, 'qBittorrent').resumeAll());
  });
}
