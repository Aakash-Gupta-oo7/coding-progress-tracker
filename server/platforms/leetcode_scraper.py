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
    
    profile_data = {"username": username, "profile_url": profile_url}
    
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
        
        def safe_find_elements_text(driver, by, value):
            try:
                elements = driver.find_elements(by, value)
                return [el.text.strip() for el in elements if el.text.strip()]
            except NoSuchElementException:
                print(f"Elements not found using {by} = {value}", file=sys.stderr)
                return []
        
        # --- Scrape Basic Info ---
        print("Scraping basic info...", file=sys.stderr)
        # User's display name (might differ from username)
        profile_data['display_name'] = safe_find_text(driver, By.XPATH, "//div[contains(@class, 'text-label-1') and contains(@class, 'dark:text-dark-label-1') and contains(@class, 'break-all')]")
        
        # Rank
        profile_data['ranking'] = safe_find_text(driver, By.XPATH, "//span[contains(@class, 'ttext-label-1')]/../following-sibling::div/span[contains(@class, 'font-medium')]")
        
        # --- Scrape Solved Problems Stats ---
        print("Scraping solved problems stats...", file=sys.stderr)
        try:
            # Find the container for all three difficulties
            solved_container = driver.find_element(By.XPATH, "//div[contains(text(), 'Solved Problems')]/following-sibling::div")
            
            # Easy
            easy_div = solved_container.find_element(By.XPATH, ".//div[.//div[contains(text(), 'Easy')]]")
            profile_data['solved_easy_count'] = safe_find_text(easy_div, By.XPATH, ".//span[contains(@class, 'text-label-1')]")
            profile_data['solved_easy_total'] = safe_find_text(easy_div, By.XPATH, ".//span[contains(text(), '/')]").split('/')[1].strip() if '/' in safe_find_text(easy_div, By.XPATH, ".//span[contains(text(), '/')]") else "0"
            
            # Medium
            medium_div = solved_container.find_element(By.XPATH, ".//div[.//div[contains(text(), 'Medium')]]")
            profile_data['solved_medium_count'] = safe_find_text(medium_div, By.XPATH, ".//span[contains(@class, 'text-label-1')]")
            profile_data['solved_medium_total'] = safe_find_text(medium_div, By.XPATH, ".//span[contains(text(), '/')]").split('/')[1].strip() if '/' in safe_find_text(medium_div, By.XPATH, ".//span[contains(text(), '/')]") else "0"
            
            # Hard
            hard_div = solved_container.find_element(By.XPATH, ".//div[.//div[contains(text(), 'Hard')]]")
            profile_data['solved_hard_count'] = safe_find_text(hard_div, By.XPATH, ".//span[contains(@class, 'text-label-1')]")
            profile_data['solved_hard_total'] = safe_find_text(hard_div, By.XPATH, ".//span[contains(text(), '/')]").split('/')[1].strip() if '/' in safe_find_text(hard_div, By.XPATH, ".//span[contains(text(), '/')]") else "0"
            
            # Total Solved (Calculate or try to find)
            try:
                easy_c = int(profile_data['solved_easy_count'])
                medium_c = int(profile_data['solved_medium_count'])
                hard_c = int(profile_data['solved_hard_count'])
                profile_data['solved_total_calculated'] = easy_c + medium_c + hard_c
            except ValueError:
                profile_data['solved_total_calculated'] = 0
                # Try to find a total count element if calculation fails
                profile_data['solved_total_displayed'] = safe_find_text(driver, By.XPATH, "//div[contains(text(), 'Beats')]/preceding-sibling::div//span[contains(@class, 'text-label-1')]")
                
        except NoSuchElementException:
            print("Could not find solved problems container or its children.", file=sys.stderr)
            profile_data.update({
                'solved_easy_count': "0",
                'solved_easy_total': "0",
                'solved_medium_count': "0",
                'solved_medium_total': "0",
                'solved_hard_count': "0",
                'solved_hard_total': "0",
                'solved_total_calculated': 0,
                'solved_total_displayed': "0"
            })
            
        # --- Scrape Contest Rating (if available) ---
        contest_rating_text = safe_find_text(driver, By.XPATH, "//div[contains(text(), 'Contest Rating')]/following-sibling::div//span")
        profile_data['contest_rating'] = contest_rating_text
            
        # --- Scrape Skills / Languages ---
        print("Scraping skills/languages...", file=sys.stderr)
        skills = []
        try:
            # Find the section header for languages/skills
            skills_header = driver.find_element(By.XPATH, "//div[text()='Languages' or text()='Skills']")
            # Find the container holding the skill items
            skills_container = skills_header.find_element(By.XPATH, "./following-sibling::div")
            # Find individual skill elements within the container
            skill_elements = skills_container.find_elements(By.XPATH, ".//div[contains(@class, 'space-y-1.5')]")
            
            for skill_el in skill_elements:
                skill_name = safe_find_text(skill_el, By.XPATH, ".//span[contains(@class,'text-label-1')]")
                solved_count = safe_find_text(skill_el, By.XPATH, ".//span[contains(@class,'text-label-3')]")
                if skill_name != "0":
                    skills.append({"skill_name": skill_name, "solved_count": solved_count})
        except NoSuchElementException:
            print("Could not find skills/languages section or elements.", file=sys.stderr)
        profile_data['skills_languages'] = skills
        
        # --- Scrape Recent Submissions ---
        print("Scraping recent submissions...", file=sys.stderr)
        submissions = []
        try:
            # Find the table or container for recent submissions
            submission_rows = driver.find_elements(By.XPATH, "//div[contains(@class, 'reactable-data')]//tr")
            # Fallback selector if the above doesn't work
            if not submission_rows:
                submission_rows = driver.find_elements(By.XPATH, "//a[contains(@href, '/submissions/detail/')]/ancestor::div[contains(@class, 'odd:bg-layer-1') or contains(@class, 'even:bg-transparent')]")
                
            for row in submission_rows[:5]: # Limit to first 5 visible for brevity
                try:
                    status = safe_find_text(row, By.XPATH, ".//span[contains(@class, 'text-green') or contains(@class, 'text-red')]")
                    problem_link_el = row.find_element(By.XPATH, ".//a[contains(@href, '/problems/')]")
                    problem_name = problem_link_el.text.strip()
                    problem_url = problem_link_el.get_attribute('href')
                    language = safe_find_text(row, By.XPATH, ".//span[not(contains(@class, 'text-green')) and not(contains(@class, 'text-red')) and contains(@class,'')]")
                    
                    submissions.append({
                        "status": status,
                        "problem_name": problem_name,
                        "problem_url": problem_url,
                        "language": language
                    })
                except NoSuchElementException:
                    print("Could not parse a submission row.", file=sys.stderr)
                    continue # Skip this row if essential elements are missing
                    
        except NoSuchElementException:
            print("Could not find recent submissions container.", file=sys.stderr)
        profile_data['recent_submissions'] = submissions
        
        # --- Scrape Community Stats ---
        print("Scraping community stats...", file=sys.stderr)
        profile_data['views'] = safe_find_text(driver, By.XPATH, "//div[contains(text(), 'Views')]/span")
        profile_data['solution'] = safe_find_text(driver, By.XPATH, "//div[contains(text(), 'Solution')]/span")
        profile_data['discuss'] = safe_find_text(driver, By.XPATH, "//div[contains(text(), 'Discuss')]/span")
        profile_data['reputation'] = safe_find_text(driver, By.XPATH, "//div[contains(text(), 'Reputation')]/span")
        
        print("Scraping finished.", file=sys.stderr)
        
        # Convert to the format needed by the application
        easy_solved = int(profile_data.get('solved_easy_count', '0')) if profile_data.get('solved_easy_count', '0').isdigit() else 0
        medium_solved = int(profile_data.get('solved_medium_count', '0')) if profile_data.get('solved_medium_count', '0').isdigit() else 0
        hard_solved = int(profile_data.get('solved_hard_count', '0')) if profile_data.get('solved_hard_count', '0').isdigit() else 0
        total_solved = profile_data.get('solved_total_calculated', easy_solved + medium_solved + hard_solved)
        ranking = int(profile_data.get('ranking', '0').replace(',', '')) if profile_data.get('ranking', '0').replace(',', '').isdigit() else 0
        contest_rating = int(profile_data.get('contest_rating', '0')) if profile_data.get('contest_rating', '0').isdigit() else 0
        
        # Convert skills to topic data format
        topic_data = {}
        for skill in profile_data.get('skills_languages', []):
            skill_name = skill.get('skill_name')
            solved_count = skill.get('solved_count', '0')
            if skill_name:
                topic_data[skill_name] = int(solved_count) if solved_count.isdigit() else 0
        
        # Create the final result in the expected format
        result = {
            "username": username,
            "totalSolved": total_solved if isinstance(total_solved, int) else 0,
            "easySolved": easy_solved,
            "mediumSolved": medium_solved,
            "hardSolved": hard_solved,
            "ranking": ranking,
            "contestRating": contest_rating,
            "topicData": topic_data,
            "detailedData": profile_data  # Include the full detailed data as well
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