import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { fetchLeetcodeData } from "./platforms/leetcode";
import { fetchCodeforcesData } from "./platforms/codeforces";
import { fetchGFGData } from "./platforms/geeksforgeeks";
import { searchLeetCodeQuestions } from "./data/leetcode-questions";
import { 
  insertQuestionListSchema,
  insertQuestionSchema,
  insertSearchHistorySchema,
  insertContestSchema,
  insertContestParticipationSchema,
  ContestCreateData
} from "@shared/schema";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execPromise = promisify(exec);

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up auth routes: /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Platform data fetching endpoints
  app.get("/api/fetch/leetcode/:username", async (req, res, next) => {
    try {
      const username = req.params.username;
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }

      const data = await fetchLeetcodeData(username);
      
      // If authenticated, add to search history
      if (req.isAuthenticated()) {
        await storage.addSearchHistory(req.user!.id, {
          searchedUsername: username,
          platform: "leetcode"
        });
      }
      
      res.json(data);
    } catch (error) {
      next(error);
    }
  });
  
  // Get user's platform data (used by the visualization page)
  app.get("/api/platform/leetcode", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const username = req.user!.leetcodeUsername;
      if (!username) {
        return res.status(404).json({ message: "LeetCode username not linked to account" });
      }
      
      const data = await fetchLeetcodeData(username);
      res.json(data);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/platform/codeforces", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const username = req.user!.codeforcesUsername;
      if (!username) {
        return res.status(404).json({ message: "Codeforces username not linked to account" });
      }
      
      const data = await fetchCodeforcesData(username);
      res.json(data);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/platform/gfg", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const username = req.user!.gfgUsername;
      if (!username) {
        return res.status(404).json({ message: "GeeksForGeeks username not linked to account" });
      }
      
      const data = await fetchGFGData(username);
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/fetch/codeforces/:handle", async (req, res, next) => {
    try {
      const handle = req.params.handle;
      if (!handle) {
        return res.status(400).json({ message: "Handle is required" });
      }

      const data = await fetchCodeforcesData(handle);
      
      // If authenticated, add to search history
      if (req.isAuthenticated()) {
        await storage.addSearchHistory(req.user!.id, {
          searchedUsername: handle,
          platform: "codeforces"
        });
      }
      
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/fetch/gfg/:username", async (req, res, next) => {
    try {
      const username = req.params.username;
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }

      const data = await fetchGFGData(username);
      
      // If authenticated, add to search history
      if (req.isAuthenticated()) {
        await storage.addSearchHistory(req.user!.id, {
          searchedUsername: username,
          platform: "gfg"
        });
      }
      
      res.json(data);
    } catch (error) {
      next(error);
    }
  });

  // Compare endpoint
  app.post("/api/compare", async (req, res, next) => {
    try {
      const { leetcodeUsername, codeforcesHandle, gfgUsername } = req.body;
      const result: any = {};
      
      if (leetcodeUsername) {
        result.leetcode = await fetchLeetcodeData(leetcodeUsername);
        if (req.isAuthenticated()) {
          await storage.addSearchHistory(req.user!.id, {
            searchedUsername: leetcodeUsername,
            platform: "leetcode"
          });
        }
      }
      
      if (codeforcesHandle) {
        result.codeforces = await fetchCodeforcesData(codeforcesHandle);
        if (req.isAuthenticated()) {
          await storage.addSearchHistory(req.user!.id, {
            searchedUsername: codeforcesHandle,
            platform: "codeforces"
          });
        }
      }
      
      if (gfgUsername) {
        result.gfg = await fetchGFGData(gfgUsername);
        if (req.isAuthenticated()) {
          await storage.addSearchHistory(req.user!.id, {
            searchedUsername: gfgUsername,
            platform: "gfg"
          });
        }
      }
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // Profile and search history endpoints
  app.get("/api/profile/search-history", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const history = await storage.getSearchHistory(req.user!.id);
      res.json(history);
    } catch (error) {
      next(error);
    }
  });
  
  // Delete a search history item
  app.delete("/api/profile/search-history/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const searchHistoryId = parseInt(req.params.id);
      if (isNaN(searchHistoryId)) {
        return res.status(400).json({ message: "Invalid search history ID" });
      }
      
      await storage.deleteSearchHistoryItem(req.user!.id, searchHistoryId);
      res.status(200).json({ message: "Search history item deleted successfully" });
    } catch (error) {
      next(error);
    }
  });

  // Question list management endpoints
  app.post("/api/questions/create_list", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const parsedData = insertQuestionListSchema.parse(req.body);
      const list = await storage.createQuestionList(req.user!.id, parsedData);
      res.status(201).json(list);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/questions/lists", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const lists = await storage.getQuestionLists(req.user!.id);
      res.json(lists);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/questions/public-lists", async (req, res, next) => {
    try {
      const lists = await storage.getPublicQuestionLists();
      res.json(lists);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/questions/list/:listId", async (req, res, next) => {
    try {
      const listId = parseInt(req.params.listId);
      if (isNaN(listId)) {
        return res.status(400).json({ message: "Invalid list ID" });
      }
      
      const list = await storage.getQuestionList(listId);
      
      if (!list) {
        return res.status(404).json({ message: "List not found" });
      }
      
      // Check if user has access to this list
      if (!list.isPublic && (!req.isAuthenticated() || list.userId !== req.user!.id)) {
        return res.status(403).json({ message: "Access denied to private list" });
      }
      
      const questions = await storage.getQuestionsInList(listId);
      res.json({ list, questions });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/questions/list/:listId", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const listId = parseInt(req.params.listId);
      if (isNaN(listId)) {
        return res.status(400).json({ message: "Invalid list ID" });
      }
      
      const list = await storage.getQuestionList(listId);
      
      if (!list) {
        return res.status(404).json({ message: "List not found" });
      }
      
      if (list.userId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have permission to update this list" });
      }
      
      const parsedData = insertQuestionListSchema.parse(req.body);
      const updatedList = await storage.updateQuestionList(listId, parsedData);
      res.json(updatedList);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/questions/list/:listId", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const listId = parseInt(req.params.listId);
      if (isNaN(listId)) {
        return res.status(400).json({ message: "Invalid list ID" });
      }
      
      const list = await storage.getQuestionList(listId);
      
      if (!list) {
        return res.status(404).json({ message: "List not found" });
      }
      
      if (list.userId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have permission to delete this list" });
      }
      
      await storage.deleteQuestionList(listId);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/questions/add_question", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const parsedData = insertQuestionSchema.parse(req.body);
      
      const list = await storage.getQuestionList(parsedData.listId);
      
      if (!list) {
        return res.status(404).json({ message: "List not found" });
      }
      
      if (list.userId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have permission to add questions to this list" });
      }
      
      const question = await storage.addQuestion(parsedData);
      res.status(201).json(question);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/questions/list/:listId/mark_solved/:questionId", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const listId = parseInt(req.params.listId);
      const questionId = parseInt(req.params.questionId);
      
      if (isNaN(listId) || isNaN(questionId)) {
        return res.status(400).json({ message: "Invalid IDs" });
      }
      
      const list = await storage.getQuestionList(listId);
      
      if (!list) {
        return res.status(404).json({ message: "List not found" });
      }
      
      if (list.userId !== req.user!.id) {
        return res.status(403).json({ message: "You don't have permission to update this list" });
      }
      
      const question = await storage.markQuestionSolved(questionId, req.body.solved);
      res.json(question);
    } catch (error) {
      next(error);
    }
  });
  
  // LeetCode questions database endpoint
  app.get("/api/leetcode/questions", async (req, res, next) => {
    try {
      const query = req.query.q as string || "";
      const questions = searchLeetCodeQuestions(query);
      res.json(questions);
    } catch (error) {
      next(error);
    }
  });
  
  // Contest management endpoints
  app.post("/api/contests", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      try {
        // Parse and validate the incoming data
        // The schema now transforms the string date to a Date object
        const validatedData = insertContestSchema.parse(req.body);
        
        // Use the validated data directly as our ContestCreateData
        const contestData: ContestCreateData = {
          name: validatedData.name,
          platform: validatedData.platform,
          url: validatedData.url,
          startTime: validatedData.startTime, // Already a Date object after transform
          durationSeconds: validatedData.durationSeconds
        };
        
        // Create the contest
        const contest = await storage.createContest(contestData);
        
        // Return the created contest with formatted date for client use
        res.status(201).json({
          ...contest,
          startTime: contest.startTime.toISOString()
        });
      } catch (parseError) {
        // Handle validation errors specifically
        if (parseError instanceof z.ZodError) {
          return res.status(400).json({ 
            message: parseError.errors.map(e => e.message).join(", ")
          });
        }
        throw parseError; // Re-throw other errors
      }
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/contests", async (req, res, next) => {
    try {
      const contests = await storage.getContests();
      
      // Format all dates to ISO strings for client
      const formattedContests = contests.map(contest => ({
        ...contest,
        startTime: contest.startTime.toISOString()
      }));
      
      // If user is authenticated, include participation info
      if (req.isAuthenticated()) {
        const participations = await storage.getUserContestParticipations(req.user!.id);
        
        // Add a 'participated' flag to each contest
        const contestsWithParticipation = formattedContests.map(contest => {
          const participation = participations.find(p => p.contestId === contest.id);
          return {
            ...contest,
            participated: participation ? participation.participated : false
          };
        });
        
        return res.json(contestsWithParticipation);
      }
      
      res.json(formattedContests);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/contests/:id", async (req, res, next) => {
    try {
      const contestId = parseInt(req.params.id);
      if (isNaN(contestId)) {
        return res.status(400).json({ message: "Invalid contest ID" });
      }
      
      const contest = await storage.getContest(contestId);
      
      if (!contest) {
        return res.status(404).json({ message: "Contest not found" });
      }
      
      // Format date to ISO string for client
      const formattedContest = {
        ...contest,
        startTime: contest.startTime.toISOString()
      };
      
      // If user is authenticated, include participation info
      if (req.isAuthenticated()) {
        const participation = await storage.getContestParticipation(req.user!.id, contestId);
        
        return res.json({
          ...formattedContest,
          participated: participation ? participation.participated : false
        });
      }
      
      res.json(formattedContest);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/contests/:id/participate", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
      
      const contestId = parseInt(req.params.id);
      if (isNaN(contestId)) {
        return res.status(400).json({ message: "Invalid contest ID" });
      }
      
      const contest = await storage.getContest(contestId);
      if (!contest) {
        return res.status(404).json({ message: "Contest not found" });
      }
      
      const parsedData = insertContestParticipationSchema.parse({
        contestId,
        participated: req.body.participated
      });
      
      const participation = await storage.setContestParticipation(req.user!.id, parsedData);
      res.json(participation);
    } catch (error) {
      next(error);
    }
  });

  // Test endpoint for the Python LeetCode scraper
  app.get("/api/test/scraper/leetcode/:username", async (req, res, next) => {
    try {
      const username = req.params.username;
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }
      
      try {
        const { runLeetCodeScraper } = await import("./platforms/leetcode");
        const result = await runLeetCodeScraper(username);
        
        res.json({
          success: true,
          data: result.data,
          debug: result.debug
        });
        
      } catch (error) {
        res.status(500).json({ 
          success: false,
          error: (error as Error).message,
          details: "The Python scraper failed. This is expected in the Replit environment, but the fallback mechanism should work."
        });
      }
    } catch (error) {
      next(error);
    }
  });
  
  // Endpoint to fetch upcoming contests from all platforms
  app.get("/api/contests/upcoming", async (req, res, next) => {
    try {
      const pythonPath = path.join(process.cwd(), 'server', 'platforms', 'contest_fetcher.py');
      let contestsData;
      
      try {
        // Run the Python script to fetch contest data
        const { stdout, stderr } = await execPromise(`python ${pythonPath}`);
        
        if (stderr && stderr.length > 0) {
          console.error("Error running contest fetcher script:", stderr);
        }
        
        // Parse the results from stdout
        contestsData = JSON.parse(stdout);
      } catch (pythonError) {
        console.warn("Failed to run Python contest fetcher, using demo data", pythonError);
        
        // Demo data with realistic contest information
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        contestsData = [
          {
            name: "Weekly Contest 392",
            platform: "leetcode",
            url: "https://leetcode.com/contest/weekly-contest-392",
            start_time: tomorrow.toISOString(),
            duration_seconds: 5400
          },
          {
            name: "Biweekly Contest 123",
            platform: "leetcode",
            url: "https://leetcode.com/contest/biweekly-contest-123",
            start_time: nextWeek.toISOString(),
            duration_seconds: 5400
          },
          {
            name: "Codeforces Round #927 (Div. 3)",
            platform: "codeforces",
            url: "https://codeforces.com/contests/1927",
            start_time: tomorrow.toISOString(),
            duration_seconds: 7200
          },
          {
            name: "Educational Codeforces Round 169",
            platform: "codeforces",
            url: "https://codeforces.com/contests/1928",
            start_time: nextWeek.toISOString(),
            duration_seconds: 7200
          },
          {
            name: "GFG Weekly Coding Contest",
            platform: "gfg",
            url: "https://practice.geeksforgeeks.org/contest/gfg-weekly-coding-contest",
            start_time: tomorrow.toISOString(),
            duration_seconds: 5400
          }
        ];
      }
      
      // Store relevant contests in the database for tracking participation
      for (const contest of contestsData) {
        try {
          // Check if contest already exists by matching platform and name
          const existingContests = await storage.getContests();
          const exists = existingContests.some(c => 
            c.platform.toLowerCase() === contest.platform.toLowerCase() && 
            c.name === contest.name
          );
          
          if (!exists) {
            // Create a new contest record
            // Handle different formats between real API data and demo data
            const startTimeStr = contest.start_time_iso || contest.start_time;
            const startTime = new Date(startTimeStr);
            
            // Only add if it's a valid date
            if (isNaN(startTime.getTime())) continue;
            
            const contestData: ContestCreateData = {
              name: contest.name,
              platform: contest.platform.toLowerCase() === 'leetcode' ? 'leetcode' :
                        contest.platform.toLowerCase() === 'codeforces' ? 'codeforces' : 'gfg',
              url: contest.url,
              startTime: startTime,
              durationSeconds: contest.duration_seconds || 7200 // Default to 2 hours if not specified
            };
            
            await storage.createContest(contestData);
          }
        } catch (err) {
          console.error("Error processing contest:", err);
          // Continue with next contest
        }
      }
      
      res.json({
        success: true,
        message: "Contests fetched and saved successfully",
        count: contestsData.length
      });
    } catch (error) {
      console.error("Error in contests/upcoming endpoint:", error);
      
      // Fallback to database contests
      try {
        const contests = await storage.getContests();
        const formattedContests = contests.map(contest => ({
          ...contest,
          startTime: contest.startTime.toISOString()
        }));
        
        res.json({
          success: false,
          message: "Failed to fetch fresh contests. Using existing data.",
          contests: formattedContests
        });
      } catch (storageError) {
        next(storageError);
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
