import requests
import json
import os

API_KEY = os.getenv("LC_API_KEY")

def fetch_verified_feeds():
    print("🦅 VULTURE: Targeting Verified Merchant IDs (Capped at 2k/ea)...")
    os.makedirs("data/feeds", exist_ok=True)
    feed_path = "data/feeds/lc17_products.json"
    
    # IDs confirmed from your LC Dashboard screenshot
    merchant_ids = [
        "138882", "70695", "151214", "152912", "53532", 
        "100273", "139297", "88473", "25028", "167189", 
        "1641", "153105", "158029", "159685", "110813", 
        "154977", "18340"
    ]
    
    all_products = []
    url = "https://www.linkconnector.com/api/"

    for mid in merchant_ids:
        print(f"📡 Pulling Merchant: {mid}")
        params = {
            'Key': API_KEY,
            'Function': 'getFeedProductSearch',
            'MerchantID': mid,
            'Format': 'JSON',
            'JSON': '1',
            'Limit': '2000'  # Prevents GitHub deployment failure
        }
        
        try:
            response = requests.get(url, params=params, timeout=45)
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                all_products.extend(data)
                print(f"   ✅ Captured {len(data)} items.")
            else:
                print(f"   ⚠️ No data for {mid}.")
        except Exception as e:
            print(f"   ❌ Error on {mid}: {e}")

    if all_products:
        with open(feed_path, "w") as f:
            json.dump(all_products, f)
        print(f"🔥 TOTAL PRODUCTS CACHED: {len(all_products)}")
    else:
        print("🛑 CRITICAL: All API attempts returned 0 products.")

if __name__ == "__main__":
    fetch_verified_feeds()
