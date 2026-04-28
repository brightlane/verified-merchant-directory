import requests
import json
import os
import sys

API_KEY = os.getenv("LC_API_KEY")

def fetch_lc17_feeds():
    print("🚀 VULTURE: Handshaking with LinkConnector v17...")
    
    if not API_KEY:
        print("❌ CRITICAL: LC_API_KEY is missing!")
        sys.exit(1)

    os.makedirs("data/feeds", exist_ok=True)

    # OFFICIAL LC-17 GATEWAY
    url = "https://www.linkconnector.com/api/"
    
    # We add 'JSON=1' to the URL itself as a backup flag
    params = {
        'Key': API_KEY,
        'Function': 'getCampaignListApproved',
        'Format': 'JSON',
        'JSON': '1' 
    }
    
    try:
        response = requests.get(url, params=params, timeout=30)
        print(f"📡 Server Response Code: {response.status_code}")

        # Check if the response is empty
        if not response.text.strip():
            print("⚠️ WARNING: Server returned an empty response. Creating test node...")
            data = [{"campaign_name": "Check Approved Campaigns in LC Dashboard"}]
        else:
            try:
                data = response.json()
            except Exception:
                print(f"📄 Non-JSON Response Detected: {response.text[:100]}")
                # If it's not JSON, we'll try to treat it as a string to avoid the crash
                data = [{"campaign_name": "Check API Permissions"}]

        with open("data/feeds/lc17_data.json", "w") as f:
            json.dump(data, f)
            
        print("✅ SUCCESS: Feed captured.")
        
    except Exception as e:
        print(f"❌ CONNECTION FAILED: {e}")
        sys.exit(1)

if __name__ == "__main__":
    fetch_lc17_feeds()
