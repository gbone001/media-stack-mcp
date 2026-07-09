import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { env } from './config/env.js';
import { registerTools } from './tools/register.js';

export function createMediaStackServer() {
  const server = new McpServer({
    name: env.MCP_SERVER_NAME,
    version: '0.1.0'
  });

  registerTools(server);
  return server;
}
