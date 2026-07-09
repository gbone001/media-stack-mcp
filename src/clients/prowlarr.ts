import { createApiClient } from './http.js';

export class ProwlarrClient {
  private client;

  constructor(baseUrl: string, apiKey: string) {
    this.client = createApiClient(baseUrl, apiKey);
  }

  async systemStatus() {
    return (await this.client.get('/api/v1/system/status')).data;
  }

  async search(query: string, type: 'search' | 'movie' | 'tvsearch' = 'search') {
    return (await this.client.get('/api/v1/search', { params: { query, type } })).data;
  }

  async indexers() {
    return (await this.client.get('/api/v1/indexer')).data;
  }

  async testIndexer(id: number) {
    return (await this.client.post(`/api/v1/indexer/test/${id}`)).data;
  }
}
