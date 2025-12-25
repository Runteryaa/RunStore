import { createTRPCRouter } from './create-context';
import { authRouter } from './routes/auth';
import { appsRouter } from './routes/apps';

export const appRouter = createTRPCRouter({
  auth: authRouter,
  apps: appsRouter,
});

export type AppRouter = typeof appRouter;
