import { buildApp } from './app.js';

const app = buildApp();
const host = process.env.HOST ?? '127.0.0.1';
const port = Number.parseInt(process.env.PORT ?? '3001', 10);

try {
  await app.listen({ host, port });
} catch (error: unknown) {
  app.log.error(error);
  process.exitCode = 1;
}
