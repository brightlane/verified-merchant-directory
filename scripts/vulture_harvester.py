import requests
import json
import os
import sys

API_KEY = os.getenv("LC_API_KEY")

def fetch_lc17_only():
    print("🚀 VULTURE: Harvesting Official LinkConnector 17...")
    if not API_KEY:
        print("❌ CRITICAL: LC_API_KEY is missing!")
        sys.exit(1)

    os.makedirs("data/feeds", exist_ok=True)
    url = "https://www.linkconnector.com/api/"
    
    params = {
        'Key': API_KEY,
        'Function': 'getFeedProductSearch',
        'Format': 'JSON',
        'JSON': '1'
    }
    
    try:
        response = requests.get(url, params=params, timeout=60)
        # LinkConnector sometimes wraps JSON in a way that looks like a string. 
        # We need to ensure we have a list.
        try:
            data = response.json()
        except:
            print("⚠️ Direct JSON failed, attempting to parse text...")
            data = json.loads(response.text)

        if isinstance(data, list) and len(data) > 0:
            with open("data/feeds/lc17_products.json", "w") as f:
                json.dump(data, f)
            print(f"✅ SUCCESS: Captured {len(data)} LC-17 Products.")
        else:
            print("⚠️ API returned 0 results. Check LC dashboard subscriptions.")
            # Keep an empty list to prevent the Generator from crashing
            with open("data/feeds/lc17_products.json", "w") as f:
                json.dump([], f)
    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    fetch_lc17_only()
