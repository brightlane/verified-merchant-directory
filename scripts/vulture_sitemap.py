import os
from datetime import datetime

BASE_URL = "https://brightlane.github.io/verified-merchant-directory/"

def generate_sitemap():
    print("🛰️ SITEMAP: Deep Scanning Directory...")
    root_dir = os.getcwd()
    now = datetime.now().strftime("%Y-%m-%d")
    
    urls = [
        f'  <url><loc>{BASE_URL}</loc><lastmod>{now}</lastmod><priority>1.0</priority></url>',
        f'  <url><loc>{BASE_URL}blog.html</loc><lastmod>{now}</lastmod><priority>0.8</priority></url>'
    ]

    # Scan the /merchants folder for all 10,000+ files
    merchant_dir = os.path.join(root_dir, "merchants")
    if os.path.exists(merchant_dir):
        for file in os.listdir(merchant_dir):
            if file.endswith(".html"):
                urls.append(f'  <url><loc>{BASE_URL}merchants/{file}</loc><lastmod>{now}</lastmod><priority>0.7</priority></url>')

    header = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    footer = '\n</urlset>'
    
    with open("sitemap.xml", "w", encoding="utf-8") as f:
        f.write(header + "\n".join(urls) + footer)
    
    print(f"✅ SITEMAP READY: {len(urls)} links indexed.")

if __name__ == "__main__":
    generate_sitemap()
