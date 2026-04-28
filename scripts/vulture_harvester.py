import requests
import json
import os
import sys

API_KEY = os.getenv("LC_API_KEY")

def fetch_data():
    print("🚀 VULTURE: Harvesting Data...")
    os.makedirs("data/feeds", exist_ok=True)
    
    # Attempt LC-17 API Call
    if API_KEY:
        url = "https://www.linkconnector.com/api/"
        params = {'Key': API_KEY, 'Function': 'getFeedProductSearch', 'Format': 'JSON', 'JSON': '1'}
        try:
            response = requests.get(url, params=params, timeout=30)
            if response.status_code == 200 and "<!DOCTYPE html>" not in response.text:
                with open("data/feeds/lc17_api_data.json", "w") as f:
                    json.dump(response.json(), f)
                print("✅ LC-17 API Data Captured.")
        except:
            print("⚠️ API failed or empty. Moving to local feeds.")

    # Create a local seed file if no feeds exist yet
    seed_path = "data/feeds/manual_seed.json"
    if not os.path.exists(seed_path):
        seed_data = [
            {"ProductName": "E-File Tax Prep Pro", "Merchant": "E-File.com"},
            {"ProductName": "StadiumStay London Hub", "Merchant": "StadiumStay"},
            {"ProductName": "Skyscanner Flight Finder", "Merchant": "SkyscannerHub"}
        ]
        with open(seed_path, "w") as f:
            json.dump(seed_data, f)
        print("📝 Local seed data created.")

if __name__ == "__main__":
    fetch_data()
