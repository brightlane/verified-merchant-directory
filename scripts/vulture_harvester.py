import requests
import json
import os
import sys

API_KEY = os.getenv("LC_API_KEY")

def fetch_lc17_feeds():
    print("🚀 VULTURE: Deep-Scanning LC-17 Functions...")
    
    if not API_KEY:
        print("❌ CRITICAL: LC_API_KEY is missing!")
        sys.exit(1)

    os.makedirs("data/feeds", exist_ok=True)
    url = "https://www.linkconnector.com/api/"
    
    # We will try these functions in order until one works
    functions_to_try = [
        'getMerchantCampaigns',      # Most common for affiliate data
        'getCampaignListApproved',   # Standard approved list
        'getCreatives'               # Backdoor: gets data via your links
    ]

    data = []
    for func in functions_to_try:
        print(f"📡 Trying Function: {func}...")
        params = {'Key': API_KEY, 'Function': func, 'Format': 'JSON', 'JSON': '1'}
        
        try:
            response = requests.get(url, params=params, timeout=20)
            if response.status_code == 200 and "<!DOCTYPE html>" not in response.text:
                temp_data = response.json()
                # Check if we actually got a list of items
                if isinstance(temp_data, list) and len(temp_data) > 0:
                    data = temp_data
                    print(f"✅ SUCCESS: Found {len(data)} items using {func}!")
                    break
        except Exception:
            continue

    # If all fail, we save a specific error message for the sitemap to show us
    if not data:
        print("⚠️ All LC-17 functions returned empty. Check LC Dashboard for 'Approved' status.")
        data = [{"campaign_name": "No-Approved-Campaigns-Found"}]

    with open("data/feeds/lc17_data.json", "w") as f:
        json.dump(data, f)
            
    print("✅ Feed Sync Complete.")

if __name__ == "__main__":
    fetch_lc17_feeds()
