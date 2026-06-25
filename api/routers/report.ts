import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { scamReports } from "@db/schema";
import { desc, eq, like, sql } from "drizzle-orm";

export const reportRouter = createRouter({
  submit: publicQuery
    .input(
      z.object({
        phoneNumber: z.string().min(5).max(30),
        country: z.string().min(2).max(50),
        carrier: z.string().max(50).optional(),
        description: z.string().min(10).max(2000),
        reportType: z.enum([
          "investment_scam",
          "bank_impersonation",
          "crypto_scam",
          "police_threat",
          "phishing",
          "harassment",
          "spam",
          "other",
        ]),
        dangerRating: z.number().min(0).max(100).optional(),
        latitude: z.string().max(20).optional(),
        longitude: z.string().max(20).optional(),
        evidenceUrl: z.string().max(500).optional(),
        callRecordingUrl: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.insert(scamReports).values({
        phoneNumber: input.phoneNumber,
        country: input.country,
        carrier: input.carrier || null,
        description: input.description,
        reportType: input.reportType,
        dangerRating: input.dangerRating || null,
        latitude: input.latitude || null,
        longitude: input.longitude || null,
        evidenceUrl: input.evidenceUrl || null,
        callRecordingUrl: input.callRecordingUrl || null,
      });
      return { success: true };
    }),

  list: publicQuery
    .input(
      z.object({
        search: z.string().optional(),
        country: z.string().optional(),
        reportType: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];

      if (input?.search) {
        conditions.push(like(scamReports.phoneNumber, `%${input.search}%`));
      }
      if (input?.country) {
        conditions.push(eq(scamReports.country, input.country));
      }
      if (input?.reportType) {
        conditions.push(sql`${scamReports.reportType} = ${input.reportType}`);
      }

      const whereClause = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;

      const reports = await db
        .select()
        .from(scamReports)
        .where(whereClause)
        .orderBy(desc(scamReports.reportedAt))
        .limit(input?.limit || 50)
        .offset(input?.offset || 0);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(scamReports)
        .where(whereClause);

      return {
        reports,
        total: countResult[0]?.count || 0,
      };
    }),

  check: publicQuery
    .input(z.object({ phoneNumber: z.string().min(5) }))
    .query(async ({ input }) => {
      const db = getDb();
      const reports = await db
        .select()
        .from(scamReports)
        .where(like(scamReports.phoneNumber, `%${input.phoneNumber}%`))
        .orderBy(desc(scamReports.reportedAt));

      return {
        found: reports.length > 0,
        count: reports.length,
        reports,
        maxDanger: reports.length > 0
          ? Math.max(...reports.map((r) => r.dangerRating || 0))
          : 0,
      };
    }),

  // Get all reports with coordinates for the map
  mapData: publicQuery.query(async () => {
    const db = getDb();
    const reports = await db
      .select({
        id: scamReports.id,
        phoneNumber: scamReports.phoneNumber,
        country: scamReports.country,
        reportType: scamReports.reportType,
        dangerRating: scamReports.dangerRating,
        latitude: scamReports.latitude,
        longitude: scamReports.longitude,
        description: scamReports.description,
        reportedAt: scamReports.reportedAt,
      })
      .from(scamReports)
      .where(sql`${scamReports.latitude} IS NOT NULL AND ${scamReports.longitude} IS NOT NULL`)
      .orderBy(desc(scamReports.reportedAt));

    return reports;
  }),

  stats: publicQuery.query(async () => {
    const db = getDb();

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(scamReports);

    const todayResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(scamReports)
      .where(sql`DATE(${scamReports.reportedAt}) = DATE(NOW())`);

    const countryResult = await db
      .select({
        country: scamReports.country,
        count: sql<number>`count(*)`,
      })
      .from(scamReports)
      .groupBy(scamReports.country);

    const typeResult = await db
      .select({
        type: scamReports.reportType,
        count: sql<number>`count(*)`,
      })
      .from(scamReports)
      .groupBy(scamReports.reportType);

    const highDangerResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(scamReports)
      .where(sql`${scamReports.dangerRating} >= 75`);

    const latestResult = await db
      .select()
      .from(scamReports)
      .orderBy(desc(scamReports.reportedAt))
      .limit(5);

    return {
      total: totalResult[0]?.count || 0,
      today: todayResult[0]?.count || 0,
      highDanger: highDangerResult[0]?.count || 0,
      byCountry: countryResult,
      byType: typeResult,
      latest: latestResult,
    };
  }),
});
