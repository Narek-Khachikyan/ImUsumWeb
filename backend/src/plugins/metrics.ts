import metrics from 'fastify-metrics';
import fp from 'fastify-plugin';

export default fp(async (app) => {
  await app.register(metrics as any, {
    endpoint: '/metrics',
    defaultMetrics: {
      enabled: true,
    },
    routeMetrics: {
      enabled: true,
    },
  } as any);
});
