import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

export const env = {
  appId: required("APP_ID"),
  appSecret: required("APP_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  kimiAuthUrl: required("KIMI_AUTH_URL"),
  kimiOpenUrl: required("KIMI_OPEN_URL"),
  ownerUnionId: process.env.OWNER_UNION_ID ?? "",

  // External API keys (optional — app works without them using fallbacks)
  hibpApiKey: process.env.HIBP_API_KEY ?? "",
  numVerifyApiKey: process.env.NUMVERIFY_API_KEY ?? "",
  abstractPhoneApiKey: process.env.ABSTRACT_PHONE_API_KEY ?? "",
};
