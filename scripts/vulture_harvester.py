import requests
import json
import os
import time

# --- CONFIGURATION ---
API_KEY = "621835730ae935d10dc9bf41380d1f54"
MY_LC_ID = "007949054186005142"
# Updated API Endpoint for 2026 compatibility
BASE_URL = "https://www.linkconnector.com/api/"

FEED_DIR = "data/feeds"
if not os.path.exists(FEED_DIR):
    os.makedirs(FEED_DIR, exist_ok=True)

def get_approved_merchants():
    print("🔍 Fetching your 17 approved merchants...")
    # Added User-Agent to prevent the API from blocking the GitHub runner
    headers = {'User-Agent': 'VulturePro/1.0'}
    url = f"{BASE_URL}getCampaignApproved.php?Key={API_KEY}&Format=JSON"
    
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200 or not response.text.strip():
        print(f"❌ API Error: Received status {response.status_code}")
        # Return a manual list of your 17 PIDs if the API is being stubborn
        return [
            {"MerchantID": "70695", "Merchant": "Build A Sign"},
            {"MerchantID": "100273", "Merchant": "E-File.com"},
            {"MerchantID": "88473", "Merchant": "HalloweenCostumes.com"},
            {"MerchantID": "53532", "Merchant": "Depositphotos"},
            {"MerchantID": "83445", "Merchant": "Fun.com"}
            # The script will handle these 5 first to test
        ]
    return response.json()

def harvest_merchant_feed(merchant_id, merchant_name):
    print(f"📦 Harvesting Feed for: {merchant_name} (ID: {merchant_id})")
    url = f"{BASE_URL}getFeedProductSearch.php"
    params = {
        "Key": API_KEY,
        "MerchantID": merchant_id,
        "Format": "JSON",
        "Records": 500 # Smaller batch for stability
    }
    
    try:
        response = requests.get(url, params=params)
        if response.status_code == 200 and response.text.strip():
            products = response.json()
            filename = f"{FEED_DIR}/{merchant_id}.json"
            with open(filename, 'w') as f:
                json.dump(products, f, indent=4)
            print(f"   ✅ Saved {len(products)} products.")
            return len(products)
    except Exception as e:
        print(f"   ⚠️ Skip {merchant_name}: {e}")
        return 0

def run_network_harvest():
    merchants = get_approved_merchants()
    total_products = 0
    for m in merchants:
        m_id = m.get('MerchantID')
        m_name = m.get('Merchant')
        if m_id:
            count = harvest_merchant_feed(m_id, m_name)
            total_products += count
            time.sleep(1.5) # Gentler delay

    print(f"\n🔥 HARVEST COMPLETE! Total: {total_products}")

if __name__ == "__main__":
    run_network_harvest()
