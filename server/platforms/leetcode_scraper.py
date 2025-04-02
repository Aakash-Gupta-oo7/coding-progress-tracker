#!/usr/bin/env python3
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.chrome.service import Service
import time
import json
import sys
import os

def get_leetcode_profile(username):
    """
    Fetches user profile details from LeetCode using Selenium.
    
    Args:
        username: The LeetCode username.
        
    Returns:
        A dictionary containing scraped profile details in the format expected by the application.
    """
    profile_url = f"https://leetcode.com/{username}/"
    
    # --- Selenium Setup ---
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # Run in background
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.binary_location = "/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium"
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
    chrome_options.add_argument("--window-size=1920,1080")
    
    try:
        driver = webdriver.Chrome(options=chrome_options)
    except Exception as e:
        print(f"Error initializing WebDriver: {e}", file=sys.stderr)
        return None
    
    try:
        print(f"Navigating to {profile_url}...", file=sys.stderr)
        driver.get(profile_url)
        
        # Wait for page elements to load
        print("Waiting for page to load...", file=sys.stderr)
        time.sleep(10)
        
        # --- Helper function to safely find elements ---
        def safe_find_text(driver, by, value, attribute=None):
            try:
                element = driver.find_element(by, value)
                if attribute:
                    return element.get_attribute(attribute)
                return element.text.strip()
            except NoSuchElementException:
                print(f"Element not found using {by} = {value}", file=sys.stderr)
                return "0"  # Return "0" instead of "N/A" to ensure numeric values
        
        # --- Scrape Solved Problems Stats ---
        print("Scraping solved problems stats...", file=sys.stderr)
        
        # Initialize with defaults
        easy_solved = 0
        medium_solved = 0
        hard_solved = 0
        total_solved = 0
        ranking = 0
        contest_rating = 0
        topic_data = {}
        
        try:
            # Find the container for all three difficulties
            solved_container = driver.find_element(By.XPATH, "//div[contains(text(), 'Solved Problems')]/following-sibling::div")
            
            # Easy
            easy_div = solved_container.find_element(By.XPATH, ".//div[.//div[contains(text(), 'Easy')]]")
            easy_solved_text = safe_find_text(easy_div, By.XPATH, ".//span[contains(@class, 'text-label-1')]")
            easy_solved = int(easy_solved_text) if easy_solved_text.isdigit() else 0
            
            # Medium
            medium_div = solved_container.find_element(By.XPATH, ".//div[.//div[contains(text(), 'Medium')]]")
            medium_solved_text = safe_find_text(medium_div, By.XPATH, ".//span[contains(@class, 'text-label-1')]")
            medium_solved = int(medium_solved_text) if medium_solved_text.isdigit() else 0
            
            # Hard
            hard_div = solved_container.find_element(By.XPATH, ".//div[.//div[contains(text(), 'Hard')]]")
            hard_solved_text = safe_find_text(hard_div, By.XPATH, ".//span[contains(@class, 'text-label-1')]")
            hard_solved = int(hard_solved_text) if hard_solved_text.isdigit() else 0
            
            # Calculate total
            total_solved = easy_solved + medium_solved + hard_solved
            
        except NoSuchElementException as e:
            print(f"Error finding solved problems: {e}", file=sys.stderr)
        
        # --- Scrape Ranking ---
        ranking_text = safe_find_text(driver, By.XPATH, "//span[contains(@class, 'ttext-label-1')]/../following-sibling::div/span[contains(@class, 'font-medium')]")
        ranking = int(ranking_text.replace(',', '')) if ranking_text.replace(',', '').isdigit() else 0
        
        # --- Scrape Contest Rating (if available) ---
        contest_rating_text = safe_find_text(driver, By.XPATH, "//div[contains(text(), 'Contest Rating')]/following-sibling::div//span")
        contest_rating = int(contest_rating_text) if contest_rating_text.isdigit() else 0
        
        # --- Scrape Skills / Topic Data ---
        try:
            # Find the section header for languages/skills
            skills_header = driver.find_element(By.XPATH, "//div[text()='Languages' or text()='Skills']")
            # Find the container holding the skill items
            skills_container = skills_header.find_element(By.XPATH, "./following-sibling::div")
            # Find individual skill elements within the container
            skill_elements = skills_container.find_elements(By.XPATH, ".//div[contains(@class, 'space-y-1.5')]")
            
            for skill_el in skill_elements:
                skill_name = safe_find_text(skill_el, By.XPATH, ".//span[contains(@class,'text-label-1')]")
                solved_count_text = safe_find_text(skill_el, By.XPATH, ".//span[contains(@class,'text-label-3')]")
                solved_count = int(solved_count_text) if solved_count_text.isdigit() else 0
                
                if skill_name and skill_name != "0":
                    topic_data[skill_name] = solved_count
        except NoSuchElementException as e:
            print(f"Error finding skills/topics: {e}", file=sys.stderr)
        
        # Create the final result in the expected format
        result = {
            "username": username,
            "totalSolved": total_solved,
            "easySolved": easy_solved,
            "mediumSolved": medium_solved,
            "hardSolved": hard_solved,
            "ranking": ranking,
            "contestRating": contest_rating,
            "topicData": topic_data
        }
        
        # Output the result as JSON
        print(json.dumps(result))
        return result
        
    except Exception as e:
        print(f"An error occurred during scraping: {e}", file=sys.stderr)
        return None
    
    finally:
        print("Closing WebDriver.", file=sys.stderr)
        driver.quit()

# --- Main execution block for testing ---
if __name__ == "__main__":
    if len(sys.argv) > 1:
        target_username = sys.argv[1]
        get_leetcode_profile(target_username)
    else:
        print("Please provide a LeetCode username as a command-line argument", file=sys.stderr)
        sys.exit(1)