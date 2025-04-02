import { CodeforcesUserData } from "@shared/schema";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function fetchCodeforcesData(handle: string): Promise<CodeforcesUserData> {
  try {
    // Fetch CodeForces data using the Python API client
    console.log(`Fetching CodeForces data for handle: ${handle}`);
    
    // Execute the Python script and capture its output
    const { stdout, stderr } = await execAsync(`python3 server/platforms/codeforces_api.py "${handle}"`);
    
    if (stderr) {
      console.log("API debug info:", stderr);
    }
    
    if (!stdout.trim()) {
      throw new Error("No data returned from the CodeForces API");
    }
    
    // Parse the JSON output from the Python script
    const result = JSON.parse(stdout);
    
    // Check if the response contains an error
    if (result.error) {
      throw new Error(`CodeForces API error: ${result.error}`);
    }
    
    // Don't fall back to hardcoded data
    if (!result.handle) {
      throw new Error(`No profile found for CodeForces handle: ${handle}`);
    }
    
    return result;
  } catch (error) {
    console.error(`Error fetching CodeForces data for ${handle}:`, error);
    throw new Error(`Failed to fetch CodeForces data: ${(error as Error).message}`);
  }
}
