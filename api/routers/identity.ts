import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { monitoredIdentities, breachAlerts } from "@db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { env } from "../lib/env";

// Simulated breach database for demo (used when no HIBP API key available)
const SIMULATED_BREACHES: Record<string, Array<{ name: string; date: string; description: string; dataClasses: string[] }>> = {
  "john.smith": [
    { name: "LinkedIn_2012", date: "2012-05-05", description: "Professional networking site breach — 117M accounts", dataClasses: ["Email addresses", "Passwords", "Usernames"] },
    { name: "Dropbox_2012", date: "2012-07-01", description: "Cloud storage service breach — 68M accounts", dataClasses: ["Email addresses", "Passwords"] },
  ],
  "johnsmith": [
    { name: "MySpace_2008", date: "2008-07-01", description: "Social network breach — 360M accounts", dataClasses: ["Email addresses", "Passwords", "Usernames"] },
    { name: "Adobe_2013", date: "2013-10-04", description: "Software company breach — 153M accounts", dataClasses: ["Email addresses", "Passwords", "Usernames", "Hints"] },
  ],
  "mike2020": [
    { name: "Canva_2019", date: "2019-05-24", description: "Design platform breach — 137M accounts", dataClasses: ["Email addresses", "Names", "Usernames", "Passwords"] },
  ],
  "sarah.jones": [
    { name: "Yahoo_2013", date: "2013-08-01", description: "Email service mega-breach — 3 billion accounts", dataClasses: ["Email addresses", "Names", "Passwords", "Phone numbers", "Security questions"] },
    { name: "Equifax_2017", date: "2017-09-01", description: "Credit bureau breach — 147M Americans affected", dataClasses: ["Names", "Social security numbers", "Birth dates", "Addresses"] },
  ],
  "david_wilson": [
    { name: "Twitch_2021", date: "2021-10-06", description: "Streaming platform breach — full source code leaked", dataClasses: ["Email addresses", "Usernames", "Passwords"] },
  ],
  "alex.m": [
    { name: "Facebook_2019", date: "2019-04-01", description: "Social media data exposure — 540M records exposed on public servers", dataClasses: ["Names", "Phone numbers", "Email addresses", "Usernames"] },
  ],
  "emma_brown": [
    { name: "Marriott_2018", date: "2018-11-30", description: "Hotel chain breach — 500M guest records", dataClasses: ["Names", "Passport numbers", "Email addresses", "Phone numbers"] },
  ],
  "chris_92": [
    { name: "Twitter_2022", date: "2022-07-01", description: "Social media breach — 5.4M user records", dataClasses: ["Email addresses", "Phone numbers", "Usernames"] },
  ],
};

const KNOWN_BREACHES = [
  { name: "Collection1_2019", date: "2019-01-07", description: "Massive credential stuffing list compiled from multiple breaches — 773M records", dataClasses: ["Email addresses", "Passwords"] },
  { name: "VerificationsIO_2019", date: "2019-02-25", description: "Email validation service exposed 809M records on public server", dataClasses: ["Email addresses", "Names", "Phone numbers", "Physical addresses"] },
  { name: "Evite_2013", date: "2013-01-01", description: "Event planning service breach — 100M accounts", dataClasses: ["Email addresses", "Names", "Passwords"] },
  { name: "Zynga_2019", date: "2019-09-01", description: "Mobile game company breach — 173M accounts", dataClasses: ["Email addresses", "Usernames", "Passwords", "Phone numbers"] },
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getSimulatedBreaches(identity: string): Array<{ name: string; date: string; description: string; dataClasses: string[] }> {
  const lower = identity.toLowerCase().trim();
  if (SIMULATED_BREACHES[lower]) return SIMULATED_BREACHES[lower];

  const hash = hashString(lower);
  const count = hash % 3;
  if (count === 0) return [];

  const breaches = [];
  for (let i = 0; i < count; i++) {
    const breach = KNOWN_BREACHES[(hash + i) % KNOWN_BREACHES.length];
    breaches.push({ ...breach });
  }
  return breaches;
}

// Fetch real breach data from Have I Been Pwned API
async function fetchHIBP(identity: string): Promise<Array<{ name: string; date: string; description: string; dataClasses: string[] }> | null> {
  if (!env.hibpApiKey) return null;

  try {
    const url = `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(identity)}?truncateResponse=false`;
    const res = await fetch(url, {
      headers: {
        "hibp-api-key": env.hibpApiKey,
        "user-agent": "ScamWatch-Intelligence",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (res.status === 404) return []; // No breaches found — this is a clean account
    if (!res.ok) return null; // API error — fall back to simulated

    const data = await res.json() as Array<{
      Name: string;
      BreachDate: string;
      Description: string;
      DataClasses: string[];
    }>;

    return data.map((b) => ({
      name: b.Name,
      date: b.BreachDate,
      description: b.Description,
      dataClasses: b.DataClasses,
    }));
  } catch {
    return null; // Network error — fall back to simulated
  }
}

export const identityRouter = createRouter({
  // Public: Look up any username/name in breach databases
  lookup: publicQuery
    .input(z.object({ identity: z.string().min(2).max(100) }))
    .query(async ({ input }) => {
      // Try real HIBP API first
      const hibpResult = await fetchHIBP(input.identity);

      if (hibpResult !== null) {
        return {
          identity: input.identity,
          found: hibpResult.length > 0,
          breachCount: hibpResult.length,
          breaches: hibpResult,
          source: "haveibeenpwned",
          disclaimer: "Real data from Have I Been Pwned API.",
        };
      }

      // Fallback to simulated data
      const breaches = getSimulatedBreaches(input.identity);

      return {
        identity: input.identity,
        found: breaches.length > 0,
        breachCount: breaches.length,
        breaches: breaches.map((b) => ({
          name: b.name,
          date: b.date,
          description: b.description,
          dataClasses: b.dataClasses,
        })),
        source: "simulated",
        disclaimer: "Simulated demonstration data. Add HIBP_API_KEY to .env for real breach data from Have I Been Pwned.",
      };
    }),

  // Authed: Save an identity to monitor
  monitor: authedQuery
    .input(
      z.object({
        identityType: z.enum(["username", "real_name", "email"]),
        identityValue: z.string().min(2).max(100),
        label: z.string().max(50).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const userId = ctx.user.id;

      const existing = await db
        .select()
        .from(monitoredIdentities)
        .where(
          and(
            eq(monitoredIdentities.userId, userId),
            eq(monitoredIdentities.identityValue, input.identityValue),
            eq(monitoredIdentities.identityType, input.identityType)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return { success: false, error: "Already monitoring this identity" };
      }

      const hibpResult = await fetchHIBP(input.identityValue);
      const breaches = hibpResult !== null ? hibpResult : getSimulatedBreaches(input.identityValue);

      const result = await db.insert(monitoredIdentities).values({
        userId,
        identityType: input.identityType,
        identityValue: input.identityValue,
        label: input.label || null,
        breachCount: breaches.length,
        lastCheckedAt: new Date(),
      });

      const newId = Number((result as unknown as { insertId: number }).insertId);

      for (const breach of breaches) {
        await db.insert(breachAlerts).values({
          identityId: newId,
          userId,
          breachName: breach.name,
          breachDate: breach.date,
          description: breach.description,
          dataClasses: breach.dataClasses.join(", "),
        });
      }

      return {
        success: true,
        breachCount: breaches.length,
        source: hibpResult !== null ? "haveibeenpwned" : "simulated",
      };
    }),

  // Authed: Get all monitored identities
  myMonitored: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const identities = await db
      .select()
      .from(monitoredIdentities)
      .where(eq(monitoredIdentities.userId, ctx.user.id))
      .orderBy(desc(monitoredIdentities.createdAt));

    const enriched = await Promise.all(
      identities.map(async (id) => {
        const alerts = await db
          .select({ count: sql<number>`count(*)` })
          .from(breachAlerts)
          .where(and(eq(breachAlerts.identityId, id.id), eq(breachAlerts.isRead, false)));
        return { ...id, unreadAlerts: alerts[0]?.count || 0 };
      })
    );

    return enriched;
  }),

  // Authed: Remove a monitored identity
  removeMonitor: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db
        .delete(monitoredIdentities)
        .where(and(eq(monitoredIdentities.id, input.id), eq(monitoredIdentities.userId, ctx.user.id)));
      await db
        .delete(breachAlerts)
        .where(and(eq(breachAlerts.identityId, input.id), eq(breachAlerts.userId, ctx.user.id)));
      return { success: true };
    }),

  // Authed: Get breach alerts
  myAlerts: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const alerts = await db
      .select()
      .from(breachAlerts)
      .where(eq(breachAlerts.userId, ctx.user.id))
      .orderBy(desc(breachAlerts.createdAt))
      .limit(50);

    return alerts;
  }),

  // Authed: Mark alert as read
  markAlertRead: authedQuery
    .input(z.object({ alertId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db
        .update(breachAlerts)
        .set({ isRead: true })
        .where(and(eq(breachAlerts.id, input.alertId), eq(breachAlerts.userId, ctx.user.id)));
      return { success: true };
    }),

  // Authed: Get alert stats
  alertStats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(breachAlerts)
      .where(eq(breachAlerts.userId, ctx.user.id));
    const unread = await db
      .select({ count: sql<number>`count(*)` })
      .from(breachAlerts)
      .where(and(eq(breachAlerts.userId, ctx.user.id), eq(breachAlerts.isRead, false)));
    const monitored = await db
      .select({ count: sql<number>`count(*)` })
      .from(monitoredIdentities)
      .where(eq(monitoredIdentities.userId, ctx.user.id));

    return {
      totalAlerts: total[0]?.count || 0,
      unreadAlerts: unread[0]?.count || 0,
      monitoredCount: monitored[0]?.count || 0,
    };
  }),
});
