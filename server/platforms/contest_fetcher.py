import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime, timedelta, timezone
import time
import re
import logging # Use logging for better error messages

# --- Configuration ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

# --- Helper Functions ---

def parse_gfg_time_string(time_str):
    """
    Attempts to parse GFG's variable time string format into a naive datetime object.
    Returns None if parsing fails.
    NOTE: GFG often uses IST. This parser currently ignores timezone info,
          returning a naive datetime. The consuming application might need
          to interpret this based on context if timezone precision is critical.
    """
    time_str = time_str.replace("Starts on:", "").replace("Ended on:", "").strip()
    # Remove timezone abbreviations like IST, UTC etc. (makes parsing simpler for strptime)
    time_str_no_tz = re.sub(r'\s+[A-Z]{3,}(\s*[\+\-]\d{2}:?\d{2})?$', '', time_str).strip()

    # Common GFG format: "15 Aug, 2024 08:00 PM"
    formats_to_try = [
        '%d %b, %Y %I:%M %p', # 15 Aug, 2024 08:00 PM
        '%d %B, %Y %I:%M %p', # 15 August, 2024 08:00 PM
        '%Y-%m-%d %H:%M:%S',  # Sometimes might have standard formats
        '%d %b %Y %H:%M'      # Example: 21 Jul 2024 14:30
    ]

    for fmt in formats_to_try:
        try:
            # Return the first format that matches
            return datetime.strptime(time_str_no_tz, fmt)
        except ValueError:
            continue # Try next format

    # Handle relative times like "Starts in..." / "Ends in..." - We can't get an exact time easily.
    if "Starts in" in time_str or "Ends in" in time_str:
         logging.warning(f"Cannot determine exact start time from relative GFG string: {time_str}")
         return None # Cannot place accurately on a calendar

    logging.warning(f"Could not parse GFG time string: {time_str} (tried formats: {formats_to_try})")
    return None

# --- Platform Specific Fetchers ---

def get_codeforces_contests():
    """Fetches upcoming/ongoing contests from Codeforces API. Returns UTC datetimes."""
    logging.info("Fetching Codeforces contests...")
    contests_for_calendar = []
    url = "https://codeforces.com/api/contest.list?gym=false"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()

        if data['status'] == 'OK':
            for contest in data['result']:
                # Filter for contests that are not finished yet
                if contest['phase'] == 'FINISHED':
                    continue

                start_time_unix = contest.get('startTimeSeconds')
                duration_seconds = contest.get('durationSeconds')

                if not start_time_unix or not duration_seconds:
                    logging.warning(f"Skipping Codeforces contest due to missing time/duration: {contest.get('name')}")
                    continue

                # Unix timestamps are UTC
                start_time_utc = datetime.fromtimestamp(start_time_unix, tz=timezone.utc)
                end_time_utc = start_time_utc + timedelta(seconds=duration_seconds)

                contests_for_calendar.append({
                    "id": f"cf-{contest['id']}",
                    "platform": "Codeforces",
                    "name": contest['name'],
                    "url": f"https://codeforces.com/contest/{contest['id']}",
                    "start_time_iso": start_time_utc.isoformat(), # ISO 8601 format with UTC offset
                    "end_time_iso": end_time_utc.isoformat(),     # ISO 8601 format with UTC offset
                    "duration_seconds": duration_seconds,
                    "status": contest['phase'].capitalize() # BEFORE, CODING, PENDING_SYSTEM_TEST, SYSTEM_TEST
                })
        else:
            logging.error(f"Codeforces API returned status: {data.get('comment', 'Unknown Error')}")

    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching Codeforces contests: {e}")
    except json.JSONDecodeError:
        logging.error("Error decoding Codeforces API response.")
    except KeyError as e:
        logging.error(f"Unexpected structure in Codeforces API response. Missing key: {e}")

    logging.info(f"Found {len(contests_for_calendar)} upcoming/ongoing Codeforces contests.")
    return contests_for_calendar

def get_leetcode_contests():
    """
    Fetches upcoming/ongoing contests by scraping LeetCode contest page.
    Uses __NEXT_DATA__ JSON. Returns UTC datetimes.
    """
    logging.info("Fetching LeetCode contests...")
    contests_for_calendar = []
    url = "https://leetcode.com/contest/"
    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'lxml')

        script_tag = soup.find('script', id='__NEXT_DATA__')
        if not script_tag:
            logging.error("Could not find __NEXT_DATA__ script tag on LeetCode. Scraping failed.")
            return contests_for_calendar # Cannot proceed

        data = json.loads(script_tag.string)

        # Navigate the JSON structure - This path IS LIKELY TO CHANGE
        all_contests_data = []
        try:
            queries = data.get('props', {}).get('pageProps', {}).get('dehydratedState', {}).get('queries', [])
            for query in queries:
                 query_data = query.get('state', {}).get('data', {})
                 if query_data:
                     # These keys are common but might change (inspect __NEXT_DATA__ if it breaks)
                     top_two = query_data.get('topTwoContests')
                     upcoming = query_data.get('upcomingContests')
                     if isinstance(top_two, list): all_contests_data.extend(top_two)
                     if isinstance(upcoming, list): all_contests_data.extend(upcoming)

            if not all_contests_data:
                 logging.warning("Could not extract contest data lists from LeetCode's __NEXT_DATA__.")
                 return contests_for_calendar

            processed_slugs = set()
            now_utc = datetime.now(timezone.utc)

            for contest in all_contests_data:
                if not isinstance(contest, dict): continue

                title_slug = contest.get('titleSlug')
                if not title_slug or title_slug in processed_slugs:
                    continue

                start_time_unix = contest.get('startTime') # Unix timestamp (seconds), assumed UTC
                duration_seconds = contest.get('duration') # Seconds

                if start_time_unix is None or duration_seconds is None:
                    logging.warning(f"Skipping LeetCode contest due to missing time/duration: {title_slug}")
                    continue

                start_time_utc = datetime.fromtimestamp(start_time_unix, tz=timezone.utc)
                end_time_utc = start_time_utc + timedelta(seconds=duration_seconds)

                # Filter out finished contests
                if end_time_utc < now_utc:
                    continue

                status = "Upcoming"
                if start_time_utc <= now_utc <= end_time_utc:
                    status = "Ongoing"
                # No need for 'Finished' status as we filter them out above

                contests_for_calendar.append({
                    "id": f"lc-{title_slug}",
                    "platform": "LeetCode",
                    "name": contest.get('title', 'N/A'),
                    "url": f"https://leetcode.com/contest/{title_slug}/",
                    "start_time_iso": start_time_utc.isoformat(),
                    "end_time_iso": end_time_utc.isoformat(),
                    "duration_seconds": duration_seconds,
                    "status": status
                })
                processed_slugs.add(title_slug)

        except (KeyError, TypeError, IndexError, AttributeError) as e:
            logging.error(f"Error parsing LeetCode __NEXT_DATA__ structure. It might have changed. Error: {e}", exc_info=True)

    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching LeetCode contests page: {e}")
    except json.JSONDecodeError:
        logging.error("Error decoding LeetCode __NEXT_DATA__.")
    except Exception as e:
        logging.error(f"An unexpected error occurred during LeetCode scraping: {e}", exc_info=True)


    logging.info(f"Found {len(contests_for_calendar)} upcoming/ongoing LeetCode contests.")
    return contests_for_calendar

def get_gfg_contests():
    """
    Fetches upcoming/ongoing contests by scraping GFG practice contest page.
    Returns naive datetimes in ISO format. Timezone handling might be needed downstream.
    """
    logging.info("Fetching GeeksforGeeks contests...")
    contests_for_calendar = []
    url = "https://practice.geeksforgeeks.org/contests"
    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'lxml')

        # Selector needs frequent verification by inspecting GFG's contest page HTML
        # This targets cards within a common structure, but is fragile.
        contest_cards = soup.select('div.gfg-contest-card__container') # Adjust if this class changes
        if not contest_cards:
             # Fallback: Look for elements with typical card-like classes
             contest_cards = soup.select('div[class*="card"][class*="contest"]')

        if not contest_cards:
            logging.error("Could not find contest cards on GFG page. Structure likely changed.")
            return contests_for_calendar

        now_naive = datetime.now() # Use naive datetime for comparison with parsed GFG times

        for card in contest_cards:
            # Extract data using selectors (these WILL break eventually)
            name_tag = card.select_one('.gfg-contest-card__name, .contest-name, h3') # Try multiple possibilities
            link_tag = card.select_one('a.gfg-contest-card__button--detail, a[href*="/contests/"]')
            time_info_tag = card.select_one('.gfg-contest-card__status--upcoming, .gfg-contest-card__status--active, .contest-timing')
            # Duration is often tricky on GFG cards, might be missing or in text
            duration_tag = card.select_one('.gfg-contest-card__duration, span[class*="duration"]') # Check multiple possible elements

            if not name_tag or not link_tag or not time_info_tag:
                # logging.debug("Skipping GFG card, couldn't find essential elements.")
                continue # Skip card if core info is missing

            name = name_tag.text.strip()
            relative_url = link_tag.get('href', '')
            full_url = f"https://practice.geeksforgeeks.org{relative_url}" if relative_url.startswith('/') else relative_url

            # Unique ID - using URL path segment if possible
            contest_id_match = re.search(r'/contests?/([^/]+)/?$', relative_url)
            contest_gfg_id = contest_id_match.group(1) if contest_id_match else name.replace(" ", "-").lower()
            unique_id = f"gfg-{contest_gfg_id}"

            time_str = time_info_tag.text.strip()
            start_time_naive = parse_gfg_time_string(time_str) # Returns naive datetime or None

            duration_seconds = None
            if duration_tag:
                duration_text = duration_tag.text.lower()
                # Try parsing "X hrs", "Y mins" - simplistic approach
                hours_match = re.search(r'(\d+)\s*hr', duration_text)
                mins_match = re.search(r'(\d+)\s*min', duration_text)
                total_secs = 0
                if hours_match:
                    total_secs += int(hours_match.group(1)) * 3600
                if mins_match:
                    total_secs += int(mins_match.group(1)) * 60
                if total_secs > 0:
                    duration_seconds = total_secs

            if not start_time_naive:
                # If we couldn't parse a specific start time, skip (can't place on calendar)
                logging.warning(f"Skipping GFG contest '{name}' due to unparsable start time.")
                continue

            end_time_naive = None
            if duration_seconds:
                end_time_naive = start_time_naive + timedelta(seconds=duration_seconds)
            else:
                # Default duration - 2 hours if not specified
                end_time_naive = start_time_naive + timedelta(hours=2)
                duration_seconds = 7200 # 2 hours in seconds

            # Handle status - We'll use basic logic based on current time
            status = "Upcoming"
            if now_naive <= start_time_naive:
                status = "Upcoming"
            elif start_time_naive <= now_naive <= end_time_naive:
                status = "Ongoing"
            else:
                status = "Finished"
                # Skip finished contests
                continue

            # Since GFG times don't have explicit timezone, we make them into
            # ISO format strings without timezone specifiers for client interpretation
            contests_for_calendar.append({
                "id": unique_id,
                "platform": "GeeksforGeeks",
                "name": name,
                "url": full_url,
                "start_time_iso": start_time_naive.isoformat(), # No timezone info!
                "end_time_iso": end_time_naive.isoformat(),     # No timezone info!
                "duration_seconds": duration_seconds,
                "status": status
            })

    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching GFG contests page: {e}")
    except Exception as e:
        logging.error(f"An unexpected error during GFG scraping: {e}", exc_info=True)

    logging.info(f"Found {len(contests_for_calendar)} upcoming/ongoing GFG contests.")
    return contests_for_calendar

def get_all_platform_contests():
    """
    Fetch contests from all supported platforms and combine results.
    
    Returns:
        List of dictionaries, each representing a contest with standardized fields.
    """
    all_contests = []
    
    try:
        # Fetch from different platforms
        cf_contests = get_codeforces_contests()
        lc_contests = get_leetcode_contests()
        gfg_contests = get_gfg_contests()
        
        # Combine results
        all_contests.extend(cf_contests)
        all_contests.extend(lc_contests)
        all_contests.extend(gfg_contests)
        
        logging.info(f"Combined total: {len(all_contests)} contests from all platforms")
    except Exception as e:
        logging.error(f"Error while fetching contests: {e}", exc_info=True)
    
    return all_contests

if __name__ == "__main__":
    # This will execute if this script is run directly
    contests = get_all_platform_contests()
    print(json.dumps(contests, indent=2))