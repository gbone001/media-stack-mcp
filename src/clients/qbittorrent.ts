import axios, { AxiosInstance } from 'axios';

export class QBittorrentClient {
  private client: AxiosInstance;
  private cookie = '';

  constructor(private baseUrl: string, private username: string, private password: string) {
    this.client = axios.create({ baseURL: baseUrl, timeout: 30_000 });
  }

  private async login() {
    const params = new URLSearchParams({ username: this.username, password: this.password });
    const response = await this.client.post('/api/v2/auth/login', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const cookie = response.headers['set-cookie']?.[0];
    if (!cookie) throw new Error('qBittorrent login failed: no cookie returned');
    this.cookie = cookie;
  }

  private async request<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.cookie) await this.login();
    try {
      return await fn();
    } catch (error: any) {
      if (error.response?.status === 403) {
        await this.login();
        return await fn();
      }
      throw error;
    }
  }

  async appVersion() {
    return this.request(async () => (await this.client.get('/api/v2/app/version', { headers: { Cookie: this.cookie } })).data);
  }

  async torrents(filter?: string) {
    return this.request(async () => (await this.client.get('/api/v2/torrents/info', { params: { filter }, headers: { Cookie: this.cookie } })).data);
  }

  async pauseAll() {
    return this.request(async () => (await this.client.post('/api/v2/torrents/pause', 'hashes=all', { headers: { Cookie: this.cookie, 'Content-Type': 'application/x-www-form-urlencoded' } })).data);
  }

  async resumeAll() {
    return this.request(async () => (await this.client.post('/api/v2/torrents/resume', 'hashes=all', { headers: { Cookie: this.cookie, 'Content-Type': 'application/x-www-form-urlencoded' } })).data);
  }
}
