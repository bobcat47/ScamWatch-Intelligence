import {
  mysqlTable,
  serial,
  varchar,
  text,
  timestamp,
  int,
  boolean,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("union_id", { length: 64 }).unique(),
  email: varchar("email", { length: 255 }),
  password: varchar("password", { length: 255 }),
  name: varchar("name", { length: 100 }),
  avatar: varchar("avatar", { length: 500 }),
  role: varchar("role", { length: 20 }).notNull().$type<"user" | "admin">().default("user"),
  authType: varchar("auth_type", { length: 20 }).notNull().$type<"kimi" | "local">().default("local"),
  lastSignInAt: timestamp("last_sign_in_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type InsertUser = typeof users.$inferInsert;

export const scamReports = mysqlTable("scam_reports", {
  id: serial("id").primaryKey(),
  phoneNumber: varchar("phone_number", { length: 30 }).notNull(),
  country: varchar("country", { length: 50 }).notNull(),
  carrier: varchar("carrier", { length: 50 }),
  description: text("description").notNull(),
  reportType: varchar("report_type", { length: 30 }).notNull().$type<
    "investment_scam" | "bank_impersonation" | "crypto_scam" |
    "police_threat" | "phishing" | "harassment" | "spam" | "other"
  >(),
  dangerRating: int("danger_rating"),
  latitude: varchar("latitude", { length: 20 }),
  longitude: varchar("longitude", { length: 20 }),
  evidenceUrl: varchar("evidence_url", { length: 500 }),
  callRecordingUrl: varchar("call_recording_url", { length: 500 }),
  reportedAt: timestamp("reported_at").notNull().defaultNow(),
});

export const chatMessages = mysqlTable("chat_messages", {
  id: serial("id").primaryKey(),
  displayName: varchar("display_name", { length: 50 }).notNull(),
  message: text("message").notNull(),
  country: varchar("country", { length: 50 }),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
});

export const monitoredIdentities = mysqlTable("monitored_identities", {
  id: serial("id").primaryKey(),
  userId: int("user_id").notNull(),
  identityType: varchar("identity_type", { length: 20 }).notNull().$type<"username" | "real_name" | "email">(),
  identityValue: varchar("identity_value", { length: 100 }).notNull(),
  label: varchar("label", { length: 50 }),
  breachCount: int("breach_count").default(0),
  lastCheckedAt: timestamp("last_checked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const breachAlerts = mysqlTable("breach_alerts", {
  id: serial("id").primaryKey(),
  identityId: int("identity_id").notNull(),
  userId: int("user_id").notNull(),
  breachName: varchar("breach_name", { length: 100 }).notNull(),
  breachDate: varchar("breach_date", { length: 20 }),
  description: text("description"),
  dataClasses: text("data_classes"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
