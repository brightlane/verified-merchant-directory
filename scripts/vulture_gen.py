import json
import os

FEED_DIR = "data/feeds"
OUTPUT_DIR = "merchants"

def generate_lc17_pages():
    print("🏗️ GENERATOR: Building LC-17 Merchant Nodes...")
    
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    feed_path = os.path.join(FEED_DIR, "lc17_data.json")
    
    if not os.path.exists(feed_path):
        print("⚠️ EMPTY: No LC-17 data found. Generator stopping.")
        return

    with open(feed_path, 'r') as f:
        data = json.load(f)

    # LinkConnector usually returns a list under a 'campaigns' or 'data' key
    # Adjusting for standard LC-17 JSON structure
    campaigns = data.get('campaigns', data) if isinstance(data, dict) else data

    count = 0
    for campaign in campaigns:
        # Get the merchant name and create a clean URL slug
        name = campaign.get('campaign_name', campaign.get('name', 'merchant'))
        cid = campaign.get('campaign_id', count)
        slug = f"{cid}-{name.lower().replace(' ', '-')}"
        
        path = os.path.join(OUTPUT_DIR, f"{slug}.html")
        
        # Creating the static HTML page for each merchant
        with open(path, 'w', encoding='utf-8') as f:
            f.write(f"<html><head><title>{name} - Verified Merchant</title></head>")
            f.write(f"<body><h1>{name}</h1><p>Verified LinkConnector 17 Campaign Node</p></body></html>")
        count += 1
                
    print(f"✅ SUCCESS: Generated {count} Merchant Pages from LC-17.")

if __name__ == "__main__":
    generate_lc17_pages()
