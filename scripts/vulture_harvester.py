import requests
import json
import os

API_KEY = os.getenv("LC_API_KEY")

def fetch_lc17_data():
    print("🚀 VULTURE: Harvesting Official LinkConnector 17...")
    os.makedirs("data/feeds", exist_ok=True)
    feed_path = "data/feeds/lc17_products.json"
    
    url = "https://www.linkconnector.com/api/"
    params = {
        'Key': API_KEY,
        'Function': 'getFeedProductSearch',
        'Format': 'JSON',
        'JSON': '1'
    }
    
    try:
        response = requests.get(url, params=params, timeout=60)
        
        # Check if the API actually gave us content
        if response.status_code == 200 and len(response.text) > 10:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                with open(feed_path, "w") as f:
                    json.dump(data, f)
                print(f"✅ SUCCESS: Captured {len(data)} items.")
                return
        
        print("⚠️ API returned no new data. Preserving existing feed file.")
    except Exception as e:
        print(f"❌ Connection Error: {e}. Holding last known data.")

if __name__ == "__main__":
    fetch_lc17_data()
