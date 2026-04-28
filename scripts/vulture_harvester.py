import requests
import json
import os
import sys

# --- CONFIG ---
API_KEY = os.getenv("LC_API_KEY")
FEED_DIR = "data/feeds"
CONFIG_FILE = "affiliate.json"

def fetch_feeds():
    """
    Intake engine for the 2026 Omni-Protocol.
    Fetches JSON product data for all 17 approved merchants.
    """
    print("🚀 VULTURE HARVESTER STARTING...")
    
    if not API_KEY:
        print("❌ CRITICAL ERROR: LC_API_KEY environment variable is missing!")
        sys.exit(1)

    if not os.path.exists(FEED_DIR):
        os.makedirs(FEED_DIR)

    if not os.path.exists(CONFIG_FILE):
        print(f"❌ ERROR: {CONFIG_FILE} not found. Cannot find merchant IDs.")
        return

    with open(CONFIG_FILE, 'r') as f:
        config = json.load(f)
    
    merchants = config.get('campaigns', {})
    total_count = 0

    for m_id, meta in merchants.items():
        name = meta.get('name', f'Merchant {m_id}')
        print(f"📦 Harvesting: {name} (ID: {m_id})...")
        
        # LinkConnector V1 Endpoint
        url = f"https://api.linkconnector.com/v1/feeds/products?api_key={API_KEY}&merchant_id={m_id}&format=json"
        
        try:
            response = requests.get(url, timeout=30)
            
            if response.status_code == 200:
                try:
                    raw_data = response.json()
                    products = []

                    # LOGIC: Unwrap the JSON if it's nested in a 'products' key
                    if isinstance(raw_data, list):
                        products = raw_data
                    elif isinstance(raw_data, dict):
                        # LinkConnector often wraps results in a key or a 'results' object
                        products = raw_data.get('products', raw_data.get('results', []))
                    
                    # Save the cleaned list
                    with open(f"{FEED_DIR}/{m_id}.json", "w", encoding="utf-8") as f:
                        json.dump(products, f)
                    
                    count = len(products)
                    print(f"   ✅ Success: {count} products found.")
                    total_count += count
                    
                except json.JSONDecodeError:
                    print(f"   ❌ Error: Received HTML instead of JSON. Check if ID {m_id} is approved.")
                    # Debug: print first 100 chars of response
                    print(f"   Snippet: {response.text[:100]}")
            
            elif response.status_code == 401:
                print("   ❌ Error 401: Unauthorized. Your API Key is likely invalid.")
            else:
                print(f"   ❌ Error: Received Status Code {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Connection Error: {str(e)}")

    print(f"\n==========================================")
    print(f"🔥 HARVEST COMPLETE. Total Products: {total_count}")
    print(f"==========================================\n")

if __name__ == "__main__":
    fetch_feeds()
