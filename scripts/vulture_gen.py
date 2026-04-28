import json
import os
import re
import shutil
from datetime import datetime

def slugify(text):
    return re.sub(r'[^a-z0-9]+', '-', str(text).lower()).strip('-')

def build_directory_and_sitemap():
    print("🏗️ VULTURE LMSS: Rebuilding Directory...")
    feed_file = "data/feeds/lc17_products.json"
    output_dir = "merchants"
    base_url = "https://brightlane.github.io/verified-merchant-directory"
    
    if not os.path.exists(feed_file):
        print("🛑 Missing feed file.")
        return

    with open(feed_file, 'r') as f:
        products = json.load(f)

    if not products:
        print("⚠️ No products to process.")
        return

    # Clear old directory
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    os.makedirs(output_dir)

    urls_for_sitemap = [f"{base_url}/", f"{base_url}/blog.html"]
    
    count = 0
    for p in products:
        m_name = p.get('Merchant', 'Partner')
        p_name = p.get('ProductName', 'Product')
        slug = f"{slugify(m_name)}-{slugify(p_name)}"
        file_path = os.path.join(output_dir, f"{slug}.html")
        
        # Build Page
        html = f"""<!DOCTYPE html><html><head><title>{p_name}</title></head>
        <body style="font-family:sans-serif;padding:50px;">
        <p style="color:blue;">{m_name} Verified</p>
        <h1>{p_name}</h1>
        <hr><a href="../">Return to Directory</a>
        </body></html>"""
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(html)
        
        urls_for_sitemap.append(f"{base_url}/merchants/{slug}.html")
        count += 1

    # Write Sitemap
    print(f"🗺️ Writing Sitemap for {len(urls_for_sitemap)} URLs...")
    today = datetime.now().strftime("%Y-%m-%d")
    sitemap_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    sitemap_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    for url in urls_for_sitemap:
        sitemap_content += f"  <url>\n    <loc>{url}</loc>\n    <lastmod>{today}</lastmod>\n    <priority>0.5</priority>\n  </url>\n"
    
    sitemap_content += "</urlset>"
    
    with open("sitemap.xml", "w", encoding='utf-8') as f:
        f.write(sitemap_content)

    print(f"✅ DONE: {count} pages and fresh sitemap generated.")

if __name__ == "__main__":
    build_directory_and_sitemap()
