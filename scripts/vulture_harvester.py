import requests
import json
import os

API_KEY = os.getenv("LC_API_KEY")

def fetch_aggressive_products():
    print("🦅 VULTURE: Aggressive Product Harvest Initialized...")
    os.makedirs("data/feeds", exist_ok=True)
    feed_path = "data/feeds/lc17_products.json"
    
    # We are broadening the search parameters to 'grab everything' 
    # rather than filtering by a specific search term.
    url = "https://www.linkconnector.com/api/"
    params = {
        'Key': API_KEY,
        'Function': 'getFeedProductSearch',
        'Format': 'JSON',
        'JSON': '1',
        'Category': '0', # 0 often acts as a wildcard for 'All Categories'
        'Limit': '10000' # Setting the target high
    }
    
    try:
        response = requests.get(url, params=params, timeout=90)
        
        # Parse the response carefully
        raw_data = response.json()
        
        # LinkConnector API quirk: Sometimes the data is nested under a 'results' key
        products = []
        if isinstance(raw_data, list):
            products = raw_data
        elif isinstance(raw_data, dict):
            products = raw_data.get('results', [])

        if len(products) > 0:
            with open(feed_path, "w") as f:
                json.dump(products, f)
            print(f"🔥 SUCCESS: Found {len(products)} products! Pushing to Generator...")
        else:
            print("⚠️ API returned 0 products. EMERGENCY: Check 'Tools > Product Feed Export' in LC Dashboard.")
            # We don't write an empty file here to protect the sitemap
            
    except Exception as e:
        print(f"❌ API Failure: {e}")

if __name__ == "__main__":
    fetch_aggressive_products()
