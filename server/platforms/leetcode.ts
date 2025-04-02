import { LeetcodeUserData } from "@shared/schema";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Runs the Python-based LeetCode scraper and returns the results or throws an error
 * 
 * @param username The LeetCode username
 * @returns An object containing the scraped data and any debug information
 */
export async function runLeetCodeScraper(username: string): Promise<{
  data: LeetcodeUserData;
  debug?: string;
}> {
  console.log(`Running LeetCode scraper for user: ${username}`);
  
  // Execute the Python script and capture its output
  const { stdout, stderr } = await execAsync(`python3 server/platforms/leetcode_api.py "${username}"`);
  
  let debugInfo = undefined;
  if (stderr) {
    console.log("API debug info:", stderr);
    debugInfo = stderr;
  }
  
  if (!stdout.trim()) {
    throw new Error("No data returned from the LeetCode API");
  }
  
  // Check if the response contains an error
  try {
    const parsedOutput = JSON.parse(stdout);
    if (parsedOutput.error) {
      throw new Error(`LeetCode API error: ${parsedOutput.error}`);
    }
  } catch (e) {
    // If it's not a JSON parse error, rethrow
    if (!(e instanceof SyntaxError)) {
      throw e;
    }
  }
  
  // Parse the JSON output from the Python script
  const userData = JSON.parse(stdout) as LeetcodeUserData;
  
  // Validate the data structure to ensure it matches the expected format
  if (!userData.username || 
      userData.totalSolved === undefined || 
      userData.easySolved === undefined ||
      userData.mediumSolved === undefined ||
      userData.hardSolved === undefined) {
    throw new Error("Invalid data format returned from the LeetCode scraper");
  }
  
  return { data: userData, debug: debugInfo };
}

/**
 * Fetches LeetCode profile data for a given username using a Selenium-based Python scraper.
 * Falls back to static data if scraping fails.
 * 
 * @param username The LeetCode username
 * @returns LeetCode profile data including problem counts and skill breakdown
 */
export async function fetchLeetcodeData(username: string): Promise<LeetcodeUserData> {
  // First try to get data with the Selenium-based scraper
  try {
    console.log(`Fetching LeetCode data for user: ${username}`);
    
    // Use the runLeetCodeScraper helper function
    const { data } = await runLeetCodeScraper(username);
    return data;
  } catch (error) {
    console.error(`Error fetching LeetCode data for ${username}:`, error);
    // Don't return fake data, throw an error to indicate the profile was not found
    throw new Error(`Profile not found or LeetCode API unavailable for user ${username}. ${(error as Error).message}`);
  }
}
