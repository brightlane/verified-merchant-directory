import requests
import json
import os

API_KEY = os.getenv("LC_API_KEY")

def fetch_capped_feeds():
    print("🦅 VULTURE: Harvesting Capped Feeds (Max 2000 per merchant)...")
    os.makedirs("data/feeds", exist_ok=True)
    
    merchant_ids = ["138882", "70695", "151214", "152912", "53532", "100273", "139297", "88473", "25028", "167189", "1641", "153105", "158029", "159685", "110813", "154977", "18340"]
    all_products = []
    url = "https://www.linkconnector.com/api/"

    for mid in merchant_ids:
        params = {
            'Key': API_KEY,
            'Function': 'getFeedProductSearch',
            'MerchantID': mid,
            'Format': 'JSON',
            'JSON': '1',
            'Limit': '2000' # 🔥 CAP: Prevents GitHub Deployment crashes
        }
        try:
            response = requests.get(url, params=params, timeout=30)
            data = response.json()
            if isinstance(data, list):
                all_products.extend(data)
                print(f"✅ {mid}: Added {len(data)} items.")
        except:
            continue

    with open("data/feeds/lc17_products.json", "w") as f:
        json.dump(all_products, f)
    print(f"🔥 TOTAL CAPPED LOAD: {len(all_products)}")

if __name__ == "__main__":
    fetch_capped_feeds()
