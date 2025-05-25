import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  real,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Memes table
export const memes = pgTable("memes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title"),
  imageUrl: text("image_url").notNull(),
  assetType: varchar("asset_type"), // yacht, jet, lambo, marriage, mansion, custom
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  contestPeriod: varchar("contest_period").default("daily"), // hourly, daily, weekly, monthly
  createdAt: timestamp("created_at").defaultNow(),
});

// Meme votes table
export const memeVotes = pgTable("meme_votes", {
  id: serial("id").primaryKey(),
  memeId: integer("meme_id").notNull().references(() => memes.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  voteType: varchar("vote_type").notNull(), // 'up' or 'down'
  createdAt: timestamp("created_at").defaultNow(),
});

// Contests table
export const contests = pgTable("contests", {
  id: serial("id").primaryKey(),
  period: varchar("period").notNull(), // hourly, daily, weekly, monthly
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  winnerId: integer("winner_id").references(() => memes.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Custom assets table
export const customAssets = pgTable("custom_assets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  emoji: text("emoji").notNull(),
  rentPrice: real("rent_price").default(1000),
  rentDuration: text("rent_duration").default("1:0:0"),
  ownPrice: real("own_price").default(100000),
  ownUpkeep: real("own_upkeep").default(10000),
  ownDuration: text("own_duration").default("365:0:0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Exchange rates table for caching
export const exchangeRates = pgTable("exchange_rates", {
  id: serial("id").primaryKey(),
  currency: varchar("currency").notNull(),
  rate: real("rate").notNull(),
  symbol: text("symbol").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Schemas
export const insertUserSchema = createInsertSchema(users);
export const insertMemeSchema = createInsertSchema(memes).omit({ id: true, upvotes: true, downvotes: true, createdAt: true });
export const insertMemeVoteSchema = createInsertSchema(memeVotes).omit({ id: true, createdAt: true });
export const insertCustomAssetSchema = createInsertSchema(customAssets).omit({ id: true, createdAt: true });
export const insertContestSchema = createInsertSchema(contests).omit({ id: true, createdAt: true });

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMeme = z.infer<typeof insertMemeSchema>;
export type Meme = typeof memes.$inferSelect;
export type InsertMemeVote = z.infer<typeof insertMemeVoteSchema>;
export type MemeVote = typeof memeVotes.$inferSelect;
export type InsertCustomAsset = z.infer<typeof insertCustomAssetSchema>;
export type CustomAsset = typeof customAssets.$inferSelect;
export type InsertContest = z.infer<typeof insertContestSchema>;
export type Contest = typeof contests.$inferSelect;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
