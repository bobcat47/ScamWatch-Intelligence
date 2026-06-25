import { env } from "./lib/env";

/** Secret key for JWT signing/verification (local auth) */
export const APP_SECRET = new TextEncoder().encode(env.appSecret);
