import requests, json, os

API_KEY = os.getenv("LC_API_KEY")

# UPDATE THESE: Put the IDs you just got approved for here
# Example: ["154977", "53532"] 
MERCHANTS = ["154977", "138882", "53532"] 

def harvest():
    print(f"📡 VULTURE: Harvesting Approved Feeds...")
    all_data = []
    os.makedirs("data/feeds", exist_ok=True)
    
    for mid in MERCHANTS:
        # getMerchantFeed is the high-volume function for approved affiliates
        url = f"https://www.linkconnector.com/api/?Key={API_KEY}&Function=getMerchantFeed&MerchantID={mid}&Format=JSON&JSON=1"
        
        try:
            r = requests.get(url, timeout=60) # Increased timeout for large feeds
            print(f"📡 MID {mid} - HTTP {r.status_code}")
            
            # LinkConnector feeds can be massive; we handle the response carefully
            data = r.json()
            
            # Check if it's a direct list or a nested 'products' key
            products = []
            if isinstance(data, list):
                products = data
            elif isinstance(data, dict):
                products = data.get('products', data.get('results', []))

            if products and len(products) > 0:
                all_data.extend(products)
                print(f"✅ MID {mid}: SUCCESS! Captured {len(products)} items.")
            else:
                print(f"⚠️ MID {mid}: Approved but returned 0 items. Check 'Datafeed' tab in LC.")
                
        except Exception as e:
            print(f"❌ MID {mid} API Error: {e}")
        
    with open("data/feeds/lc17_products.json", "w") as f:
        json.dump(all_data, f)
    
    print(f"🔥 TOTAL HARVEST: {len(all_data)} products.")

if __name__ == "__main__":
    harvest()
