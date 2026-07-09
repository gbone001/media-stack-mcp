import axios from 'axios';

export class SabnzbdClient {
  constructor(private baseUrl: string, private apiKey: string) {}

  private async call(mode: string, extraParams: Record<string, string | number | boolean> = {}) {
    const response = await axios.get(`${this.baseUrl}/api`, {
      timeout: 30_000,
      params: {
        apikey: this.apiKey,
        output: 'json',
        mode,
        ...extraParams
      }
    });
    return response.data;
  }

  async queue() {
    return this.call('queue');
  }

  async history(limit = 50) {
    return this.call('history', { limit });
  }

  async pause() {
    return this.call('pause');
  }

  async resume() {
    return this.call('resume');
  }

  async version() {
    return this.call('version');
  }
}
