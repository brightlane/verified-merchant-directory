import json
import os
from datetime import datetime

# --- CONFIGURATION ---
FEED_DIR = "data/feeds"
OUTPUT_DIR = "merchants"
CONFIG_FILE = "affiliate.json"

def load_config():
    with open(CONFIG_FILE, 'r') as f:
        return json.load(f)

def update_lmss_log(total_count):
    log_content = f"""ENGINE: Vulture 10K Pro
OPERATOR: brightlane
CAMPAIGNS: 17 Merchant Active
LAST_BUILD: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
TOTAL_PAGES: {total_count}
STATUS: OPERATIONAL
"""
    with open("lmss.txt", "w") as f:
        f.write(log_content)

def generate_network():
    config = load_config()
    aff_id = config['global_affiliate_id']
    base_url = config['base_tracking_url']
    
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
    
    total_pages = 0

    # Loop through each merchant's JSON feed
    for filename in os.listdir(FEED_DIR):
        if filename.endswith(".json"):
            merchant_id = filename.replace(".json", "")
            
            # Check if this merchant is in our verified 17-list
            merchant_meta = config['campaigns'].get(merchant_id, {"name": "Verified Merchant"})
            
            with open(os.path.join(FEED_DIR, filename), 'r', encoding='utf-8') as f:
                try:
                    products = json.load(f)
                except: continue
            
            merchant_path = os.path.join(OUTPUT_DIR, merchant_id)
            os.makedirs(merchant_path, exist_ok=True)
            
            for p in products:
                title = p.get('Title', 'Product')
                # Create SEO-friendly filename
                slug = "".join(x for x in title if x.isalnum() or x==' ').replace(' ', '-').lower()
                
                # THE TRACKING LINK: Specific to THIS Merchant's Campaign
                target = p.get('URL', '')
                final_link = f"{base_url}?lc={aff_id}&lc_pid={merchant_id}&url={target}"
                
                html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{title} | {merchant_meta['name']}</title>
    <link rel="stylesheet" href="../../assets/style.css">
    <script src="../../assets/chameleon.js" defer></script>
</head>
<body>
    <div class="container">
        <header><h2>{merchant_meta['name']}</h2></header>
        <main class="card">
            <img src="{p.get('ImageURL', '')}" alt="{title}" style="max-width:300px;">
            <h1>{title}</h1>
            <p>{p.get('Description', 'Quality selection.')}</p>
            <div class="price">${p.get('Price', 'Check Site')}</div>
            <a href="{final_link}" class="cta-btn" target="_blank" rel="nofollow">Buy Now</a>
        </main>
        <footer><p>&copy; 2026 Brightlane Network</p></footer>
    </div>
</body>
</html>"""

                with open(os.path.join(merchant_path, f"{slug}.html"), 'w', encoding='utf-8') as f:
                    f.write(html_content)
                total_pages += 1

    update_lmss_log(total_pages)
    print(f"✅ Build Complete: {total_pages} pages created for 17 campaigns.")

if __name__ == "__main__":
    generate_network()
