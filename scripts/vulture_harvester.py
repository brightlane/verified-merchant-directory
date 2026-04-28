import requests
import json
import os
import time

# --- CONFIGURATION ---
API_KEY = "621835730ae935d10dc9bf41380d1f54"
BASE_URL = "https://www.linkconnector.com/api/"
FEED_DIR = "data/feeds"

if not os.path.exists(FEED_DIR):
    os.makedirs(FEED_DIR, exist_ok=True)

def get_manual_merchants():
    # These are your 17 LinkConnector Approved Campaigns
    return [
        {"ID": "70695", "Name": "Build A Sign LLC"},
        {"ID": "100273", "Name": "E-File.com"},
        {"ID": "88473", "Name": "HalloweenCostumes.com"},
        {"ID": "83445", "Name": "Fun.com"},
        {"ID": "53532", "Name": "Depositphotos Inc."},
        {"ID": "40232", "Name": "CanadaPetCare.com"},
        {"ID": "61443", "Name": "Hats.com LLC"},
        {"ID": "33215", "Name": "The Chess Store, Inc."},
        {"ID": "49002", "Name": "Easy Canvas Prints"},
        {"ID": "22105", "Name": "Atlanta Cutlery Corp."},
        {"ID": "99332", "Name": "Combat Flip Flops"},
        {"ID": "12234", "Name": "La Fuente Imports"},
        {"ID": "77654", "Name": "Nordvpn S.A."},
        {"ID": "44321", "Name": "Sidify Inc."},
        {"ID": "55678", "Name": "Movavi Software Limited"},
        {"ID": "11223", "Name": "Products On The Go LLC"},
        {"ID": "99887", "Name": "InfiniteAloe"}
    ]

def harvest_merchant_feed(m_id, m_name):
    print(f"📦 Harvesting: {m_name}...")
    url = f"{BASE_URL}getFeedProductSearch.php?Key={API_KEY}&MerchantID={m_id}&Format=JSON&Records=500"
    
    try:
        response = requests.get(url, timeout=15)
        # Check if the response is actually JSON
        if response.status_code == 200 and "[" in response.text:
            data = response.json()
            with open(f"{FEED_DIR}/{m_id}.json", 'w') as f:
                json.dump(data, f, indent=4)
            print(f"   ✅ Saved {len(data)} products.")
            return len(data)
        else:
            print(f"   ⚠️ API returned non-JSON for {m_name}. Skipping...")
            return 0
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return 0

def run_network_harvest():
    merchants = get_manual_merchants()
    total = 0
    for m in merchants:
        total += harvest_merchant_feed(m['ID'], m['Name'])
        time.sleep(2) # Be extra nice to the API

    print(f"\n🔥 FINISHED. Total Products: {total}")

if __name__ == "__main__":
    run_network_harvest()
