import { createRouter, publicQuery } from "./middleware";
import { authRouter } from "./auth-router";
import { localAuthRouter } from "./routers/localAuth";
import { reportRouter } from "./routers/report";
import { chatRouter } from "./routers/chat";
import { identityRouter } from "./routers/identity";
import { callShieldRouter } from "./routers/callShield";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  localAuth: localAuthRouter,
  report: reportRouter,
  chat: chatRouter,
  identity: identityRouter,
  callShield: callShieldRouter,
});

export type AppRouter = typeof appRouter;
