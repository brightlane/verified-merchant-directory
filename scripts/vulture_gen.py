import json, os, re, shutil
from datetime import datetime

def slug(t): return re.sub(r'[^a-z0-9]+', '-', str(t).lower()).strip('-')

def build():
    feed = "data/feeds/lc17_products.json"
    out = "merchants"
    
    # Ensure directory exists even if no products
    if os.path.exists(out): shutil.rmtree(out)
    os.makedirs(out)
    
    products = []
    if os.path.exists(feed):
        with open(feed, 'r') as f:
            try: products = json.load(f)
            except: products = []

    base = "https://brightlane.github.io/verified-merchant-directory"
    urls = [f"{base}/", f"{base}/blog.html"]
    
    if not products:
        # Create one placeholder so the Git Add command doesn't fail
        with open(f"{out}/placeholder.html", 'w') as f:
            f.write("<html><body><h1>Updating Catalog...</h1></body></html>")
        urls.append(f"{base}/merchants/placeholder.html")
    else:
        for p in products:
            m, n = p.get('Merchant', 'Partner'), p.get('ProductName', 'Product')
            s = f"{slug(m)}-{slug(n)}"
            with open(f"{out}/{s}.html", 'w') as f:
                f.write(f"<html><body><h1>{n}</h1><p>{m}</p></body></html>")
            urls.append(f"{base}/merchants/{s}.html")

    # Write Sitemap
    date = datetime.now().strftime("%Y-%m-%d")
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for u in urls:
        xml += f"  <url><loc>{u}</loc><lastmod>{date}</lastmod><priority>0.5</priority></url>\n"
    xml += "</urlset>"
    
    with open("sitemap.xml", "w") as f: f.write(xml)
    print(f"✅ Build Finished. {len(urls)} URLs in sitemap.")

if __name__ == "__main__": build()
