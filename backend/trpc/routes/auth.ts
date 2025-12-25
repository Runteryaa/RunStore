import { TRPCError } from '@trpc/server';
import * as z from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../create-context';
import { comparePassword, generateToken, hashPassword } from '../../utils/auth';
import type { User } from '../../db/schema';

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(2),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existingUser = Array.from(ctx.db.users.values()).find(
        (u) => u.email === input.email
      );

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User already exists',
        });
      }

      const hashedPassword = await hashPassword(input.password);
      const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const newUser: User = {
        id: userId,
        email: input.email,
        password: hashedPassword,
        name: input.name,
        role: 'user',
        createdAt: new Date(),
      };

      ctx.db.users.set(userId, newUser);

      const token = generateToken(newUser);

      return {
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        },
      };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = Array.from(ctx.db.users.values()).find(
        (u) => u.email === input.email
      );

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      const isValidPassword = await comparePassword(input.password, user.password);

      if (!isValidPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      const token = generateToken(user);

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    }),

  me: protectedProcedure.query(({ ctx }) => {
    const user = ctx.db.users.get(ctx.userId);

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }),
});
