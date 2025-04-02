import requests
import json
import sys

def get_leetcode_profile(username):
    # GraphQL endpoint for LeetCode
    url = "https://leetcode.com/graphql"
    
    # GraphQL query to fetch detailed user profile data
    query = """
    query getUserProfile($username: String!) {
        matchedUser(username: $username) {
            username
            submitStatsGlobal {
                acSubmissionNum {
                    difficulty
                    count
                }
            }
            profile {
                ranking
                starRating
                reputation
            }
            tagProblemCounts {
                advanced {
                    tagName
                    problemsSolved
                }
                intermediate {
                    tagName
                    problemsSolved
                }
                fundamental {
                    tagName
                    problemsSolved
                }
            }
            languageProblemCount {
                languageName
                problemsSolved
            }
            userCalendar {
                streak
                totalActiveDays
            }
        }
    }
    """
    # Variables for the GraphQL query
    variables = {"username": username}
    
    # Send POST request to the GraphQL endpoint
    response = requests.post(url, json={"query": query, "variables": variables})
    
    # Check if the request was successful
    if response.status_code == 200:
        data = response.json()
        if not data.get('data', {}).get('matchedUser'):
            return {"error": "User not found"}
        
        # Process the data
        result = process_leetcode_data(data)
        return result
    else:
        return {"error": f"API Error: {response.status_code}", "details": response.text}

def process_leetcode_data(profile_data):
    if not profile_data or not profile_data.get("data") or not profile_data["data"].get("matchedUser"):
        return {"error": "No data found"}
    
    matched_user = profile_data["data"]["matchedUser"]
    
    # Extract username
    username = matched_user["username"]
    
    # Extract profile info
    profile = matched_user["profile"]
    ranking = profile.get("ranking", 0)
    
    # Extract submission stats
    submission_stats = matched_user["submitStatsGlobal"]["acSubmissionNum"]
    total_solved = 0
    easy_solved = 0
    medium_solved = 0
    hard_solved = 0
    
    for stat in submission_stats:
        if stat["difficulty"] == "All":
            total_solved = stat["count"]
        elif stat["difficulty"] == "Easy":
            easy_solved = stat["count"]
        elif stat["difficulty"] == "Medium":
            medium_solved = stat["count"]
        elif stat["difficulty"] == "Hard":
            hard_solved = stat["count"]
    
    # Extract topics/tags data
    topic_data = {}
    
    # Process advanced tags
    for tag in matched_user.get("tagProblemCounts", {}).get("advanced", []):
        if tag["problemsSolved"] > 0:
            topic_data[tag["tagName"]] = tag["problemsSolved"]
    
    # Process intermediate tags
    for tag in matched_user.get("tagProblemCounts", {}).get("intermediate", []):
        if tag["problemsSolved"] > 0:
            topic_data[tag["tagName"]] = tag["problemsSolved"]
    
    # Process fundamental tags
    for tag in matched_user.get("tagProblemCounts", {}).get("fundamental", []):
        if tag["problemsSolved"] > 0:
            topic_data[tag["tagName"]] = tag["problemsSolved"]
    
    # Determine a contest rating (use star rating or default to a value based on solved problems)
    contest_rating = profile.get("starRating", 0) * 400 or (1500 + total_solved // 10)
    
    # Create the result structure
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
    
    return result

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Username parameter required"}))
        sys.exit(1)
    
    username = sys.argv[1]
    result = get_leetcode_profile(username)
    print(json.dumps(result))