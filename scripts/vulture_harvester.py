import requests
import json
import os
import sys

# Uses the key from your Titan Engine settings
API_KEY = os.getenv("LC_API_KEY")

def fetch_lc17_feeds():
    print("🚀 VULTURE: Handshaking with LinkConnector v17...")
    
    if not API_KEY:
        print("❌ CRITICAL: LC_API_KEY is missing!")
        sys.exit(1)

    os.makedirs("data/feeds", exist_ok=True)

    # REPAIRED GATEWAY: LC-17 uses this specific gateway for all API calls
    url = "https://www.linkconnector.com/api/"
    
    # EXACT PARAMETERS: LC-17 is case-sensitive for 'Key' and 'Function'
    params = {
        'Key': API_KEY,
        'Function': 'getCampaignListApproved', # This is the standard function for your merchants
        'Format': 'JSON'
    }
    
    try:
        # We send the request using 'params' to ensure proper encoding
        response = requests.get(url, params=params, timeout=30)
        
        print(f"📡 Server Response Code: {response.status_code}")

        # Check if we got HTML again (Redirect)
        if "<!DOCTYPE html>" in response.text:
            print("❌ REDIRECT DETECTED: Still getting HTML.")
            print("Please log into LinkConnector and ensure your API Key is 'Active'.")
            sys.exit(1)

        data = response.json()
        
        with open("data/feeds/lc17_data.json", "w") as f:
            json.dump(data, f)
            
        # This will tell us if it found your campaigns
        count = len(data) if isinstance(data, list) else "Unknown"
        print(f"✅ SUCCESS: Captured {count} LC-17 campaigns.")
        
    except Exception as e:
        print(f"❌ CONNECTION FAILED: {e}")
        sys.exit(1)

if __name__ == "__main__":
    fetch_lc17_feeds()
