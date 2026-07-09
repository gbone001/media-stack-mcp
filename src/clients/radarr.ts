import { createApiClient } from './http.js';

export class RadarrClient {
  private client;

  constructor(baseUrl: string, apiKey: string) {
    this.client = createApiClient(baseUrl, apiKey);
  }

  async systemStatus() {
    return (await this.client.get('/api/v3/system/status')).data;
  }

  async lookupMovie(term: string) {
    return (await this.client.get('/api/v3/movie/lookup', { params: { term } })).data;
  }

  async addMovie(input: {
    title: string;
    tmdbId: number;
    qualityProfileId: number;
    rootFolderPath: string;
    monitored?: boolean;
    searchForMovie?: boolean;
    minimumAvailability?: string;
  }) {
    const payload = {
      title: input.title,
      tmdbId: input.tmdbId,
      qualityProfileId: input.qualityProfileId,
      rootFolderPath: input.rootFolderPath,
      monitored: input.monitored ?? true,
      minimumAvailability: input.minimumAvailability ?? 'released',
      addOptions: { searchForMovie: input.searchForMovie ?? true }
    };
    return (await this.client.post('/api/v3/movie', payload)).data;
  }

  async queue() {
    return (await this.client.get('/api/v3/queue', { params: { page: 1, pageSize: 100 } })).data;
  }
}
