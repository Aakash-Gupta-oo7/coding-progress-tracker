import { 
  User, InsertUser, QuestionList, InsertQuestionList, 
  Question, InsertQuestion, SearchHistoryItem, InsertSearchHistoryItem,
  UpdateUser, Contest, InsertContest, ContestParticipation, InsertContestParticipation,
  ContestCreateData
} from "@shared/schema";

import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Auth & User
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLinks(userId: number, data: UpdateUser): Promise<User>;
  
  // Question Lists
  createQuestionList(userId: number, list: InsertQuestionList): Promise<QuestionList>;
  getQuestionLists(userId: number): Promise<QuestionList[]>;
  getPublicQuestionLists(): Promise<QuestionList[]>;
  getQuestionList(listId: number): Promise<QuestionList | undefined>;
  updateQuestionList(listId: number, data: InsertQuestionList): Promise<QuestionList>;
  deleteQuestionList(listId: number): Promise<void>;
  
  // Questions
  addQuestion(question: InsertQuestion): Promise<Question>;
  getQuestionsInList(listId: number): Promise<Question[]>;
  markQuestionSolved(questionId: number, solved: boolean): Promise<Question>;
  
  // Search History
  addSearchHistory(userId: number, data: InsertSearchHistoryItem): Promise<SearchHistoryItem>;
  getSearchHistory(userId: number): Promise<SearchHistoryItem[]>;
  deleteSearchHistoryItem(userId: number, searchHistoryId: number): Promise<void>;
  
  // Contests
  createContest(contest: ContestCreateData): Promise<Contest>;
  getContests(): Promise<Contest[]>;
  getContest(id: number): Promise<Contest | undefined>;
  
  // Contest Participation
  setContestParticipation(userId: number, data: InsertContestParticipation): Promise<ContestParticipation>;
  getUserContestParticipations(userId: number): Promise<ContestParticipation[]>;
  getContestParticipation(userId: number, contestId: number): Promise<ContestParticipation | undefined>;
  
  // Session Store
  sessionStore: any; // Use 'any' to avoid type issues with SessionStore
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private questionLists: Map<number, QuestionList>;
  private questions: Map<number, Question>;
  private searchHistory: Map<number, SearchHistoryItem>;
  private contests: Map<number, Contest>;
  private contestParticipations: Map<number, ContestParticipation>;
  sessionStore: any; // Use 'any' to avoid type issues with SessionStore
  private userIdCounter: number;
  private listIdCounter: number;
  private questionIdCounter: number;
  private searchHistoryIdCounter: number;
  private contestIdCounter: number;
  private participationIdCounter: number;

  constructor() {
    this.users = new Map();
    this.questionLists = new Map();
    this.questions = new Map();
    this.searchHistory = new Map();
    this.contests = new Map();
    this.contestParticipations = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    this.userIdCounter = 1;
    this.listIdCounter = 1;
    this.questionIdCounter = 1;
    this.searchHistoryIdCounter = 1;
    this.contestIdCounter = 1;
    this.participationIdCounter = 1;
  }

  // Auth & User
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now,
      leetcodeUsername: null,
      codeforcesUsername: null,
      gfgUsername: null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserLinks(userId: number, data: UpdateUser): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser: User = {
      ...user,
      leetcodeUsername: data.leetcodeUsername ?? user.leetcodeUsername,
      codeforcesUsername: data.codeforcesUsername ?? user.codeforcesUsername,
      gfgUsername: data.gfgUsername ?? user.gfgUsername
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Question Lists
  async createQuestionList(userId: number, list: InsertQuestionList): Promise<QuestionList> {
    const id = this.listIdCounter++;
    const now = new Date();
    
    const newList: QuestionList = {
      id,
      userId,
      name: list.name,
      description: list.description ?? null,
      isPublic: list.isPublic ?? false,
      createdAt: now
    };
    
    this.questionLists.set(id, newList);
    return newList;
  }

  async getQuestionLists(userId: number): Promise<QuestionList[]> {
    return Array.from(this.questionLists.values())
      .filter(list => list.userId === userId);
  }

  async getPublicQuestionLists(): Promise<QuestionList[]> {
    return Array.from(this.questionLists.values())
      .filter(list => list.isPublic);
  }

  async getQuestionList(listId: number): Promise<QuestionList | undefined> {
    return this.questionLists.get(listId);
  }

  async updateQuestionList(listId: number, data: InsertQuestionList): Promise<QuestionList> {
    const list = await this.getQuestionList(listId);
    
    if (!list) {
      throw new Error("List not found");
    }
    
    const updatedList: QuestionList = {
      ...list,
      name: data.name,
      description: data.description ?? list.description,
      isPublic: data.isPublic ?? list.isPublic
    };
    
    this.questionLists.set(listId, updatedList);
    return updatedList;
  }

  async deleteQuestionList(listId: number): Promise<void> {
    // Delete all questions in the list
    const questionsToDelete = Array.from(this.questions.values())
      .filter(q => q.listId === listId);
    
    for (const question of questionsToDelete) {
      this.questions.delete(question.id);
    }
    
    // Delete the list
    this.questionLists.delete(listId);
  }

  // Questions
  async addQuestion(questionData: InsertQuestion): Promise<Question> {
    const id = this.questionIdCounter++;
    const now = new Date();
    
    const question: Question = {
      id,
      listId: questionData.listId,
      title: questionData.title,
      url: questionData.url,
      platform: questionData.platform,
      difficulty: questionData.difficulty ?? null,
      topic: questionData.topic ?? null,
      isSolved: false,
      createdAt: now
    };
    
    this.questions.set(id, question);
    return question;
  }

  async getQuestionsInList(listId: number): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter(q => q.listId === listId);
  }

  async markQuestionSolved(questionId: number, solved: boolean): Promise<Question> {
    const question = this.questions.get(questionId);
    
    if (!question) {
      throw new Error("Question not found");
    }
    
    const updatedQuestion: Question = {
      ...question,
      isSolved: solved
    };
    
    this.questions.set(questionId, updatedQuestion);
    return updatedQuestion;
  }

  // Search History
  async addSearchHistory(userId: number, data: InsertSearchHistoryItem): Promise<SearchHistoryItem> {
    const id = this.searchHistoryIdCounter++;
    const now = new Date();
    
    const searchHistoryItem: SearchHistoryItem = {
      id,
      userId,
      searchedUsername: data.searchedUsername,
      platform: data.platform,
      searchedAt: now
    };
    
    this.searchHistory.set(id, searchHistoryItem);
    return searchHistoryItem;
  }

  async getSearchHistory(userId: number): Promise<SearchHistoryItem[]> {
    const history = Array.from(this.searchHistory.values())
      .filter(item => item.userId === userId)
      .sort((a, b) => {
        const aTime = a.searchedAt ? a.searchedAt.getTime() : 0;
        const bTime = b.searchedAt ? b.searchedAt.getTime() : 0;
        return bTime - aTime;
      });
    
    // Unique search history based on platform and username
    const uniqueHistory = new Map<string, SearchHistoryItem>();
    
    for (const item of history) {
      const key = `${item.platform}-${item.searchedUsername}`;
      if (!uniqueHistory.has(key)) {
        uniqueHistory.set(key, item);
      }
    }
    
    return Array.from(uniqueHistory.values());
  }
  
  async deleteSearchHistoryItem(userId: number, searchHistoryId: number): Promise<void> {
    const item = this.searchHistory.get(searchHistoryId);
    
    // Only allow deletion if the item exists and belongs to the user
    if (item && item.userId === userId) {
      this.searchHistory.delete(searchHistoryId);
    } else {
      throw new Error("Search history item not found or not authorized to delete");
    }
  }
  
  // Contest methods
  async createContest(contestData: ContestCreateData): Promise<Contest> {
    const id = this.contestIdCounter++;
    const now = new Date();
    
    const contest: Contest = {
      id,
      name: contestData.name,
      platform: contestData.platform,
      url: contestData.url,
      startTime: contestData.startTime,
      durationSeconds: contestData.durationSeconds,
      createdAt: now
    };
    
    this.contests.set(id, contest);
    return contest;
  }
  
  async getContests(): Promise<Contest[]> {
    return Array.from(this.contests.values()).sort((a, b) => {
      const aTime = a.startTime ? a.startTime.getTime() : 0;
      const bTime = b.startTime ? b.startTime.getTime() : 0;
      return aTime - bTime;
    });
  }
  
  async getContest(id: number): Promise<Contest | undefined> {
    return this.contests.get(id);
  }
  
  // Contest participation methods
  async setContestParticipation(userId: number, data: InsertContestParticipation): Promise<ContestParticipation> {
    // Check if participation record already exists
    const existing = await this.getContestParticipation(userId, data.contestId);
    
    if (existing) {
      // Update existing participation
      const updated: ContestParticipation = {
        ...existing,
        participated: data.participated
      };
      
      this.contestParticipations.set(existing.id, updated);
      return updated;
    } else {
      // Create new participation record
      const id = this.participationIdCounter++;
      const now = new Date();
      
      const participation: ContestParticipation = {
        id,
        userId,
        contestId: data.contestId,
        participated: data.participated,
        createdAt: now
      };
      
      this.contestParticipations.set(id, participation);
      return participation;
    }
  }
  
  async getUserContestParticipations(userId: number): Promise<ContestParticipation[]> {
    return Array.from(this.contestParticipations.values())
      .filter(participation => participation.userId === userId);
  }
  
  async getContestParticipation(userId: number, contestId: number): Promise<ContestParticipation | undefined> {
    return Array.from(this.contestParticipations.values())
      .find(participation => participation.userId === userId && participation.contestId === contestId);
  }
}

export const storage = new MemStorage();
