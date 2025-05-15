import fastify from 'fastify';

import { helloRoute } from './routes';

export function createBackendApi() {
  const app = fastify({ logger: false });

  // Register routes
  app.register(helloRoute);

  // Add health check endpoint
  app.get('/status', async () => {
    return { status: 'ok' };
  });

  return app;
}
