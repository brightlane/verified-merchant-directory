import json
import os
from datetime import datetime

# --- CONFIGURATION ---
FEED_DIR = "data/feeds"
MERCHANT_DIR = "merchants"
INDEX_FILE = "index.html"
SITEMAP_FILE = "sitemap.xml"
LOG_FILE = "lmss.txt"
BASE_URL = "https://brightlane.github.io/verified-merchant-directory/"

def update_lmss_log(total_count, breakdown):
    """Writes the Vulture Engine Audit Report to lmss.txt"""
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
        count = breakdown[m_id]
        indicator = "✅" if count > 0 else "❌"
        log_content.append(f"ID {m_id}: {count} Pages | {indicator}")

    log_content.extend([
        "------------------------------------------",
        "BUILD STATUS: LOGGED",
        "=========================================="
    ])
    
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(log_content))
    print(f"📄 Audit Log Updated: {LOG_FILE}")

def generate_vulture_empire():
    print("🚀 VULTURE 10K ENGINE: STARTING BUILD...")
    
    if not os.path.exists(MERCHANT_DIR):
        os.makedirs(MERCHANT_DIR)

    generated_paths = []
    merchant_breakdown = {}

    # 1. Process Feeds & Generate Product Pages
    if os.path.exists(FEED_DIR):
        feeds = [f for f in os.listdir(FEED_DIR) if f.endswith('.json')]
        for feed in feeds:
            m_id = feed.replace('.json', '')
            m_path = os.path.join(MERCHANT_DIR, m_id)
            if not os.path.exists(m_path):
                os.makedirs(m_path)
            
            try:
                with open(os.path.join(FEED_DIR, feed), 'r') as f:
                    products = json.load(f)
                
                count_per_merchant = 0
                for item in products:
                    p_name = item.get('name', 'Product')
                    slug = p_name.lower().replace(" ", "-").replace("/", "-")[:50]
                    file_name = f"{slug}.html"
                    
                    # Atomic Product Page Generation
                    with open(os.path.join(m_path, file_name), "w", encoding="utf-8") as p:
                        p.write(f"<html><body><h1>{p_name}</h1><a href='{item.get('buy_link')}'>Deal</a></body></html>")
                    
                    generated_paths.append(f"merchants/{m_id}/{file_name}")
                    count_per_merchant += 1
                
                merchant_breakdown[m_id] = count_per_merchant
            except Exception as e:
                print(f"❌ Error processing {m_id}: {e}")
                merchant_breakdown[m_id] = 0

    # 2. Build the Main Dashboard (index.html)
    # Using your professional navy/cyan theme logic
    index_html = f"<!DOCTYPE html><html><body style='background:#020617;color:white;'><h1>Merchant Network</h1><p>{len(generated_paths)} Links Active</p></body></html>"
    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        f.write(index_html)

    # 3. Build the Sitemap (sitemap.xml)
    sitemap_content = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    sitemap_content += f'<url><loc>{BASE_URL}</loc></url>'
    for path in generated_paths:
        sitemap_content += f'<url><loc>{BASE_URL}{path}</loc></url>'
    sitemap_content += '</urlset>'
    with open(SITEMAP_FILE, "w", encoding="utf-8") as f:
        f.write(sitemap_content)

    # 4. TRIGGER THE LOG (This is what you were missing!)
    update_lmss_log(len(generated_paths), merchant_breakdown)

if __name__ == "__main__":
    generate_vulture_empire()
