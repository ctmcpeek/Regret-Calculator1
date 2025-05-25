import {
  users,
  memes,
  memeVotes,
  contests,
  customAssets,
  exchangeRates,
  type User,
  type UpsertUser,
  type Meme,
  type InsertMeme,
  type MemeVote,
  type InsertMemeVote,
  type Contest,
  type InsertContest,
  type CustomAsset,
  type InsertCustomAsset,
  type ExchangeRate,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Meme operations
  createMeme(meme: InsertMeme): Promise<Meme>;
  getMemes(limit?: number, contestPeriod?: string): Promise<Meme[]>;
  getMeme(id: number): Promise<Meme | undefined>;
  updateMemeVotes(memeId: number, upvotes: number, downvotes: number): Promise<void>;
  
  // Vote operations
  createVote(vote: InsertMemeVote): Promise<MemeVote>;
  getUserVote(memeId: number, userId: string): Promise<MemeVote | undefined>;
  deleteVote(memeId: number, userId: string): Promise<void>;
  
  // Contest operations
  createContest(contest: InsertContest): Promise<Contest>;
  getActiveContests(): Promise<Contest[]>;
  updateContestWinner(contestId: number, winnerId: number): Promise<void>;
  
  // Custom asset operations
  createCustomAsset(asset: InsertCustomAsset): Promise<CustomAsset>;
  getUserCustomAssets(userId: string): Promise<CustomAsset[]>;
  
  // Exchange rate operations
  getExchangeRates(): Promise<ExchangeRate[]>;
  updateExchangeRate(currency: string, rate: number, symbol: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Meme operations
  async createMeme(meme: InsertMeme): Promise<Meme> {
    const [newMeme] = await db
      .insert(memes)
      .values(meme)
      .returning();
    return newMeme;
  }

  async getMemes(limit = 50, contestPeriod?: string): Promise<Meme[]> {
    let query = db.select().from(memes);
    
    if (contestPeriod) {
      query = query.where(eq(memes.contestPeriod, contestPeriod));
    }
    
    return await query
      .orderBy(desc(sql`${memes.upvotes} - ${memes.downvotes}`))
      .limit(limit);
  }

  async getMeme(id: number): Promise<Meme | undefined> {
    const [meme] = await db.select().from(memes).where(eq(memes.id, id));
    return meme;
  }

  async updateMemeVotes(memeId: number, upvotes: number, downvotes: number): Promise<void> {
    await db
      .update(memes)
      .set({ upvotes, downvotes })
      .where(eq(memes.id, memeId));
  }

  // Vote operations
  async createVote(vote: InsertMemeVote): Promise<MemeVote> {
    const [newVote] = await db
      .insert(memeVotes)
      .values(vote)
      .returning();
    return newVote;
  }

  async getUserVote(memeId: number, userId: string): Promise<MemeVote | undefined> {
    const [vote] = await db
      .select()
      .from(memeVotes)
      .where(and(eq(memeVotes.memeId, memeId), eq(memeVotes.userId, userId)));
    return vote;
  }

  async deleteVote(memeId: number, userId: string): Promise<void> {
    await db
      .delete(memeVotes)
      .where(and(eq(memeVotes.memeId, memeId), eq(memeVotes.userId, userId)));
  }

  // Contest operations
  async createContest(contest: InsertContest): Promise<Contest> {
    const [newContest] = await db
      .insert(contests)
      .values(contest)
      .returning();
    return newContest;
  }

  async getActiveContests(): Promise<Contest[]> {
    return await db
      .select()
      .from(contests)
      .where(eq(contests.isActive, true))
      .orderBy(desc(contests.createdAt));
  }

  async updateContestWinner(contestId: number, winnerId: number): Promise<void> {
    await db
      .update(contests)
      .set({ winnerId, isActive: false })
      .where(eq(contests.id, contestId));
  }

  // Custom asset operations
  async createCustomAsset(asset: InsertCustomAsset): Promise<CustomAsset> {
    const [newAsset] = await db
      .insert(customAssets)
      .values(asset)
      .returning();
    return newAsset;
  }

  async getUserCustomAssets(userId: string): Promise<CustomAsset[]> {
    return await db
      .select()
      .from(customAssets)
      .where(eq(customAssets.userId, userId))
      .orderBy(desc(customAssets.createdAt));
  }

  // Exchange rate operations
  async getExchangeRates(): Promise<ExchangeRate[]> {
    return await db.select().from(exchangeRates);
  }

  async updateExchangeRate(currency: string, rate: number, symbol: string): Promise<void> {
    await db
      .insert(exchangeRates)
      .values({ currency, rate, symbol })
      .onConflictDoUpdate({
        target: exchangeRates.currency,
        set: { rate, symbol, lastUpdated: new Date() },
      });
  }
}

export const storage = new DatabaseStorage();
