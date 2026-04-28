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
        # Verify we got a real JSON list and not an error/HTML page
        if response.status_code == 200 and response.text.startswith('['):
            data = response.json()
            # Filter to ensure we only save if data exists
            if len(data) > 0:
                with open("data/feeds/lc17_products.json", "w") as f:
                    json.dump(data, f)
                print(f"✅ SUCCESS: Captured {len(data)} LC-17 Products.")
            else:
                print("⚠️ API Connection Good, but 0 products returned for these 17 merchants.")
        else:
            print("❌ LC API Error: Invalid response format.")
    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    fetch_lc17_only()
