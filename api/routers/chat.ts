import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { chatMessages } from "@db/schema";
import { desc, sql } from "drizzle-orm";

export const chatRouter = createRouter({
  // Send a new chat message
  send: publicQuery
    .input(
      z.object({
        displayName: z.string().min(1).max(50),
        message: z.string().min(1).max(1000),
        country: z.string().max(50).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.insert(chatMessages).values({
        displayName: input.displayName,
        message: input.message,
        country: input.country || null,
      });
      return { success: true };
    }),

  // List recent chat messages
  list: publicQuery
    .input(
      z.object({
        limit: z.number().min(1).max(200).default(100),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const messages = await db
        .select()
        .from(chatMessages)
        .orderBy(desc(chatMessages.sentAt))
        .limit(input?.limit || 100);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(chatMessages);

      return {
        messages: messages.reverse(), // oldest first for chat display
        total: countResult[0]?.count || 0,
      };
    }),
});
