import requests, json, os

API_KEY = os.getenv("LC_API_KEY")
MERCHANTS = ["138882", "70695", "151214", "152912", "53532", "100273", "139297", "88473", "25028", "167189", "1641", "153105", "158029", "159685", "110813", "154977", "18340"]

def harvest():
    all_data = []
    # Force a local directory for the feed
    os.makedirs("data/feeds", exist_ok=True)
    
    for mid in MERCHANTS:
        url = f"https://www.linkconnector.com/api/?Key={API_KEY}&Function=getFeedProductSearch&MerchantID={mid}&Format=JSON&JSON=1&Limit=2000"
        try:
            r = requests.get(url, timeout=30)
            data = r.json()
            if isinstance(data, list):
                all_data.extend(data)
        except: continue
        
    with open("data/feeds/lc17_products.json", "w") as f:
        json.dump(all_data, f)
    print(f"Captured {len(all_data)} items.")

if __name__ == "__main__": harvest()
