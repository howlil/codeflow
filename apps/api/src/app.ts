import { buildSampleRequestFlow } from '@codeflow/analysis-core';
import Fastify, { type FastifyInstance } from 'fastify';

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: false });

  app.get('/health', async () => ({
    status: 'ok',
    service: 'codeflow-api',
  }));

  app.get('/api/flows/sample', async () => buildSampleRequestFlow());

  return app;
}
