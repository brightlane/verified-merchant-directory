import requests
import json
import os
import time

# --- CONFIGURATION ---
API_KEY = "621835730ae935d10dc9bf41380d1f54"
MY_LC_ID = "007949054186005142"
BASE_URL = "https://www.linkconnector.com/api/"

# Directory for storage
FEED_DIR = "data/feeds"
if not os.path.exists(FEED_DIR):
    os.makedirs(FEED_DIR)

def get_approved_merchants():
    print("🔍 Fetching your 17 approved merchants...")
    url = f"{BASE_URL}getCampaignApproved.php?Key={API_KEY}&Format=JSON"
    response = requests.get(url)
    return response.json()

def harvest_merchant_feed(merchant_id, merchant_name):
    print(f"📦 Harvesting Feed for: {merchant_name} (ID: {merchant_id})")
    
    # We use the Product Feed Search function
    url = f"{BASE_URL}getFeedProductSearch.php"
    params = {
        "Key": API_KEY,
        "MerchantID": merchant_id,
        "Format": "JSON",
        "Records": 1000 # Batch size
    }
    
    try:
        response = requests.get(url, params=params)
        products = response.json()
        
        # Save individual merchant file
        filename = f"{FEED_DIR}/{merchant_id}.json"
        with open(filename, 'w') as f:
            json.dump(products, f, indent=4)
        
        print(f"   ✅ Saved {len(products)} products to {filename}")
        return len(products)
    except Exception as e:
        print(f"   ⚠️ Error harvesting {merchant_name}: {e}")
        return 0

def run_network_harvest():
    merchants = get_approved_merchants()
    total_products = 0
    
    for m in merchants:
        # Extract ID and Name
        m_id = m.get('MerchantID')
        m_name = m.get('Merchant')
        
        if m_id:
            count = harvest_merchant_feed(m_id, m_name)
            total_products += count
            time.sleep(1) # Delay to respect API limits

    print(f"\n🔥 HARVEST COMPLETE!")
    print(f"Total Products Ingested: {total_products}")
    print(f"Merchant Files stored in: {FEED_DIR}")

if __name__ == "__main__":
    run_network_harvest()
