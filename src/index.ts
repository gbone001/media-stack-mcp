import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import express, { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { env, mcpAllowedHosts } from './config/env.js';
import { createMediaStackServer } from './server.js';

async function startStdio() {
  const server = createMediaStackServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

function requireBearerToken(req: Request, res: Response, next: NextFunction) {
  const expected = `Bearer ${env.MCP_HTTP_TOKEN}`;
  const actual = req.header('authorization');

  if (actual !== expected) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}

async function startHttp() {
  if (!env.MCP_HTTP_TOKEN) {
    throw new Error('MCP_HTTP_TOKEN is required when MCP_TRANSPORT=http');
  }

  const app = createMcpExpressApp({
    host: env.MCP_HTTP_HOST,
    allowedHosts: mcpAllowedHosts
  });
  const transports = new Map<string, StreamableHTTPServerTransport>();

  app.use(express.json({ limit: '2mb' }));

  app.get('/healthz', (_req, res) => {
    res.json({
      ok: true,
      name: env.MCP_SERVER_NAME,
      transport: env.MCP_TRANSPORT
    });
  });

  app.all(env.MCP_HTTP_PATH, requireBearerToken, async (req, res) => {
    try {
      const sessionId = req.header('mcp-session-id');
      let transport = sessionId ? transports.get(sessionId) : undefined;

      if (!transport) {
        if (sessionId) {
          res.status(404).json({ error: 'Session not found' });
          return;
        }

        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: randomUUID,
          onsessioninitialized: initializedSessionId => {
            transports.set(initializedSessionId, transport!);
          },
          onsessionclosed: closedSessionId => {
            transports.delete(closedSessionId);
          }
        });

        transport.onclose = () => {
          if (transport?.sessionId) {
            transports.delete(transport.sessionId);
          }
        };

        const server = createMediaStackServer();
        await server.connect(transport);
      }

      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`MCP HTTP request failed: ${message}`);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  });

  const httpServer = app.listen(env.MCP_HTTP_PORT, env.MCP_HTTP_HOST, () => {
    console.error(`${env.MCP_SERVER_NAME} listening on http://${env.MCP_HTTP_HOST}:${env.MCP_HTTP_PORT}${env.MCP_HTTP_PATH}`);
  });

  const shutdown = async () => {
    httpServer.close();
    await Promise.all([...transports.values()].map(transport => transport.close()));
  };

  process.on('SIGINT', () => {
    void shutdown().finally(() => process.exit(0));
  });
  process.on('SIGTERM', () => {
    void shutdown().finally(() => process.exit(0));
  });
}

if (env.MCP_TRANSPORT === 'http') {
  await startHttp();
} else {
  await startStdio();
}
