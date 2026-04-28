import requests, json, os

API_KEY = os.getenv("LC_API_KEY")
# Using a smaller, targeted list of your top merchants first to ensure a win
MERCHANTS = ["53532", "139297", "88473", "154977", "110813", "18340"]

def harvest():
    print("🦅 VULTURE: Starting Deep Harvest...")
    all_data = []
    os.makedirs("data/feeds", exist_ok=True)
    
    for mid in MERCHANTS:
        # We removed 'Limit' to let the API default to its own max
        url = f"https://www.linkconnector.com/api/?Key={API_KEY}&Function=getFeedProductSearch&MerchantID={mid}&Format=JSON&JSON=1"
        try:
            r = requests.get(url, timeout=40)
            data = r.json()
            if isinstance(data, list) and len(data) > 0:
                all_data.extend(data)
                print(f"✅ Merchant {mid}: Found {len(data)} items.")
            else:
                print(f"⚠️ Merchant {mid}: Returned empty.")
        except Exception as e:
            print(f"❌ Merchant {mid}: API Error: {e}")
        
    with open("data/feeds/lc17_products.json", "w") as f:
        json.dump(all_data, f)
    print(f"🔥 FINAL TOTAL: {len(all_data)} products.")

if __name__ == "__main__": harvest()
