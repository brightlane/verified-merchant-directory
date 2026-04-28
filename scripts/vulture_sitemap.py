import os
from datetime import datetime

BASE_URL = "https://brightlane.github.io/verified-merchant-directory/"

def generate_sitemap():
    print("🛰️ SITEMAP: Starting Deep Scan...")
    root_dir = os.getcwd()
    sitemap_header = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    urls = []
    now = datetime.now().strftime("%Y-%m-%d")
    urls.append(f'  <url><loc>{BASE_URL}</loc><lastmod>{now}</lastmod><priority>1.0</priority></url>')

    for root, dirs, files in os.walk(root_dir):
        if any(x in root for x in [".git", ".github", "scripts", "data"]): 
            continue
        for file in files:
            if file.endswith(".html") and file not in ["index.html", "404.html"]:
                rel_path = os.path.relpath(os.path.join(root, file), root_dir).replace("\\", "/")
                urls.append(f'  <url><loc>{BASE_URL}{rel_path}</loc><lastmod>{now}</lastmod><priority>0.8</priority></url>')

    with open("sitemap.xml", "w", encoding="utf-8") as f:
        f.write(sitemap_header + "\n".join(urls) + "\n</urlset>")
    
    print(f"✅ SUCCESS: Sitemap updated with {len(urls)} links.")

if __name__ == "__main__":
    generate_sitemap()
