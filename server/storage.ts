import { 
  User, InsertUser, QuestionList, InsertQuestionList, 
  Question, InsertQuestion, SearchHistoryItem, InsertSearchHistoryItem,
  UpdateUser, Contest, InsertContest, ContestParticipation, InsertContestParticipation,
  ContestCreateData,
  Group, InsertGroup, GroupMember, InsertGroupMember,
  SharedList, InsertSharedList, SharedListQuestion, InsertSharedListQuestion,
  SharedListProgress, InsertSharedListProgress, PrivateTest, InsertPrivateTest,
  TestQuestion, InsertTestQuestion, TestParticipant, InsertTestParticipant,
  TestSubmission, InsertTestSubmission
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
  
  // Groups
  createGroup(userId: number, data: InsertGroup): Promise<Group>;
  getGroup(groupId: number): Promise<Group | undefined>;
  getGroupByInviteCode(inviteCode: string): Promise<Group | undefined>;
  getUserGroups(userId: number): Promise<Group[]>;
  updateGroup(groupId: number, data: InsertGroup): Promise<Group>;
  deleteGroup(groupId: number): Promise<void>;
  
  // Group Members
  addGroupMember(data: InsertGroupMember): Promise<GroupMember>;
  getGroupMembers(groupId: number): Promise<GroupMember[]>;
  getGroupMember(groupId: number, userId: number): Promise<GroupMember | undefined>;
  updateGroupMemberRole(groupId: number, userId: number, role: string): Promise<GroupMember>;
  removeGroupMember(groupId: number, userId: number): Promise<void>;
  
  // Shared Lists
  createSharedList(userId: number, data: InsertSharedList): Promise<SharedList>;
  getSharedList(listId: number): Promise<SharedList | undefined>;
  getGroupSharedLists(groupId: number): Promise<SharedList[]>;
  updateSharedList(listId: number, data: InsertSharedList): Promise<SharedList>;
  deleteSharedList(listId: number): Promise<void>;
  
  // Shared List Questions
  addSharedListQuestion(userId: number, data: InsertSharedListQuestion): Promise<SharedListQuestion>;
  getSharedListQuestions(listId: number): Promise<SharedListQuestion[]>;
  deleteSharedListQuestion(questionId: number): Promise<void>;
  
  // Shared List Progress
  updateQuestionProgress(userId: number, questionId: number, isSolved: boolean): Promise<SharedListProgress>;
  getSharedListProgress(listId: number, userId: number): Promise<SharedListProgress[]>;
  
  // Private Tests
  createPrivateTest(userId: number, data: InsertPrivateTest): Promise<PrivateTest>;
  getPrivateTest(testId: number): Promise<PrivateTest | undefined>;
  getGroupPrivateTests(groupId: number): Promise<PrivateTest[]>;
  updatePrivateTestStatus(testId: number, status: string): Promise<PrivateTest>;
  deletePrivateTest(testId: number): Promise<void>;
  
  // Test Questions
  addTestQuestions(questions: InsertTestQuestion[]): Promise<TestQuestion[]>;
  getTestQuestions(testId: number): Promise<TestQuestion[]>;
  
  // Test Participants
  addTestParticipant(userId: number, data: InsertTestParticipant): Promise<TestParticipant>;
  getTestParticipants(testId: number): Promise<TestParticipant[]>;
  getUserTestParticipations(userId: number): Promise<TestParticipant[]>;
  
  // Test Submissions
  addTestSubmission(userId: number, data: InsertTestSubmission): Promise<TestSubmission>;
  getTestSubmissions(testId: number): Promise<TestSubmission[]>;
  getUserTestSubmissions(testId: number, userId: number): Promise<TestSubmission[]>;
  getTestResults(testId: number): Promise<{ userId: number; username: string; points: number; solved: number }[]>;
  
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
  private groups: Map<number, Group>;
  private groupMembers: Map<number, GroupMember>;
  private sharedLists: Map<number, SharedList>;
  private sharedListQuestions: Map<number, SharedListQuestion>;
  private sharedListProgress: Map<number, SharedListProgress>;
  private privateTests: Map<number, PrivateTest>;
  private testQuestions: Map<number, TestQuestion>;
  private testParticipants: Map<number, TestParticipant>;
  private testSubmissions: Map<number, TestSubmission>;
  sessionStore: any; // Use 'any' to avoid type issues with SessionStore
  
  // ID counters
  private userIdCounter: number;
  private listIdCounter: number;
  private questionIdCounter: number;
  private searchHistoryIdCounter: number;
  private contestIdCounter: number;
  private participationIdCounter: number;
  private groupIdCounter: number;
  private groupMemberIdCounter: number;
  private sharedListIdCounter: number;
  private sharedListQuestionIdCounter: number;
  private sharedListProgressIdCounter: number;
  private privateTestIdCounter: number;
  private testQuestionIdCounter: number;
  private testParticipantIdCounter: number;
  private testSubmissionIdCounter: number;

  constructor() {
    this.users = new Map();
    this.questionLists = new Map();
    this.questions = new Map();
    this.searchHistory = new Map();
    this.contests = new Map();
    this.contestParticipations = new Map();
    this.groups = new Map();
    this.groupMembers = new Map();
    this.sharedLists = new Map();
    this.sharedListQuestions = new Map();
    this.sharedListProgress = new Map();
    this.privateTests = new Map();
    this.testQuestions = new Map();
    this.testParticipants = new Map();
    this.testSubmissions = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Initialize ID counters
    this.userIdCounter = 1;
    this.listIdCounter = 1;
    this.questionIdCounter = 1;
    this.searchHistoryIdCounter = 1;
    this.contestIdCounter = 1;
    this.participationIdCounter = 1;
    this.groupIdCounter = 1;
    this.groupMemberIdCounter = 1;
    this.sharedListIdCounter = 1;
    this.sharedListQuestionIdCounter = 1;
    this.sharedListProgressIdCounter = 1;
    this.privateTestIdCounter = 1;
    this.testQuestionIdCounter = 1;
    this.testParticipantIdCounter = 1;
    this.testSubmissionIdCounter = 1;
    
    // Create a default user for testing
    this.seedDefaultUser();
  }
  
  // Seed a default user with platform usernames
  private async seedDefaultUser() {
    // Create test user
    const user = await this.createUser({
      username: "demo",
      password: "$2b$10$9uCFm2F1XhNiAZjiwC2v2OGbKwBQHEwhNGWL1Ip8mDQvYTyxFpNlu" // "password"
    });
    
    // Update user with platform links
    await this.updateUserLinks(user.id, {
      leetcodeUsername: "johndoe",
      codeforcesUsername: "tester",
      gfgUsername: "gfg_user"
    });
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
  
  // Group methods
  async createGroup(userId: number, data: InsertGroup): Promise<Group> {
    const id = this.groupIdCounter++;
    const now = new Date();
    // Generate a random invite code (8 characters)
    const inviteCode = Math.random().toString(36).substring(2, 10);
    
    const group: Group = {
      id,
      name: data.name,
      description: data.description ?? null,
      createdBy: userId,
      inviteCode,
      createdAt: now
    };
    
    this.groups.set(id, group);
    
    // Add the creator as an owner
    await this.addGroupMember({
      groupId: id,
      userId,
      role: "owner"
    });
    
    return group;
  }
  
  async getGroup(groupId: number): Promise<Group | undefined> {
    return this.groups.get(groupId);
  }
  
  async getGroupByInviteCode(inviteCode: string): Promise<Group | undefined> {
    return Array.from(this.groups.values())
      .find(group => group.inviteCode === inviteCode);
  }
  
  async getUserGroups(userId: number): Promise<Group[]> {
    // Get all group memberships for the user
    const memberships = Array.from(this.groupMembers.values())
      .filter(member => member.userId === userId);
    
    // Get the groups
    const groups: Group[] = [];
    for (const membership of memberships) {
      const group = this.groups.get(membership.groupId);
      if (group) {
        groups.push(group);
      }
    }
    
    return groups;
  }
  
  async updateGroup(groupId: number, data: InsertGroup): Promise<Group> {
    const group = await this.getGroup(groupId);
    
    if (!group) {
      throw new Error("Group not found");
    }
    
    const updatedGroup: Group = {
      ...group,
      name: data.name,
      description: data.description ?? group.description
    };
    
    this.groups.set(groupId, updatedGroup);
    return updatedGroup;
  }
  
  async deleteGroup(groupId: number): Promise<void> {
    // Delete all shared lists in the group
    const sharedLists = await this.getGroupSharedLists(groupId);
    for (const list of sharedLists) {
      await this.deleteSharedList(list.id);
    }
    
    // Delete all private tests in the group
    const privateTests = await this.getGroupPrivateTests(groupId);
    for (const test of privateTests) {
      await this.deletePrivateTest(test.id);
    }
    
    // Delete all group members
    const members = Array.from(this.groupMembers.values())
      .filter(member => member.groupId === groupId);
    
    for (const member of members) {
      this.groupMembers.delete(member.id);
    }
    
    // Delete the group
    this.groups.delete(groupId);
  }
  
  // Group Members methods
  async addGroupMember(data: InsertGroupMember): Promise<GroupMember> {
    const id = this.groupMemberIdCounter++;
    const now = new Date();
    
    // Check if already a member
    const existingMember = await this.getGroupMember(data.groupId, data.userId);
    if (existingMember) {
      throw new Error("User is already a member of this group");
    }
    
    const member: GroupMember = {
      id,
      groupId: data.groupId,
      userId: data.userId,
      role: data.role ?? "member",
      joinedAt: now
    };
    
    this.groupMembers.set(id, member);
    return member;
  }
  
  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return Array.from(this.groupMembers.values())
      .filter(member => member.groupId === groupId);
  }
  
  async getGroupMember(groupId: number, userId: number): Promise<GroupMember | undefined> {
    return Array.from(this.groupMembers.values())
      .find(member => member.groupId === groupId && member.userId === userId);
  }
  
  async updateGroupMemberRole(groupId: number, userId: number, role: string): Promise<GroupMember> {
    const member = await this.getGroupMember(groupId, userId);
    
    if (!member) {
      throw new Error("Group member not found");
    }
    
    const updatedMember: GroupMember = {
      ...member,
      role
    };
    
    this.groupMembers.set(member.id, updatedMember);
    return updatedMember;
  }
  
  async removeGroupMember(groupId: number, userId: number): Promise<void> {
    const member = await this.getGroupMember(groupId, userId);
    
    if (!member) {
      throw new Error("Group member not found");
    }
    
    // Cannot remove the last owner
    if (member.role === "owner") {
      const owners = (await this.getGroupMembers(groupId))
        .filter(m => m.role === "owner");
      
      if (owners.length <= 1) {
        throw new Error("Cannot remove the last owner of a group");
      }
    }
    
    this.groupMembers.delete(member.id);
  }
  
  // Shared Lists methods
  async createSharedList(userId: number, data: InsertSharedList): Promise<SharedList> {
    const id = this.sharedListIdCounter++;
    const now = new Date();
    
    const list: SharedList = {
      id,
      groupId: data.groupId,
      name: data.name,
      description: data.description ?? null,
      createdBy: userId,
      createdAt: now
    };
    
    this.sharedLists.set(id, list);
    return list;
  }
  
  async getSharedList(listId: number): Promise<SharedList | undefined> {
    return this.sharedLists.get(listId);
  }
  
  async getGroupSharedLists(groupId: number): Promise<SharedList[]> {
    return Array.from(this.sharedLists.values())
      .filter(list => list.groupId === groupId);
  }
  
  async updateSharedList(listId: number, data: InsertSharedList): Promise<SharedList> {
    const list = await this.getSharedList(listId);
    
    if (!list) {
      throw new Error("Shared list not found");
    }
    
    const updatedList: SharedList = {
      ...list,
      name: data.name,
      description: data.description ?? list.description
    };
    
    this.sharedLists.set(listId, updatedList);
    return updatedList;
  }
  
  async deleteSharedList(listId: number): Promise<void> {
    // Delete all questions in the list
    const questions = await this.getSharedListQuestions(listId);
    for (const question of questions) {
      await this.deleteSharedListQuestion(question.id);
    }
    
    // Delete the list
    this.sharedLists.delete(listId);
  }
  
  // Shared List Questions methods
  async addSharedListQuestion(userId: number, data: InsertSharedListQuestion): Promise<SharedListQuestion> {
    const id = this.sharedListQuestionIdCounter++;
    const now = new Date();
    
    const question: SharedListQuestion = {
      id,
      listId: data.listId,
      title: data.title,
      url: data.url,
      platform: data.platform,
      difficulty: data.difficulty ?? null,
      topic: data.topic ?? null,
      addedBy: userId,
      createdAt: now
    };
    
    this.sharedListQuestions.set(id, question);
    return question;
  }
  
  async getSharedListQuestions(listId: number): Promise<SharedListQuestion[]> {
    return Array.from(this.sharedListQuestions.values())
      .filter(q => q.listId === listId);
  }
  
  async deleteSharedListQuestion(questionId: number): Promise<void> {
    // Delete all progress records for this question
    const progressRecords = Array.from(this.sharedListProgress.values())
      .filter(progress => progress.questionId === questionId);
    
    for (const progress of progressRecords) {
      this.sharedListProgress.delete(progress.id);
    }
    
    // Delete the question
    this.sharedListQuestions.delete(questionId);
  }
  
  // Shared List Progress methods
  async updateQuestionProgress(userId: number, questionId: number, isSolved: boolean): Promise<SharedListProgress> {
    // Find existing progress
    const existingProgress = Array.from(this.sharedListProgress.values())
      .find(progress => progress.questionId === questionId && progress.userId === userId);
    
    const now = new Date();
    
    if (existingProgress) {
      // Update existing progress
      const updatedProgress: SharedListProgress = {
        ...existingProgress,
        isSolved,
        solvedAt: isSolved ? now : null
      };
      
      this.sharedListProgress.set(existingProgress.id, updatedProgress);
      return updatedProgress;
    } else {
      // Create new progress record
      const id = this.sharedListProgressIdCounter++;
      
      const progress: SharedListProgress = {
        id,
        questionId,
        userId,
        isSolved,
        solvedAt: isSolved ? now : null
      };
      
      this.sharedListProgress.set(id, progress);
      return progress;
    }
  }
  
  async getSharedListProgress(listId: number, userId: number): Promise<SharedListProgress[]> {
    // Get all questions in the list
    const questions = await this.getSharedListQuestions(listId);
    
    // Get progress for each question
    const progress: SharedListProgress[] = [];
    
    for (const question of questions) {
      const questionProgress = Array.from(this.sharedListProgress.values())
        .find(p => p.questionId === question.id && p.userId === userId);
      
      if (questionProgress) {
        progress.push(questionProgress);
      }
    }
    
    return progress;
  }
  
  // Private Tests methods
  async createPrivateTest(userId: number, data: InsertPrivateTest): Promise<PrivateTest> {
    const id = this.privateTestIdCounter++;
    const now = new Date();
    
    const test: PrivateTest = {
      id,
      groupId: data.groupId,
      name: data.name,
      description: data.description ?? null,
      createdBy: userId,
      startTime: data.startTime,
      durationMinutes: data.durationMinutes,
      difficulty: data.difficulty,
      numQuestions: data.numQuestions,
      status: "scheduled",
      createdAt: now
    };
    
    this.privateTests.set(id, test);
    return test;
  }
  
  async getPrivateTest(testId: number): Promise<PrivateTest | undefined> {
    return this.privateTests.get(testId);
  }
  
  async getGroupPrivateTests(groupId: number): Promise<PrivateTest[]> {
    return Array.from(this.privateTests.values())
      .filter(test => test.groupId === groupId);
  }
  
  async updatePrivateTestStatus(testId: number, status: string): Promise<PrivateTest> {
    const test = await this.getPrivateTest(testId);
    
    if (!test) {
      throw new Error("Private test not found");
    }
    
    const updatedTest: PrivateTest = {
      ...test,
      status
    };
    
    this.privateTests.set(testId, updatedTest);
    return updatedTest;
  }
  
  async deletePrivateTest(testId: number): Promise<void> {
    // Delete all questions
    const questions = await this.getTestQuestions(testId);
    for (const question of questions) {
      this.testQuestions.delete(question.id);
    }
    
    // Delete all participants
    const participants = await this.getTestParticipants(testId);
    for (const participant of participants) {
      this.testParticipants.delete(participant.id);
    }
    
    // Delete all submissions
    const submissions = await this.getTestSubmissions(testId);
    for (const submission of submissions) {
      this.testSubmissions.delete(submission.id);
    }
    
    // Delete the test
    this.privateTests.delete(testId);
  }
  
  // Test Questions methods
  async addTestQuestions(questions: InsertTestQuestion[]): Promise<TestQuestion[]> {
    const result: TestQuestion[] = [];
    const now = new Date();
    
    for (const questionData of questions) {
      const id = this.testQuestionIdCounter++;
      
      const question: TestQuestion = {
        id,
        testId: questionData.testId,
        questionId: questionData.questionId,
        title: questionData.title,
        url: questionData.url,
        platform: questionData.platform,
        difficulty: questionData.difficulty,
        points: questionData.points ?? 100,
        createdAt: now
      };
      
      this.testQuestions.set(id, question);
      result.push(question);
    }
    
    return result;
  }
  
  async getTestQuestions(testId: number): Promise<TestQuestion[]> {
    return Array.from(this.testQuestions.values())
      .filter(q => q.testId === testId);
  }
  
  // Test Participants methods
  async addTestParticipant(userId: number, data: InsertTestParticipant): Promise<TestParticipant> {
    const id = this.testParticipantIdCounter++;
    const now = new Date();
    
    // Check if already participating
    const existingParticipant = Array.from(this.testParticipants.values())
      .find(p => p.testId === data.testId && p.userId === userId);
    
    if (existingParticipant) {
      throw new Error("User is already participating in this test");
    }
    
    const participant: TestParticipant = {
      id,
      testId: data.testId,
      userId,
      joinedAt: now
    };
    
    this.testParticipants.set(id, participant);
    return participant;
  }
  
  async getTestParticipants(testId: number): Promise<TestParticipant[]> {
    return Array.from(this.testParticipants.values())
      .filter(p => p.testId === testId);
  }
  
  async getUserTestParticipations(userId: number): Promise<TestParticipant[]> {
    return Array.from(this.testParticipants.values())
      .filter(p => p.userId === userId);
  }
  
  // Test Submissions methods
  async addTestSubmission(userId: number, data: InsertTestSubmission): Promise<TestSubmission> {
    const id = this.testSubmissionIdCounter++;
    const now = new Date();
    
    const submission: TestSubmission = {
      id,
      testId: data.testId,
      questionId: data.questionId,
      userId,
      isCorrect: data.isCorrect,
      submittedAt: now
    };
    
    this.testSubmissions.set(id, submission);
    return submission;
  }
  
  async getTestSubmissions(testId: number): Promise<TestSubmission[]> {
    return Array.from(this.testSubmissions.values())
      .filter(s => s.testId === testId);
  }
  
  async getUserTestSubmissions(testId: number, userId: number): Promise<TestSubmission[]> {
    return Array.from(this.testSubmissions.values())
      .filter(s => s.testId === testId && s.userId === userId);
  }
  
  async getTestResults(testId: number): Promise<{ userId: number; username: string; points: number; solved: number }[]> {
    // Get all participants
    const participants = await this.getTestParticipants(testId);
    const questions = await this.getTestQuestions(testId);
    const submissions = await this.getTestSubmissions(testId);
    
    const results = [];
    
    for (const participant of participants) {
      const user = await this.getUser(participant.userId);
      if (!user) continue;
      
      // Get submissions for this user
      const userSubmissions = submissions.filter(s => s.userId === participant.userId);
      
      // Count correct submissions and total points
      let solved = 0;
      let points = 0;
      
      for (const submission of userSubmissions) {
        if (submission.isCorrect) {
          solved++;
          
          // Find question to get points
          const question = questions.find(q => q.id === submission.questionId);
          if (question) {
            points += question.points;
          }
        }
      }
      
      results.push({
        userId: participant.userId,
        username: user.username,
        points,
        solved
      });
    }
    
    // Sort by points (descending)
    return results.sort((a, b) => b.points - a.points);
  }
}

export const storage = new MemStorage();
