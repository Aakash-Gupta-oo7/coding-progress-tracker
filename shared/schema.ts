import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  leetcodeUsername: text("leetcode_username"),
  codeforcesUsername: text("codeforces_username"),
  gfgUsername: text("gfg_username"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const updateUserSchema = createInsertSchema(users).pick({
  leetcodeUsername: true,
  codeforcesUsername: true,
  gfgUsername: true,
});

export const questionLists = pgTable("question_lists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQuestionListSchema = createInsertSchema(questionLists).pick({
  name: true,
  description: true,
  isPublic: true,
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  listId: integer("list_id").notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  platform: text("platform").notNull(),
  difficulty: text("difficulty"),
  topic: text("topic"),
  isSolved: boolean("is_solved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  listId: true,
  title: true,
  url: true,
  platform: true,
  difficulty: true,
  topic: true,
});

export const searchHistory = pgTable("search_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  searchedUsername: text("searched_username").notNull(),
  platform: text("platform").notNull(),
  searchedAt: timestamp("searched_at").defaultNow(),
});

export const insertSearchHistorySchema = createInsertSchema(searchHistory).pick({
  searchedUsername: true,
  platform: true,
});

// Platform Data Types
export interface LeetcodeUserData {
  username: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking: number;
  contestRating: number;
  topicData: Record<string, number>;
}

export interface CodeforcesUserData {
  handle: string;
  totalSolved: number;
  rating: number;
  maxRank: string;
  levelAB: number;
  levelCD: number;
  levelE: number;
  contests: Array<{
    contestId: number;
    contestName: string;
    rank: number;
    ratingChange: number;
  }>;
}

export interface GFGUserData {
  username: string;
  totalSolved: number;
  institutionRank: number;
  school: number;
  basic: number;
  easy: number;
  mediumHard: number;
  monthlyActivity: Record<string, number>;
}

export interface CompareData {
  leetcode?: LeetcodeUserData;
  codeforces?: CodeforcesUserData;
  gfg?: GFGUserData;
}

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type User = typeof users.$inferSelect;
export type QuestionList = typeof questionLists.$inferSelect;
export type InsertQuestionList = z.infer<typeof insertQuestionListSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type SearchHistoryItem = typeof searchHistory.$inferSelect;
export type InsertSearchHistoryItem = z.infer<typeof insertSearchHistorySchema>;
