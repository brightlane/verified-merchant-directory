import json
import os
from datetime import datetime

# --- CONFIG ---
FEED_DIR = "data/feeds"
MERCHANT_DIR = "merchants"
INDEX_FILE = "index.html"
BASE_URL = "https://brightlane.github.io/verified-merchant-directory/"
LC_ID = "007949054186005142"

def generate_vulture_empire():
    # 1. Load Data
    merchant_data = []
    feed_path = os.path.join(FEED_DIR, "merchants.json")
    if os.path.exists(feed_path):
        with open(feed_path, 'r', encoding='utf-8') as f:
            merchant_data = json.load(f)

    if not os.path.exists(MERCHANT_DIR):
        os.makedirs(MERCHANT_DIR)

    generated_count = 0
    
    # 2. THE PSEO ENGINE (Scale-Up Loop)
    for merchant in merchant_data:
        m_id = str(merchant['m_id'])
        m_name = merchant['name']
        m_folder = os.path.join(MERCHANT_DIR, m_id)
        
        if not os.path.exists(m_folder):
            os.makedirs(m_folder)
        
        # Create a "Main" review page for each merchant
        review_page = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>{m_name} Review 2026 | Verified LinkConnector Merchant</title>
            <style>body{{background:#020617;color:white;font-family:sans-serif;padding:50px;}}</style>
        </head>
        <body>
            <h1>{m_name} Official Portal</h1>
            <p>Verified status for LinkConnector ID: {LC_ID}</p>
            <a href="https://www.linkconnector.com/ta.php?lc={LC_ID}&m={m_id}" 
               style="color:#22d3ee; font-weight:bold;">Access Official Site →</a>
        </body>
        </html>
        """
        with open(os.path.join(m_folder, "index.html"), "w", encoding="utf-8") as f:
            f.write(review_page)
        generated_count += 1

    # 3. UPDATE THE MAIN DASHBOARD
    dashboard_html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Vulture Network | {generated_count} Portals Live</title>
        <style>
            body {{ background: #020617; color: white; text-align: center; font-family: sans-serif; }}
            .hero {{ padding: 100px 20px; }}
            .count {{ font-size: 8rem; color: #22d3ee; font-weight: bold; }}
        </style>
    </head>
    <body>
        <div class="hero">
            <div class="count">{generated_count}</div>
            <h1>Verified Merchant Portals Active</h1>
            <p>Tracking ID Locked: {LC_ID}</p>
            <div style="margin-top:50px;">
                {" ".join([f'<a href="merchants/{m["m_id"]}/index.html" style="color:#22d3ee;margin:10px;display:inline-block;">{m["name"]}</a>' for m in merchant_data])}
            </div>
        </div>
    </body>
    </html>
    """
    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        f.write(dashboard_html)

if __name__ == "__main__":
    generate_vulture_empire()
