import requests
import json
import os
import sys

API_KEY = os.getenv("LC_API_KEY")

def fetch_lc17_feeds():
    print("🚀 VULTURE: Harvesting LinkConnector 17 Campaigns...")
    
    if not API_KEY:
        print("❌ CRITICAL: LC_API_KEY is missing!")
        sys.exit(1)

    os.makedirs("data/feeds", exist_ok=True)

    # REPAIRED URL: LC-17 uses the 'v17' endpoint with a specific function call
    # We are calling the 'getCampaigns' function which returns your approved merchants
    url = f"https://api.linkconnector.com/v17/api.php?api_key={API_KEY}&function=getCampaigns"
    
    try:
        # Some LC-17 endpoints prefer a simple GET, but require specific headers
        response = requests.get(url, timeout=30)
        
        # If 404 persists, the API might be using the legacy format:
        if response.status_code == 404:
            print("🔄 Attempting Legacy LC-17 Format...")
            url = f"https://www.linkconnector.com/api/v17/getCampaigns.php?api_key={API_KEY}"
            response = requests.get(url, timeout=30)

        response.raise_for_status()
        
        data = response.json()
        
        # LinkConnector often wraps data in a 'results' or 'campaigns' object
        with open("data/feeds/lc17_data.json", "w") as f:
            json.dump(data, f)
            
        print(f"✅ SUCCESS: Harvested LC-17 data. Status: {response.status_code}")
        
    except Exception as e:
        print(f"❌ LC-17 HARVEST FAILED: {e}")
        # To prevent a total build failure while testing, you can remove sys.exit(1)
        # but for now, we want to know if it fails.
        sys.exit(1)

if __name__ == "__main__":
    fetch_lc17_feeds()
