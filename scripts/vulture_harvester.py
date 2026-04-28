import requests, json, os

API_KEY = os.getenv("LC_API_KEY")
# Testing with IDs that usually have massive, open datafeeds
MERCHANTS = ["154977", "138882", "53532"] 

def harvest():
    print(f"📡 VULTURE: Connecting to LinkConnector...")
    all_data = []
    os.makedirs("data/feeds", exist_ok=True)
    
    for mid in MERCHANTS:
        # We are using getFeedProductSearch but removing 'Limit' to get everything
        url = f"https://www.linkconnector.com/api/?Key={API_KEY}&Function=getFeedProductSearch&MerchantID={mid}&Format=JSON&JSON=1"
        
        try:
            r = requests.get(url, timeout=30)
            print(f"📡 MID {mid} Status: {r.status_code}")
            
            # If the response is empty, it might be an auth issue or feed access issue
            data = r.json()
            if isinstance(data, list) and len(data) > 0:
                all_data.extend(data)
                print(f"✅ MID {mid}: Captured {len(data)} items.")
            else:
                print(f"⚠️ MID {mid}: Feed returned 0 items. Check Datafeed Approval in LC.")
                
        except Exception as e:
            print(f"❌ MID {mid} Error: {e}")
        
    with open("data/feeds/lc17_products.json", "w") as f:
        json.dump(all_data, f)
    
    print(f"🔥 TOTAL PRODUCTS: {len(all_data)}")

if __name__ == "__main__":
    harvest()
