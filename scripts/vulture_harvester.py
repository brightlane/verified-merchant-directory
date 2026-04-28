import requests
import json
import os

# --- CONFIG ---
API_KEY = os.getenv("LC_API_KEY")
FEED_DIR = "data/feeds"
CONFIG_FILE = "affiliate.json"

def fetch_feeds():
    if not os.path.exists(FEED_DIR):
        os.makedirs(FEED_DIR)

    with open(CONFIG_FILE, 'r') as f:
        config = json.load(f)
    
    merchants = config.get('campaigns', {})
    total_count = 0

    for m_id, meta in merchants.items():
        print(f"📦 Harvesting: {meta['name']} (ID: {m_id})...")
        
        # LinkConnector Product Feed URL Pattern
        # Note: Ensure your specific feed URL matches your account's regional endpoint
        url = f"https://api.linkconnector.com/v1/feeds/products?api_key={API_KEY}&merchant_id={m_id}&format=json"
        
        try:
            response = requests.get(url, timeout=30)
            
            # Check if the response is actually JSON
            if response.status_code == 200:
                try:
                    data = response.json()
                    with open(f"{FEED_DIR}/{m_id}.json", "w") as f:
                        json.dump(data, f)
                    
                    count = len(data) if isinstance(data, list) else 0
                    print(f"✅ Success: {count} products found.")
                    total_count += count
                except json.JSONDecodeError:
                    print(f"❌ Error: API returned non-JSON response for ID {m_id}. (Possible 404 or Unauthorized)")
            else:
                print(f"❌ Error: Received Status Code {response.status_code}")
                
        except Exception as e:
            print(f"❌ Connection Error: {str(e)}")

    print(f"\n🔥 FINISHED. Total Products Harvested: {total_count}")

if __name__ == "__main__":
    fetch_feeds()
