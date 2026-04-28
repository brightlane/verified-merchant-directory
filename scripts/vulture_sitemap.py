import os
from datetime import datetime

# CONFIGURATION
BASE_URL = "https://brightlane.github.io/verified-merchant-directory/"

def generate_sitemap():
    print("🛰️ SITEMAP: Starting Deep Scan...")
    root_dir = os.getcwd()
    sitemap_header = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    urls = []
    now = datetime.now().strftime("%Y-%m-%d")
    
    # 1. Add Homepage
    urls.append(f'  <url><loc>{BASE_URL}</loc><lastmod>{now}</lastmod><priority>1.0</priority></url>')

    # 2. Deep Scan every directory for .html files
    for root, dirs, files in os.walk(root_dir):
        # Ignore system folders
        if any(x in root for x in [".git", ".github", "scripts", "data"]): 
            continue
            
        for file in files:
            # Find any HTML file that isn't a system page
            if file.endswith(".html") and file not in ["index.html", "404.html"]:
                rel_path = os.path.relpath(os.path.join(root, file), root_dir).replace("\\", "/")
                full_url = f"{BASE_URL}{rel_path}"
                
                entry = f'  <url>\n    <loc>{full_url}</loc>\n    <lastmod>{now}</lastmod>\n    <priority>0.8</priority>\n  </url>'
                urls.append(entry)

    # 3. Save sitemap.xml to the root
    with open("sitemap.xml", "w", encoding="utf-8") as f:
        f.write(sitemap_header + "\n".join(urls) + "\n</urlset>")
    
    print(f"✅ SUCCESS: Sitemap updated with {len(urls)} total URLs.")

if __name__ == "__main__":
    generate_sitemap()
