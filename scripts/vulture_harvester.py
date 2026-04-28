import requests
import json
import os
import sys

# The key we put in your titan.yml
API_KEY = os.getenv("LC_API_KEY")

def fetch_lc17_feeds():
    print("🚀 VULTURE: Harvesting LinkConnector 17 Campaigns...")
    
    if not API_KEY:
        print("❌ CRITICAL: LC_API_KEY is missing from environment!")
        sys.exit(1)

    os.makedirs("data/feeds", exist_ok=True)

    # LinkConnector API v17 Endpoint for your campaigns
    # Note: We use the 'campaigns' endpoint to get your merchant list
    url = f"https://api.linkconnector.com/v17/campaigns?api_key={API_KEY}"
    
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        
        # We save it specifically for the generator to find
        with open("data/feeds/lc17_data.json", "w") as f:
            json.dump(data, f)
            
        print(f"✅ SUCCESS: Harvested LC-17 data. Status: {response.status_code}")
    except Exception as e:
        print(f"❌ LC-17 HARVEST FAILED: {e}")
        # We don't want the engine to crash, but we need to know why it failed
        sys.exit(1)

if __name__ == "__main__":
    fetch_lc17_feeds()
