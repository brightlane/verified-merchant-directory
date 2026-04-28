import json
import os
from datetime import datetime

# --- CONFIG ---
FEED_DIR = "data/feeds"
MERCHANT_DIR = "merchants"
INDEX_FILE = "index.html"
SITEMAP_FILE = "sitemap.xml"
LOG_FILE = "lmss.txt"
BASE_URL = "https://brightlane.github.io/verified-merchant-directory/"

def update_lmss_log(total_count, breakdown):
    """Generates the Audit Report"""
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
    
    for m_id in sorted(breakdown.keys()):
        count = breakdown.get(m_id, 0)
        indicator = "✅" if count > 0 else "❌"
        log_content.append(f"ID {m_id}: {count} Pages | {indicator}")

    log_content.extend([
        "------------------------------------------",
        "BUILD STATUS: LOGGED",
        "=========================================="
    ])
    
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(log_content))

def generate_vulture_empire():
    print("🚀 VULTURE 10K ENGINE: INITIATING...")
    
    if not os.path.exists(MERCHANT_DIR):
        os.makedirs(MERCHANT_DIR)

    generated_paths = []
    merchant_breakdown = {}

    # Process JSON feeds from the harvester
    if os.path.exists(FEED_DIR):
        feeds = [f for f in os.listdir(FEED_DIR) if f.endswith('.json')]
        for feed in feeds:
            m_id = feed.replace('.json', '')
            m_path = os.path.join(MERCHANT_DIR, m_id)
            if not os.path.exists(m_path): os.makedirs(m_path)
            
            try:
                with open(os.path.join(FEED_DIR, feed), 'r') as f:
                    products = json.load(f)
                
                for item in products:
                    slug = item.get('name', 'deal').lower().replace(" ", "-")[:50]
                    file_path = f"{m_id}/{slug}.html"
                    with open(os.path.join(MERCHANT_DIR, file_path), "w") as p:
                        p.write(f"<html><body><h1>{item.get('name')}</h1></body></html>")
                    generated_paths.append(f"merchants/{file_path}")
                
                merchant_breakdown[m_id] = len(products)
            except:
                merchant_breakdown[m_id] = 0

    # Build Sitemap
    with open(SITEMAP_FILE, "w") as s:
        s.write('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
        for path in generated_paths:
            s.write(f'<url><loc>{BASE_URL}{path}</loc></url>')
        s.write('</urlset>')

    # Build Index
    with open(INDEX_FILE, "w") as f:
        f.write(f"<html><body style='background:#020617;color:white;'><h1>{len(generated_paths)} Links Active</h1></body></html>")

    # CRITICAL: THIS RUNS THE LOG FUNCTION
    update_lmss_log(len(generated_paths), merchant_breakdown)

if __name__ == "__main__":
    generate_vulture_empire()
