import { GFGUserData } from "@shared/schema";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function fetchGFGData(username: string): Promise<GFGUserData> {
  try {
    // Fetching GeeksForGeeks data using the Python scraper
    console.log(`Fetching GeeksForGeeks data for user: ${username}`);
    
    try {
      // Execute the Python script and capture its output
      const { stdout, stderr } = await execAsync(`python3 server/platforms/gfg_scraper.py "${username}"`);
      
      if (stderr) {
        console.log("Scraper debug info:", stderr);
      }
      
      if (!stdout.trim()) {
        throw new Error("No data returned from the GFG scraper");
      }
      
      // Parse the JSON output from the Python script
      const result = JSON.parse(stdout);
      
      // Check if the response contains an error
      if (result.error) {
        throw new Error(`GFG scraper error: ${result.error}`);
      }
      
      return result;
    } catch (scrapingError) {
      console.error(`Error using GFG scraper: ${scrapingError}`);
      // Don't return fake data, throw an error to indicate the profile was not found
      throw new Error(`Profile not found or GeeksForGeeks API unavailable for user ${username}. ${(scrapingError as Error).message}`);
    }
  } catch (error) {
    console.error(`Error fetching GFG data for ${username}:`, error);
    throw new Error(`Failed to fetch GeeksForGeeks data: ${(error as Error).message}`);
  }
}