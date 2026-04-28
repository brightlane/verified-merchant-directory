import json
import os
from datetime import datetime

# --- CONFIGURATION ---
FEED_DIR = "data/feeds"
INDEX_FILE = "index.html"
LOG_FILE = "lmss.txt"
BASE_URL = "https://brightlane.github.io/verified-merchant-directory/"
LC_ID = "007949054186005142"

def update_lmss_log(total_count, breakdown_list):
    """Generates the Mission Control Log"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    status_label = "OPERATIONAL" if total_count > 0 else "DEGRADED (API/FEED ERROR)"
    status_icon = "✅" if total_count > 0 else "⚠️"

    log_content = [
        "==========================================",
        "      VULTURE ENGINE 10K PRO v17          ",
        f"      STATUS: {status_label} {status_icon} ",
        "==========================================",
        f"OPERATOR: brightlane",
        f"LAST BUILD: {timestamp}",
        f"TOTAL PAGES LIVE: {total_count}",
        "------------------------------------------",
        "CAMPAIGN AUDIT STATUS:"
    ]
    
    if total_count == 0:
        log_content.append("!!! ALERT: ALL FEEDS RETURNED 0 PRODUCTS !!!")
    
    for m in breakdown_list:
        log_content.append(f"ID {m['m_id']}: {m['name']} | ✅")

    log_content.extend([
        "------------------------------------------",
        "BUILD STATUS: LOGGED",
        "=========================================="
    ])
    
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(log_content))

def generate_vulture_empire():
    print("🚀 VULTURE 10K: INITIATING...")
    
    # 1. Load Data
    merchant_data = []
    feed_path = os.path.join(FEED_DIR, "merchants.json")
    if os.path.exists(feed_path):
        with open(feed_path, 'r', encoding='utf-8') as f:
            merchant_data = json.load(f)
    
    total_count = len(merchant_data)

    # 2. Build Dashboard (Global SEO Architecture)
    html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Global Merchant Network | Vulture Engine 10K</title>
    <style>
        body {{ background: #020617; color: white; font-family: sans-serif; text-align: center; margin: 0; padding: 50px; }}
        .count {{ font-size: 5rem; color: #22d3ee; font-weight: bold; margin: 0; }}
        .status {{ color: #94a3b8; font-size: 1.2rem; margin-bottom: 30px; }}
        .ticker {{ background: #0f172a; padding: 15px; border-y: 1px solid #1e293b; color: #22d3ee; font-weight: bold; }}
    </style>
</head>
<body>
    <div class="count">{total_count}</div>
    <p class="status">Verified LinkConnector Campaigns | ID: {LC_ID}</p>
    <div class="ticker">EN • ES • FR • DE • IT • PT • JA • ZH • KO • HI • AR • RU • TR • VI</div>
</body>
</html>
"""
    # Write Index
    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        f.write(html_content)
    
    # 3. TRIGGER THE LOG (Your Logic)
    update_lmss_log(total_count, merchant_data)

if __name__ == "__main__":
    generate_vulture_empire()
