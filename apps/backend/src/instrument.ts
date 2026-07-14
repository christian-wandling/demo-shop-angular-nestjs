import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

const { NODE_ENV, SENTRY_DEMO_SHOP_API_DSN } = process.env;
const isProd = NODE_ENV === 'production';

if (SENTRY_DEMO_SHOP_API_DSN) {
  Sentry.init({
    environment: NODE_ENV,
    dsn: SENTRY_DEMO_SHOP_API_DSN,
    integrations: [nodeProfilingIntegration(), Sentry.prismaIntegration()],
    tracesSampleRate: isProd ? 0.5 : 1.0, //  Capture 100% of the transactions
    beforeSend(event) {
      const isNotHealthCheck = !event.request?.url?.includes('health-check');

      if (event.request?.data && typeof event.request.data === 'object') {
        delete (event.request.data as Record<string, unknown>).password;
      }

      if (isNotHealthCheck) {
        return event;
      } else {
        return null;
      }
    },
  });
}
