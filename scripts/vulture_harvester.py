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

    # NEW URL: Using the common Merchant Campaigns function
    url = f"https://www.linkconnector.com/api/v17/GetMerchantCampaigns.php?api_key={API_KEY}&output=json"
    
    # We add a 'User-Agent' to pretend we are a browser. This stops the "Site Map" redirect.
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        print(f"📡 Server Response Code: {response.status_code}")

        # If it looks like HTML again, we need to stop and investigate
        if "<!DOCTYPE html>" in response.text:
            print("❌ REDIRECT DETECTED: LinkConnector sent a webpage instead of data.")
            print("Check if your API Key has 'API Access' enabled in your LC Dashboard.")
            sys.exit(1)

        data = response.json()
        
        with open("data/feeds/lc17_data.json", "w") as f:
            json.dump(data, f)
            
        print(f"✅ SUCCESS: Data captured. Items found: {len(data)}")
        
    except Exception as e:
        print(f"❌ LC-17 CONNECTION FAILED: {e}")
        # We create a dummy file so the generator doesn't crash while you check your key
        with open("data/feeds/lc17_data.json", "w") as f:
            json.dump([{"campaign_name": "API_CONNECTION_PENDING"}], f)
        sys.exit(0) 

if __name__ == "__main__":
    fetch_lc17_feeds()
