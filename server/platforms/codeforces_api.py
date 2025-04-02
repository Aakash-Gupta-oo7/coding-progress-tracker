import requests
import json
import sys
from collections import defaultdict
import time

def get_codeforces_profile(handle):
    # Base URL for Codeforces API
    base_url = "https://codeforces.com/api/"
    
    try:
        # Fetch user info (rating, rank, etc.)
        user_info_url = f"{base_url}user.info?handles={handle}"
        response = requests.get(user_info_url)
        
        if response.status_code != 200 or response.json()["status"] != "OK":
            return {"error": "Error fetching user info", "details": response.text}
        
        user_info = response.json()["result"][0]
        
        # Wait a bit to avoid rate limiting
        time.sleep(0.5)
        
        # Fetch user submissions (to calculate solved problems and tags)
        submissions_url = f"{base_url}user.status?handle={handle}&from=1&count=100"
        response = requests.get(submissions_url)
        
        if response.status_code != 200 or response.json()["status"] != "OK":
            return {"error": "Error fetching user submissions", "details": response.text}
        
        submissions = response.json()["result"]
        
        # Fetch user contest ratings
        ratings_url = f"{base_url}user.rating?handle={handle}"
        response = requests.get(ratings_url)
        
        contests = []
        if response.status_code == 200 and response.json()["status"] == "OK":
            ratings_data = response.json()["result"]
            # Get the most recent contests (up to 10)
            for contest in ratings_data[-10:] if len(ratings_data) > 10 else ratings_data:
                contests.append({
                    "contestId": contest["contestId"],
                    "contestName": contest["contestName"],
                    "rank": contest["rank"],
                    "ratingChange": contest["newRating"] - contest["oldRating"]
                })
        
        # Process the user data
        result = process_codeforces_data(user_info, submissions, contests)
        return result
        
    except Exception as e:
        return {"error": str(e)}

def process_codeforces_data(user_info, submissions, contests):
    # Extract general profile information
    handle = user_info.get("handle", "")
    rating = user_info.get("rating", 0)
    rank = user_info.get("rank", "newbie").lower()
    max_rank = user_info.get("maxRank", "newbie")
    
    # Capitalized rank for display
    max_rank = max_rank[0].upper() + max_rank[1:] if max_rank else "Newbie"
    
    # Process submissions to extract solved problems by category
    solved_problems = set()
    problem_categories = defaultdict(int)
    
    for submission in submissions:
        if submission["verdict"] == "OK":  # Only consider accepted solutions
            problem = submission["problem"]
            problem_id = f"{problem.get('contestId', 0)}_{problem.get('index', '')}"
            
            if problem_id not in solved_problems:
                solved_problems.add(problem_id)
                
                # Count problems by category (e.g., difficulty level)
                problem_index = problem.get("index", "")
                if problem_index:
                    category = problem_index[0]  # First letter indicates difficulty (A, B, C, etc.)
                    problem_categories[category] += 1
    
    # Group problems into difficulty levels
    level_AB = 0  # Easy problems (A and B)
    level_CD = 0  # Medium problems (C and D)
    level_E = 0   # Hard problems (E and above)
    
    for category, count in problem_categories.items():
        if category in ['A', 'B']:
            level_AB += count
        elif category in ['C', 'D']:
            level_CD += count
        else:
            level_E += count
    
    return {
        "handle": handle,
        "totalSolved": len(solved_problems),
        "rating": rating,
        "maxRank": max_rank,
        "levelAB": level_AB,
        "levelCD": level_CD,
        "levelE": level_E,
        "contests": contests
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Handle parameter required"}))
        sys.exit(1)
    
    handle = sys.argv[1]
    result = get_codeforces_profile(handle)
    print(json.dumps(result))