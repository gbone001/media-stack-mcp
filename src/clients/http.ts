import axios, { AxiosInstance } from 'axios';

export function createApiClient(baseURL: string, apiKey?: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: 30_000,
    headers: apiKey ? { 'X-Api-Key': apiKey } : undefined
  });

  client.interceptors.response.use(
    response => response,
    error => {
      const status = error.response?.status;
      const body = error.response?.data;
      const url = error.config?.url;
      throw new Error(`API request failed${status ? ` (${status})` : ''} ${url ?? ''}: ${JSON.stringify(body ?? error.message)}`);
    }
  );

  return client;
}
