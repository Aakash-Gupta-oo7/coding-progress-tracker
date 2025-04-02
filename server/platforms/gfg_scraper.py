from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import time
import json
import sys

def get_gfg_profile(username):
    try:
        # Set up Selenium WebDriver
        chrome_options = Options()
        chrome_options.add_argument("--headless")  # Run browser in headless mode
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        
        # Setup webdriver with ChromeDriverManager for automatic driver management
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
        
        # URL for the GFG user profile
        url = f"https://auth.geeksforgeeks.org/user/{username}/practice/"
        driver.get(url)
        
        # Wait for the page to load (max 10 seconds)
        wait = WebDriverWait(driver, 10)
        wait.until(EC.presence_of_element_located((By.CLASS_NAME, "profile_details")))
        
        # A helper function to safely find text
        def safe_find_text(driver, selector, method=By.CSS_SELECTOR, default="0"):
            try:
                element = driver.find_element(method, selector)
                return element.text.strip()
            except:
                return default
        
        # Extract total problems solved
        total_solved_text = safe_find_text(driver, "div.tab_content div.contributed_submissions span", By.CSS_SELECTOR)
        total_solved = int(''.join(filter(str.isdigit, total_solved_text))) if total_solved_text else 0
        
        # Extract institution rank if available
        institution_rank_text = safe_find_text(driver, "div.rank_color:nth-child(1)", By.CSS_SELECTOR)
        institution_rank = int(''.join(filter(str.isdigit, institution_rank_text))) if institution_rank_text else 0
        
        # Extract problem difficulty counts
        school_count = int(safe_find_text(driver, "div:nth-child(1) > span.score_card_value", By.CSS_SELECTOR, "0"))
        basic_count = int(safe_find_text(driver, "div:nth-child(2) > span.score_card_value", By.CSS_SELECTOR, "0"))
        easy_count = int(safe_find_text(driver, "div:nth-child(3) > span.score_card_value", By.CSS_SELECTOR, "0"))
        medium_hard_count = int(safe_find_text(driver, "div:nth-child(4) > span.score_card_value", By.CSS_SELECTOR, "0"))
        
        # Extract monthly activity data if available
        monthly_activity = {}
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        
        # Try to find the heatmap data - this is approximate as GFG might use different ways to show activity
        try:
            heatmap_elements = driver.find_elements(By.CSS_SELECTOR, "rect.ContributionCalendar-day")
            
            # Map the data to months (simplified approach)
            for i, month in enumerate(months):
                # Calculate average activity for each month (example logic)
                month_activities = heatmap_elements[i*7:(i+1)*7] if i < len(heatmap_elements)//7 else []
                if month_activities:
                    activity_count = sum(int(elem.get_attribute("data-count") or "0") for elem in month_activities) // len(month_activities)
                    monthly_activity[month] = activity_count
                else:
                    monthly_activity[month] = 0
        except Exception as e:
            # If we can't get the real data, simulate some basic activity
            for month in months:
                monthly_activity[month] = 0
        
        driver.quit()
        
        # Prepare the result object
        result = {
            "username": username,
            "totalSolved": total_solved,
            "institutionRank": institution_rank,
            "school": school_count,
            "basic": basic_count,
            "easy": easy_count,
            "mediumHard": medium_hard_count,
            "monthlyActivity": monthly_activity
        }
        
        return result
        
    except Exception as e:
        if 'driver' in locals():
            driver.quit()
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Username parameter required"}))
        sys.exit(1)
    
    username = sys.argv[1]
    result = get_gfg_profile(username)
    print(json.dumps(result))