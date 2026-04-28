import requests
import json
import os

API_KEY = os.getenv("LC_API_KEY")

def fetch_verified_feeds():
    print("🦅 VULTURE: Targeting Verified Merchant IDs...")
    os.makedirs("data/feeds", exist_ok=True)
    
    # IDs pulled directly from your dashboard screenshot
    merchant_ids = [
        "138882", "70695", "151214", "152912", "53532", 
        "100273", "139297", "88473", "25028", "167189", 
        "1641", "153105", "158029", "159685", "110813", 
        "154977", "18340"
    ]
    
    all_products = []
    url = "https://www.linkconnector.com/api/"

    # We loop through each ID to ensure we grab every catalog
    for mid in merchant_ids:
        print(f"📡 Requesting Feed for Merchant: {mid}")
        params = {
            'Key': API_KEY,
            'Function': 'getFeedProductSearch',
            'MerchantID': mid, # This forces the API to look at THIS specific store
            'Format': 'JSON',
            'JSON': '1'
        }
        
        try:
            response = requests.get(url, params=params, timeout=30)
            data = response.json()
            if isinstance(data, list):
                all_products.extend(data)
                print(f"   ✅ Found {len(data)} items.")
        except Exception as e:
            print(f"   ❌ Skip {mid}: {e}")

    if all_products:
        with open("data/feeds/lc17_products.json", "w") as f:
            json.dump(all_products, f)
        print(f"🔥 TOTAL PRODUCTS CAPTURED: {len(all_products)}")
    else:
        print("⚠️ No products returned. Check if API Key has 'Product Feed' permissions.")

if __name__ == "__main__":
    fetch_verified_feeds()
