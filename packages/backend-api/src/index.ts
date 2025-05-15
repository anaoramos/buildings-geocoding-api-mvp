import { createBackendApi } from './api';

const start = async () => {
  const api = createBackendApi();

  const port = parseInt(process.env.PORT ?? '3000');
  const host = process.env.HOST ?? 'localhost';

  try {
    api.ready(() => {
      console.log(api.printRoutes());
    });

    await api.listen({ port, host });

    console.log(`\nServer is running: http://${host}:${port}\n`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
