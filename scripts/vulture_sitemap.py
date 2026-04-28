import os
from datetime import datetime

# CONFIGURATION
BASE_URL = "https://brightlane.github.io/verified-merchant-directory/"
# This ensures it looks in the correct folder relative to the script
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MERCHANTS_DIR = os.path.join(ROOT_DIR, "merchants")
OUTPUT_FILE = os.path.join(ROOT_DIR, "sitemap.xml")

def generate_sitemap():
    print(f"🛰️ VULTURE MAPPER STARTING...")
    print(f"🔍 Looking in: {MERCHANTS_DIR}")
    
    sitemap_header = '<?xml version="1.0" encoding="UTF-8"?>\n'
    sitemap_header += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    urls = []
    now = datetime.now().strftime("%Y-%m-%d")
    
    # 1. Always add the homepage
    urls.append(f'  <url>\n    <loc>{BASE_URL}</loc>\n    <lastmod>{now}</lastmod>\n    <priority>1.0</priority>\n  </url>')

    # 2. Crawl the merchants folder
    if os.path.exists(MERCHANTS_DIR):
        for root, dirs, files in os.walk(MERCHANTS_DIR):
            for file in files:
                if file.endswith(".html"):
                    # Create the path relative to the repository root
                    rel_path = os.path.relpath(os.path.join(root, file), ROOT_DIR).replace("\\", "/")
                    full_url = f"{BASE_URL}{rel_path}"
                    
                    entry = f'  <url>\n    <loc>{full_url}</loc>\n    <lastmod>{now}</lastmod>\n    <priority>0.8</priority>\n  </url>'
                    urls.append(entry)
    else:
        print(f"⚠️ ERROR: {MERCHANTS_DIR} folder not found!")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(sitemap_header)
        f.write("\n".join(urls))
        f.write("\n</urlset>")
    
    print(f"✅ Sitemap generated with {len(urls)} URLs at {OUTPUT_FILE}")

if __name__ == "__main__":
    generate_sitemap()
