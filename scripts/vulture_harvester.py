import requests, json, os

API_KEY = os.getenv("LC_API_KEY")
# Testing with only the most reliable IDs first to confirm the connection
MERCHANTS = ["53532", "18340", "138882"] 

def harvest():
    print(f"📡 API CHECK: Using Key prefix {API_KEY[:5]}...")
    all_data = []
    os.makedirs("data/feeds", exist_ok=True)
    
    for mid in MERCHANTS:
        # LinkConnector sometimes requires specific search types
        url = f"https://www.linkconnector.com/api/?Key={API_KEY}&Function=getFeedProductSearch&MerchantID={mid}&Format=JSON&JSON=1"
        
        try:
            r = requests.get(url, timeout=30)
            print(f"📡 MID {mid} Status: {r.status_code}")
            
            # Check if the response is actually JSON or an error message
            try:
                data = r.json()
            except:
                print(f"❌ MID {mid} returned non-JSON: {r.text[:100]}")
                continue

            if isinstance(data, list) and len(data) > 0:
                all_data.extend(data)
                print(f"✅ MID {mid}: Found {len(data)} items.")
            else:
                print(f"⚠️ MID {mid}: No products found in feed.")
                
        except Exception as e:
            print(f"❌ MID {mid} Connection Error: {e}")
        
    with open("data/feeds/lc17_products.json", "w") as f:
        json.dump(all_data, f)
    
    print(f"🔥 HARVEST COMPLETE: {len(all_data)} TOTAL PRODUCTS.")

if __name__ == "__main__":
    harvest()
