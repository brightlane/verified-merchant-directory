import os
from datetime import datetime

# CONFIGURATION
BASE_URL = "https://brightlane.github.io/verified-merchant-directory"
MERCHANTS_DIR = "merchants"
SITEMAP_DIR = "sitemaps"

def generate_sitemaps():
    os.makedirs(SITEMAP_DIR, exist_ok=True)
    today = datetime.now().strftime('%Y-%m-%d')
    sitemaps_list = []

    # 1. Generate individual merchant sitemaps
    for merchant_id in os.listdir(MERCHANTS_DIR):
        merchant_path = os.path.join(MERCHANTS_DIR, merchant_id)
        if not os.path.isdir(merchant_path): continue

        sitemap_filename = f"sitemap_{merchant_id}.xml"
        urls = []
        
        for file in os.listdir(merchant_path):
            if file.endswith(".html"):
                url = f"{BASE_URL}/merchants/{merchant_id}/{file}"
                urls.append(f"<url><loc>{url}</loc><lastmod>{today}</lastmod></url>")

        # Write merchant sitemap
        with open(f"{SITEMAP_DIR}/{sitemap_filename}", "w") as f:
            f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
            f.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
            f.write("\n".join(urls))
            f.write('\n</urlset>')
        
        sitemaps_list.append(sitemap_filename)
        print(f"✅ Generated {sitemap_filename}")

    # 2. Generate Master Sitemap Index
    with open("sitemap.xml", "w") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
        f.write('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        for s in sitemaps_list:
            f.write(f"  <sitemap>\n    <loc>{BASE_URL}/{SITEMAP_DIR}/{s}</loc>\n    <lastmod>{today}</lastmod>\n  </sitemap>\n")
        f.write('</sitemapindex>')
    
    print("🔥 MASTER SITEMAP INDEX CREATED: sitemap.xml")

if __name__ == "__main__":
    generate_sitemaps()
