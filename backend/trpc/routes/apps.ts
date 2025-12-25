import { TRPCError } from '@trpc/server';
import * as z from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure, adminProcedure } from '../create-context';
import type { App } from '../../db/schema';

export const appsRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        status: z.enum(['pending', 'approved', 'rejected']).optional(),
        search: z.string().optional(),
      })
    )
    .query(({ input, ctx }) => {
      let apps = Array.from(ctx.db.apps.values());

      if (input.status) {
        apps = apps.filter((app) => app.status === input.status);
      }

      if (input.search) {
        const searchLower = input.search.toLowerCase();
        apps = apps.filter(
          (app) =>
            app.name.toLowerCase().includes(searchLower) ||
            app.description.toLowerCase().includes(searchLower)
        );
      }

      apps.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return apps;
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input, ctx }) => {
      const app = ctx.db.apps.get(input.id);

      if (!app) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'App not found',
        });
      }

      return app;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2),
        packageName: z.string().min(3),
        description: z.string().min(10),
        version: z.string(),
        iconUrl: z.string().url(),
        apkUrl: z.string().url(),
        fileSize: z.number(),
      })
    )
    .mutation(({ input, ctx }) => {
      const user = ctx.db.users.get(ctx.userId);

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      const appId = `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const newApp: App = {
        id: appId,
        name: input.name,
        packageName: input.packageName,
        description: input.description,
        version: input.version,
        iconUrl: input.iconUrl,
        apkUrl: input.apkUrl,
        fileSize: input.fileSize,
        status: 'pending',
        uploaderId: user.id,
        uploaderName: user.name,
        downloads: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      ctx.db.apps.set(appId, newApp);

      return newApp;
    }),

  myApps: protectedProcedure.query(({ ctx }) => {
    const apps = Array.from(ctx.db.apps.values()).filter(
      (app) => app.uploaderId === ctx.userId
    );

    apps.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return apps;
  }),

  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['approved', 'rejected']),
        rejectionReason: z.string().optional(),
      })
    )
    .mutation(({ input, ctx }) => {
      const app = ctx.db.apps.get(input.id);

      if (!app) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'App not found',
        });
      }

      app.status = input.status;
      app.updatedAt = new Date();

      if (input.status === 'rejected' && input.rejectionReason) {
        app.rejectionReason = input.rejectionReason;
      } else {
        app.rejectionReason = undefined;
      }

      ctx.db.apps.set(app.id, app);

      return app;
    }),

  incrementDownloads: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input, ctx }) => {
      const app = ctx.db.apps.get(input.id);

      if (!app) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'App not found',
        });
      }

      app.downloads += 1;
      ctx.db.apps.set(app.id, app);

      return app;
    }),
});
