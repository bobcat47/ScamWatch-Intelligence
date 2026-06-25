import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { users } from "@db/schema";
import { authenticateRequest } from "./kimi/auth";
import { jwtVerify } from "jose";
import { APP_SECRET } from "./const";
import { getDb } from "./queries/connection";
import { users as usersTable } from "@db/schema";
import { eq } from "drizzle-orm";

type User = typeof users.$inferSelect;

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

async function authenticateLocalUser(headers: Headers): Promise<User | undefined> {
  const authHeader = headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return undefined;

  const token = authHeader.slice(7);
  try {
    const { payload } = await jwtVerify(token, APP_SECRET, { clockTolerance: 60 });
    const userId = payload.userId as number;
    if (!userId) return undefined;

    const db = getDb();
    const rows = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    return rows[0];
  } catch {
    return undefined;
  }
}

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };

  // Try Kimi OAuth first
  try {
    ctx.user = await authenticateRequest(opts.req.headers);
  } catch {
    // Kimi auth failed, try local auth
  }

  // If no Kimi user, try local auth Bearer token
  if (!ctx.user) {
    try {
      ctx.user = await authenticateLocalUser(opts.req.headers);
    } catch {
      // No auth at all
    }
  }

  return ctx;
}
