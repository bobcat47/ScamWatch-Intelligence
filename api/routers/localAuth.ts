import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { APP_SECRET } from "../const";

export const localAuthRouter = createRouter({
  // Register with email/password
  register: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6).max(100),
        name: z.string().min(1).max(100),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Check if email already exists
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists",
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, 12);

      // Create user
      const result = await db.insert(users).values({
        email: input.email,
        password: hashedPassword,
        name: input.name,
        authType: "local",
      });

      const userId = Number((result as unknown as { insertId: number }).insertId);

      // Generate JWT token
      const token = await new SignJWT({
        userId: userId,
        email: input.email,
        name: input.name,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(APP_SECRET);

      return {
        success: true,
        token,
        user: {
          id: userId,
          email: input.email,
          name: input.name,
        },
      };
    }),

  // Login with email/password
  login: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Find user by email
      const userRows = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (userRows.length === 0) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      const user = userRows[0];

      // Check password
      if (!user.password) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "This account uses social login. Please use the Kimi sign-in button.",
        });
      }

      const valid = await bcrypt.compare(input.password, user.password);
      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // Update last sign in
      await db
        .update(users)
        .set({ lastSignInAt: new Date() })
        .where(eq(users.id, user.id));

      // Generate JWT token
      const token = await new SignJWT({
        userId: user.id,
        email: user.email,
        name: user.name,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(APP_SECRET);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
        },
      };
    }),
});
