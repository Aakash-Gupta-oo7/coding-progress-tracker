import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uniqueIndex, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

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

// Contests table
export const contests = pgTable("contests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  platform: text("platform").notNull(), // 'leetcode', 'codeforces', 'gfg'
  url: text("url").notNull(),
  startTime: timestamp("start_time").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Manual schema for contest creation with string date handling
export const insertContestSchema = z.object({
  name: z.string(),
  platform: z.enum(["leetcode", "codeforces", "gfg"]),
  url: z.string().url(),
  startTime: z.string().transform(val => {
    const date = new Date(val);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date string");
    }
    return date;
  }),
  durationSeconds: z.number().int().positive()
});

// Modified type to include Date type for internal use
export type ContestCreateData = {
  name: string;
  platform: "leetcode" | "codeforces" | "gfg";
  url: string;
  startTime: Date;
  durationSeconds: number;
};

// User Contest Participation table
export const contestParticipation = pgTable("contest_participation", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  contestId: integer("contest_id").notNull(),
  participated: boolean("participated").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContestParticipationSchema = createInsertSchema(contestParticipation)
  .pick({
    contestId: true,
    participated: true,
  })
  .required({
    participated: true,
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
  detailedData?: any; // Optional detailed data from the scraper
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

export interface ContestData {
  id: number;
  name: string;
  platform: 'leetcode' | 'codeforces' | 'gfg';
  url: string;
  startTime: string; // ISO format date string for client use
  durationSeconds: number;
  participated?: boolean;
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
export type Contest = typeof contests.$inferSelect;
// For API requests (pre-transform)
export type InsertContest = {
  name: string;
  platform: "leetcode" | "codeforces" | "gfg";
  url: string;
  startTime: string; // ISO format date string for API requests
  durationSeconds: number;
};
export type ContestParticipation = typeof contestParticipation.$inferSelect;
export type InsertContestParticipation = z.infer<typeof insertContestParticipationSchema>;

// Groups and Invitations

// Groups table - for creating study groups
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: integer("created_by").notNull(), // User ID of the creator
  inviteCode: text("invite_code").notNull().unique(), // Unique code for invitations
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGroupSchema = createInsertSchema(groups).pick({
  name: true,
  description: true,
});

// Group members junction table
export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role").notNull().default("member"), // "owner", "admin", "member"
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => {
  return {
    uniqueMembership: uniqueIndex("unique_group_membership").on(table.groupId, table.userId),
  };
});

export const insertGroupMemberSchema = createInsertSchema(groupMembers).pick({
  groupId: true,
  userId: true,
  role: true,
});

// Group shared question lists
export const sharedLists = pgTable("shared_lists", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: integer("created_by").notNull(), // User ID of the creator
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSharedListSchema = createInsertSchema(sharedLists).pick({
  groupId: true,
  name: true,
  description: true,
});

// Questions in the shared list
export const sharedListQuestions = pgTable("shared_list_questions", {
  id: serial("id").primaryKey(),
  listId: integer("list_id").notNull(), // References sharedLists.id
  title: text("title").notNull(),
  url: text("url").notNull(),
  platform: text("platform").notNull(),
  difficulty: text("difficulty"),
  topic: text("topic"),
  addedBy: integer("added_by").notNull(), // User ID that added the question
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSharedListQuestionSchema = createInsertSchema(sharedListQuestions).pick({
  listId: true,
  title: true,
  url: true,
  platform: true,
  difficulty: true,
  topic: true,
});

// User-specific tracking of shared list questions
export const sharedListProgress = pgTable("shared_list_progress", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull(), // References sharedListQuestions.id
  userId: integer("user_id").notNull(),
  isSolved: boolean("is_solved").default(false),
  solvedAt: timestamp("solved_at"),
}, (table) => {
  return {
    uniqueProgress: uniqueIndex("unique_shared_progress").on(table.questionId, table.userId),
  };
});

export const insertSharedListProgressSchema = createInsertSchema(sharedListProgress).pick({
  questionId: true,
  isSolved: true,
  solvedAt: true,
});

// Private Tests
export const privateTests = pgTable("private_tests", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(), // References groups.id
  name: text("name").notNull(),
  description: text("description"),
  createdBy: integer("created_by").notNull(),
  startTime: timestamp("start_time").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  difficulty: text("difficulty").notNull(), // Can be easy, medium, hard or a combination
  numQuestions: integer("num_questions").notNull(),
  status: text("status").notNull().default("scheduled"), // scheduled, active, completed
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPrivateTestSchema = createInsertSchema(privateTests).pick({
  groupId: true,
  name: true,
  description: true,
  startTime: true,
  durationMinutes: true,
  difficulty: true,
  numQuestions: true,
}).transform((data) => ({
  ...data,
  startTime: new Date(data.startTime)
}));

// Test questions selected for the private test
export const testQuestions = pgTable("test_questions", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull(), // References privateTests.id
  questionId: integer("question_id").notNull(), // References either questions.id or external API identifier
  title: text("title").notNull(),
  url: text("url").notNull(),
  platform: text("platform").notNull(),
  difficulty: text("difficulty").notNull(),
  points: integer("points").notNull().default(100), // Points for this question
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTestQuestionSchema = createInsertSchema(testQuestions).pick({
  testId: true,
  questionId: true,
  title: true,
  url: true,
  platform: true,
  difficulty: true,
  points: true,
});

// User participation in private tests
export const testParticipants = pgTable("test_participants", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull(), // References privateTests.id
  userId: integer("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => {
  return {
    uniqueParticipant: uniqueIndex("unique_test_participant").on(table.testId, table.userId),
  };
});

export const insertTestParticipantSchema = createInsertSchema(testParticipants).pick({
  testId: true,
});

// User submissions in tests
export const testSubmissions = pgTable("test_submissions", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull(), // References privateTests.id
  questionId: integer("question_id").notNull(), // References testQuestions.id
  userId: integer("user_id").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const insertTestSubmissionSchema = createInsertSchema(testSubmissions).pick({
  testId: true,
  questionId: true,
  isCorrect: true,
});

// Types for our new tables
export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;

export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;

export type SharedList = typeof sharedLists.$inferSelect;
export type InsertSharedList = z.infer<typeof insertSharedListSchema>;

export type SharedListQuestion = typeof sharedListQuestions.$inferSelect;
export type InsertSharedListQuestion = z.infer<typeof insertSharedListQuestionSchema>;

export type SharedListProgress = typeof sharedListProgress.$inferSelect;
export type InsertSharedListProgress = z.infer<typeof insertSharedListProgressSchema>;

export type PrivateTest = typeof privateTests.$inferSelect;
export type InsertPrivateTest = z.infer<typeof insertPrivateTestSchema>;

export type TestQuestion = typeof testQuestions.$inferSelect;
export type InsertTestQuestion = z.infer<typeof insertTestQuestionSchema>;

export type TestParticipant = typeof testParticipants.$inferSelect;
export type InsertTestParticipant = z.infer<typeof insertTestParticipantSchema>;

export type TestSubmission = typeof testSubmissions.$inferSelect;
export type InsertTestSubmission = z.infer<typeof insertTestSubmissionSchema>;

// Define relations between tables
export const usersRelations = relations(users, ({ many }) => ({
  groupMemberships: many(groupMembers),
  ownedGroups: many(groups, { relationName: "groupCreator" }),
  ownedSharedLists: many(sharedLists, { relationName: "listCreator" }),
  ownedPrivateTests: many(privateTests, { relationName: "testCreator" }),
  testParticipations: many(testParticipants),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  creator: one(users, {
    fields: [groups.createdBy],
    references: [users.id],
    relationName: "groupCreator",
  }),
  members: many(groupMembers),
  sharedLists: many(sharedLists),
  privateTests: many(privateTests),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [groupMembers.userId],
    references: [users.id],
  }),
}));

export const sharedListsRelations = relations(sharedLists, ({ one, many }) => ({
  group: one(groups, {
    fields: [sharedLists.groupId],
    references: [groups.id],
  }),
  creator: one(users, {
    fields: [sharedLists.createdBy],
    references: [users.id],
    relationName: "listCreator",
  }),
  questions: many(sharedListQuestions),
}));

export const sharedListQuestionsRelations = relations(sharedListQuestions, ({ one, many }) => ({
  list: one(sharedLists, {
    fields: [sharedListQuestions.listId],
    references: [sharedLists.id],
  }),
  addedByUser: one(users, {
    fields: [sharedListQuestions.addedBy],
    references: [users.id],
  }),
  progress: many(sharedListProgress),
}));

export const privateTestsRelations = relations(privateTests, ({ one, many }) => ({
  group: one(groups, {
    fields: [privateTests.groupId],
    references: [groups.id],
  }),
  creator: one(users, {
    fields: [privateTests.createdBy],
    references: [users.id],
    relationName: "testCreator",
  }),
  questions: many(testQuestions),
  participants: many(testParticipants),
}));

export const testQuestionsRelations = relations(testQuestions, ({ one, many }) => ({
  test: one(privateTests, {
    fields: [testQuestions.testId],
    references: [privateTests.id],
  }),
  submissions: many(testSubmissions),
}));

export const testParticipantsRelations = relations(testParticipants, ({ one, many }) => ({
  test: one(privateTests, {
    fields: [testParticipants.testId],
    references: [privateTests.id],
  }),
  user: one(users, {
    fields: [testParticipants.userId],
    references: [users.id],
  }),
  submissions: many(testSubmissions, {
    relationName: "participantSubmissions",
  }),
}));

export const testSubmissionsRelations = relations(testSubmissions, ({ one }) => ({
  test: one(privateTests, {
    fields: [testSubmissions.testId],
    references: [privateTests.id],
  }),
  question: one(testQuestions, {
    fields: [testSubmissions.questionId],
    references: [testQuestions.id],
  }),
  user: one(users, {
    fields: [testSubmissions.userId],
    references: [users.id],
  }),
  participant: one(testParticipants, {
    fields: [testSubmissions.testId, testSubmissions.userId],
    references: [testParticipants.testId, testParticipants.userId],
    relationName: "participantSubmissions",
  }),
}));
