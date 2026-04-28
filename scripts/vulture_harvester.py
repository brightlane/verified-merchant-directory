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

    # LinkConnector v17 Endpoint
    # We add 'json=1' to FORCE the server to send us JSON instead of a webpage
    url = f"https://www.linkconnector.com/api/v17/getCampaigns.php?api_key={API_KEY}&json=1"
    
    try:
        response = requests.get(url, timeout=30)
        
        # LOGGING: This shows us exactly what the server sent back
        print(f"📡 Server Response Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Server Error Content: {response.text[:200]}")
            sys.exit(1)

        # Handle the case where LC sends text instead of JSON
        try:
            data = response.json()
        except Exception:
            print("⚠️ Server didn't return JSON. Checking if it's a CSV or raw string...")
            print(f"📄 Raw Data: {response.text[:200]}")
            # If it's just raw text, we wrap it so the generator doesn't crash
            data = {"raw_output": response.text}

        with open("data/feeds/lc17_data.json", "w") as f:
            json.dump(data, f)
            
        print("✅ SUCCESS: Data captured to data/feeds/lc17_data.json")
        
    except Exception as e:
        print(f"❌ LC-17 CONNECTION FAILED: {e}")
        sys.exit(1)

if __name__ == "__main__":
    fetch_lc17_feeds()
