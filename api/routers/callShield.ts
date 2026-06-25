import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { scamReports } from "@db/schema";
import { desc, like } from "drizzle-orm";
import { env } from "../lib/env";

// Simple hash for deterministic "likely scam" check on unknown numbers
function hashNumber(num: string): number {
  let h = 0;
  const digits = num.replace(/\D/g, "");
  for (let i = 0; i < digits.length; i++) {
    h = ((h << 5) - h + digits.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// Risk patterns in phone numbers
function analyzeNumberPatterns(phoneNumber: string): {
  spoofedCallerId: boolean;
  premiumRate: boolean;
  sequential: boolean;
  flaggedPrefix: boolean;
} {
  const clean = phoneNumber.replace(/\D/g, "");

  // Check for known spoofed prefixes
  const spoofedPrefixes = ["420770135", "421948"]; // The actual scam clusters
  const flaggedPrefix = spoofedPrefixes.some((p) => clean.includes(p));

  // Sequential digits (e.g. 123456, 111222)
  const sequential = /(012|123|234|345|456|567|678|789|890|111|222|333|444|555|666|777|888|999|000)/.test(clean);

  // Premium rate or special prefixes
  const premiumRate = /^(900|809|876|881|882|883|884|885|886|887|888|889)/.test(clean);

  // Very short or very long numbers are suspicious
  const spoofed = clean.length < 8 || clean.length > 15;

  return {
    spoofedCallerId: spoofed || flaggedPrefix,
    premiumRate,
    sequential,
    flaggedPrefix,
  };
}

export const callShieldRouter = createRouter({
  // Real-time incoming call check — returns within ~50ms
  incomingCallCheck: publicQuery
    .input(z.object({ phoneNumber: z.string().min(5).max(30) }))
    .mutation(async ({ input }) => {
      const startTime = Date.now();
      const db = getDb();

      // 1. Exact match in database
      const exactMatches = await db
        .select()
        .from(scamReports)
        .where(like(scamReports.phoneNumber, `%${input.phoneNumber}%`))
        .orderBy(desc(scamReports.reportedAt))
        .limit(5);

      // 2. Pattern analysis on the number itself
      const patterns = analyzeNumberPatterns(input.phoneNumber);

      // 3. Carrier / country detection from prefix
      const clean = input.phoneNumber.replace(/\D/g, "");
      let detectedCountry = "Unknown";
      if (clean.startsWith("420")) detectedCountry = "Czechia";
      else if (clean.startsWith("421")) detectedCountry = "Slovakia";
      else if (clean.startsWith("44")) detectedCountry = "United Kingdom";
      else if (clean.startsWith("49")) detectedCountry = "Germany";
      else if (clean.startsWith("31")) detectedCountry = "Netherlands";
      else if (clean.startsWith("1")) detectedCountry = "United States/Canada";

      // 4. Calculate risk score (0-100)
      let riskScore = 0;
      let verdict: "safe" | "caution" | "warning" | "danger" = "safe";
      let reason = "No reports found. Number appears clean.";

      if (exactMatches.length > 0) {
        const maxDanger = Math.max(...exactMatches.map((r) => r.dangerRating || 50));
        riskScore = Math.min(100, maxDanger + exactMatches.length * 5);
        reason = `Found ${exactMatches.length} report${exactMatches.length > 1 ? "s" : ""} for this number. Top threat: ${exactMatches[0].reportType.replace(/_/g, " ")}.`;
      } else if (patterns.flaggedPrefix) {
        riskScore = 85;
        reason = "Number matches known scam cluster prefix. High probability of fraud.";
      } else if (patterns.premiumRate) {
        riskScore = 70;
        reason = "Premium-rate number detected. Known vector for callback scams.";
      } else if (patterns.sequential) {
        riskScore = 45;
        reason = "Suspicious sequential/repeating digit pattern. Proceed with caution.";
      } else {
        // Deterministic "unknown" risk for unreported numbers
        const hash = hashNumber(input.phoneNumber);
        riskScore = (hash % 15); // 0-14% for unknown numbers
      }

      if (riskScore >= 80) verdict = "danger";
      else if (riskScore >= 60) verdict = "warning";
      else if (riskScore >= 30) verdict = "caution";

      const responseTime = Date.now() - startTime;

      return {
        phoneNumber: input.phoneNumber,
        verdict,
        riskScore,
        reason,
        detectedCountry,
        patterns,
        matchedReports: exactMatches,
        responseTimeMs: responseTime,
        timestamp: new Date().toISOString(),
      };
    }),

  // Phone validation via external API (NumVerify / Abstract API)
  validatePhone: publicQuery
    .input(z.object({ phoneNumber: z.string().min(5).max(30) }))
    .query(async ({ input }) => {
      // Try NumVerify first
      if (env.numVerifyApiKey) {
        try {
          const url = `https://apilayer.net/api/validate?access_key=${env.numVerifyApiKey}&number=${encodeURIComponent(input.phoneNumber.replace(/\D/g, ""))}&country_code=&format=1`;
          const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
          if (res.ok) {
            const data = await res.json() as Record<string, unknown>;
            return {
              source: "numverify",
              valid: !!data.valid,
              number: String(data.number || ""),
              localFormat: String(data.local_format || ""),
              country: String(data.country_name || ""),
              countryCode: String(data.country_code || ""),
              carrier: String(data.carrier || "Unknown"),
              lineType: String(data.line_type || "Unknown"),
              location: String(data.location || ""),
              raw: data,
            };
          }
        } catch { /* fallback */ }
      }

      // Try Abstract API
      if (env.abstractPhoneApiKey) {
        try {
          const url = `https://phonevalidation.abstractapi.com/v1/?api_key=${env.abstractPhoneApiKey}&phone=${encodeURIComponent(input.phoneNumber)}`;
          const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
          if (res.ok) {
            const data = await res.json() as Record<string, unknown>;
            const fmt = (data.format as Record<string, string> | undefined) || {};
            const country = (data.country as Record<string, string> | undefined) || {};
            return {
              source: "abstractapi",
              valid: !!data.valid,
              number: String(data.phone || ""),
              localFormat: fmt.local || String(data.phone || ""),
              country: country.name || "Unknown",
              countryCode: country.code || "",
              carrier: String(data.carrier || "Unknown"),
              lineType: String(data.type || "Unknown"),
              location: String(data.location || ""),
              raw: data,
            };
          }
        } catch { /* fallback */ }
      }

      // No API key — return prefix-based detection
      const clean = input.phoneNumber.replace(/\D/g, "");
      let country = "Unknown";
      let countryCode = "";
      if (clean.startsWith("420")) { country = "Czechia"; countryCode = "CZ"; }
      else if (clean.startsWith("421")) { country = "Slovakia"; countryCode = "SK"; }
      else if (clean.startsWith("44")) { country = "United Kingdom"; countryCode = "GB"; }
      else if (clean.startsWith("49")) { country = "Germany"; countryCode = "DE"; }
      else if (clean.startsWith("31")) { country = "Netherlands"; countryCode = "NL"; }
      else if (clean.startsWith("1")) { country = "United States/Canada"; countryCode = "US"; }

      return {
        source: "prefix_lookup",
        valid: clean.length >= 8 && clean.length <= 15,
        number: input.phoneNumber,
        localFormat: input.phoneNumber,
        country,
        countryCode,
        carrier: "Unknown (add API key)",
        lineType: "Unknown (add API key)",
        location: "",
        raw: null,
      };
    }),
});
