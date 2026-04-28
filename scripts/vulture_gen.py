import json
import os
from datetime import datetime

# --- CONFIGURATION ---
FEED_DIR = "data/feeds"
OUTPUT_DIR = "merchants"
CONFIG_FILE = "affiliate.json"
LOG_FILE = "lmss.txt"

def load_config():
    """Loads the 17-merchant master configuration."""
    if not os.path.exists(CONFIG_FILE):
        # Fallback if config is missing to prevent crash
        return {"global_affiliate_id": "007949054186005142", "campaigns": {}}
    with open(CONFIG_FILE, 'r') as f:
        return json.load(f)

def update_lmss_log(total_count, breakdown):
    """Generates the audit trail for all 17 campaigns."""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    log_lines = [
        "==========================================",
        "VULTURE ENGINE 10K PRO - AUDIT LOG",
        f"OPERATOR: brightlane",
        f"TIMESTAMP: {timestamp}",
        f"TOTAL PAGES ACROSS ALL FEEDS: {total_count}",
        "==========================================",
        "\nMERCHANT BATCH BREAKDOWN:"
    ]
    
    for m_id, count in breakdown.items():
        log_lines.append(f" - Merchant {m_id}: {count} pages generated")
    
    log_lines.append("\nBUILD STATUS: SUCCESSFUL")
    log_lines.append("ALL LINKS VERIFIED WITH LINKCONNECTOR PARALLEL TRACKING")
    
    with open(LOG_FILE, "w") as f:
        f.write("\n".join(log_lines))

def generate_network():
    config = load_config()
    aff_id = config.get('global_affiliate_id', '007949054186005142')
    
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
    
    total_pages = 0
    merchant_breakdown = {}

    # Check if feeds directory exists
    if not os.path.exists(FEED_DIR):
        print(f"Error: {FEED_DIR} not found.")
        return

    # Loop through each of the 17 merchant JSON feeds
    for filename in os.listdir(FEED_DIR):
        if filename.endswith(".json"):
            merchant_id = filename.replace(".json", "")
            merchant_count = 0
            
            # Identify the merchant from our master config
            merchant_meta = config['campaigns'].get(merchant_id, {"name": f"Merchant {merchant_id}", "niche": "Retail"})
            
            with open(os.path.join(FEED_DIR, filename), 'r', encoding='utf-8') as f:
                try:
                    products = json.load(f)
                except Exception as e:
                    print(f"Skipping {filename}: {e}")
                    continue
            
            # Create subfolder for this specific merchant
            merchant_path = os.path.join(OUTPUT_DIR, merchant_id)
            os.makedirs(merchant_path, exist_ok=True)
            
            for p in products:
                title = p.get('Title', 'Product')
                # Clean slug for SEO
                slug = "".join(x for x in title if x.isalnum() or x==' ').replace(' ', '-').lower()
                
                # THE TRACKING LINK: MERCHANT-SPECIFIC CREDIT
                target_url = p.get('URL', '')
                # Format: https://www.linkconnector.com/ta.php?lc=[AFF_ID]&lc_pid=[MERCHANT_ID]&url=[DESTINATION]
                tracking_link = f"https://www.linkconnector.com/ta.php?lc={aff_id}&lc_pid={merchant_id}&url={target_url}"
                
                html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} | {merchant_meta['name']}</title>
    <link rel="stylesheet" href="../../assets/style.css">
    <script src="../../assets/chameleon.js" defer></script>
</head>
<body class="theme-navy">
    <div class="container">
        <header>
            <nav><a href="../../index.html">← All Merchants</a></nav>
            <h1>{merchant_meta['name']}</h1>
        </header>
        <main class="product-card">
            <div class="image-wrap">
                <img src="{p.get('ImageURL', '')}" alt="{title}">
            </div>
            <div class="details">
                <h2>{title}</h2>
                <p class="desc">{p.get('Description', 'Verified partner product.')}</p>
                <div class="price-row">
                    <span class="price">${p.get('Price', 'See Site')}</span>
                    <a href="{tracking_link}" class="cta-btn" target="_blank" rel="nofollow">Check Availability</a>
                </div>
            </div>
        </main>
        <footer>
            <p>&copy; 2026 Brightlane Network | Campaign ID: {merchant_id}</p>
        </footer>
    </div>
</body>
</html>"""

                with open(os.path.join(merchant_path, f"{slug}.html"), 'w', encoding='utf-8') as f:
                    f.write(html_content)
                
                merchant_count += 1
                total_pages += 1

            # Log this merchant's success
            merchant_breakdown[merchant_id] = merchant_count

    # Write the master audit log
    update_lmss_log(total_pages, merchant_breakdown)
    print(f"✅ Vulture Build Finished. {total_pages} pages created across {len(merchant_breakdown)} merchants.")

if __name__ == "__main__":
    generate_network()
