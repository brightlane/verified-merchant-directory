import os
from datetime import datetime

# CONFIGURATION
BASE_URL = "https://brightlane.github.io/verified-merchant-directory/"

def generate_sitemap():
    print("🛰️ VULTURE MAPPER: DEEP SCAN STARTING...")
    
    # Get the current directory (the root of the repo)
    root_dir = os.getcwd()
    
    sitemap_header = '<?xml version="1.0" encoding="UTF-8"?>\n'
    sitemap_header += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    urls = []
    now = datetime.now().strftime("%Y-%m-%d")
    
    # 1. Always include the homepage
    urls.append(f'  <url>\n    <loc>{BASE_URL}</loc>\n    <lastmod>{now}</lastmod>\n    <priority>1.0</priority>\n  </url>')

    # 2. DEEP SCAN: Walk through every single folder in the repo
    for root, dirs, files in os.walk(root_dir):
        # Skip system folders so we don't index junk
        if any(ignored in root for ignored in [".git", ".github", "scripts", "data"]):
            continue
            
        for file in files:
            if file.endswith(".html") and file != "index.html" and file != "404.html":
                # Calculate the path relative to the root
                rel_path = os.path.relpath(os.path.join(root, file), root_dir)
                web_path = rel_path.replace("\\", "/") # Convert Windows paths to Web paths
                
                full_url = f"{BASE_URL}{web_path}"
                
                entry = f'  <url>\n    <loc>{full_url}</loc>\n    <lastmod>{now}</lastmod>\n    <priority>0.8</priority>\n  </url>'
                urls.append(entry)

    # 3. Save the "Real" Sitemap
    with open("sitemap.xml", "w", encoding="utf-8") as f:
        f.write(sitemap_header)
        f.write("\n".join(urls))
        f.write("\n</urlset>")
    
    print(f"✅ SUCCESS: Sitemap generated with {len(urls)} total URLs.")

if __name__ == "__main__":
    generate_sitemap()
