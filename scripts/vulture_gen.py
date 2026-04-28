import json, os, re, shutil
from datetime import datetime

def slug(t): return re.sub(r'[^a-z0-9]+', '-', str(t).lower()).strip('-')

def build():
    # 1. Load Data
    feed = "data/feeds/lc17_products.json"
    if not os.path.exists(feed): return
    with open(feed, 'r') as f: products = json.load(f)
    
    # 2. Setup Directory
    out = "merchants"
    if os.path.exists(out): shutil.rmtree(out)
    os.makedirs(out)
    
    # 3. Generate Pages & Track URLs
    base = "https://brightlane.github.io/verified-merchant-directory"
    urls = [f"{base}/", f"{base}/blog.html"] # The 2 base links
    
    for p in products:
        m, n = p.get('Merchant', 'Partner'), p.get('ProductName', 'Product')
        s = f"{slug(m)}-{slug(n)}"
        with open(f"{out}/{s}.html", 'w') as f:
            f.write(f"<html><body><h1>{n}</h1><p>{m}</p></body></html>")
        urls.append(f"{base}/merchants/{s}.html") # Adding the dynamic links

    # 4. Write Sitemap (This forces the jump from 2 to 10k+)
    date = datetime.now().strftime("%Y-%m-%d")
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for u in urls:
        xml += f"  <url><loc>{u}</loc><lastmod>{date}</lastmod><priority>0.5</priority></url>\n"
    xml += "</urlset>"
    
    with open("sitemap.xml", "w") as f: f.write(xml)
    print(f"Sitemap updated with {len(urls)} links.")

if __name__ == "__main__": build()
