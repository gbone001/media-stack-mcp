import { createApiClient } from './http.js';

export class SonarrClient {
  private client;

  constructor(baseUrl: string, apiKey: string) {
    this.client = createApiClient(baseUrl, apiKey);
  }

  async systemStatus() {
    return (await this.client.get('/api/v3/system/status')).data;
  }

  async lookupSeries(term: string) {
    return (await this.client.get('/api/v3/series/lookup', { params: { term } })).data;
  }

  async addSeries(input: {
    title: string;
    tvdbId: number;
    qualityProfileId: number;
    rootFolderPath: string;
    languageProfileId?: number;
    monitored?: boolean;
    seasonFolder?: boolean;
    searchForMissingEpisodes?: boolean;
  }) {
    const payload = {
      title: input.title,
      tvdbId: input.tvdbId,
      qualityProfileId: input.qualityProfileId,
      rootFolderPath: input.rootFolderPath,
      monitored: input.monitored ?? true,
      seasonFolder: input.seasonFolder ?? true,
      addOptions: { searchForMissingEpisodes: input.searchForMissingEpisodes ?? true }
    };
    return (await this.client.post('/api/v3/series', payload)).data;
  }

  async queue() {
    return (await this.client.get('/api/v3/queue', { params: { page: 1, pageSize: 100 } })).data;
  }
}
