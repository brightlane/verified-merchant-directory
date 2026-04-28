import json
import os
import re
import shutil
from datetime import datetime

def slugify(text):
    """Converts product names into SEO-friendly URLs."""
    return re.sub(r'[^a-z0-9]+', '-', str(text).lower()).strip('-')

def build_pSEO_directory():
    print("🏗️ VULTURE: Building Directory & Sitemap...")
    
    # Configuration
    feed_file = "data/feeds/lc17_products.json"
    output_dir = "merchants"
    base_url = "https://brightlane.github.io/verified-merchant-directory"
    
    # 1. Safety Check: Load the harvested data
    if not os.path.exists(feed_file):
        print("🛑 Error: No feed data found. Run harvester first.")
        return

    with open(feed_file, 'r') as f:
        try:
            products = json.load(f)
        except:
            products = []

    # 2. Reset the merchants folder
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    os.makedirs(output_dir)

    # 3. Initialize the URL list for the sitemap
    # Always include your static hub pages first
    urls_for_sitemap = [
        f"{base_url}/",
        f"{base_url}/blog.html"
    ]

    # 4. Generate Pages & Populate URL list
    if not products:
        # Create a single placeholder to keep Git/Sitemap from being empty
        placeholder = "catalog-update-in-progress"
        with open(f"{output_dir}/{placeholder}.html", "w") as f:
            f.write("<html><body><h1>Updating Verified Catalog...</h1></body></html>")
        urls_for_sitemap.append(f"{base_url}/merchants/{placeholder}.html")
    else:
        for p in products:
            m_name = p.get('Merchant', 'Verified Partner')
            p_name = p.get('ProductName', 'Merchant Product')
            
            # Create unique file name
            s = f"{slugify(m_name)}-{slugify(p_name)}"
            file_path = os.path.join(output_dir, f"{s}.html")
            
            # Simple pSEO HTML Template
            html_content = f"""<!DOCTYPE html>
<html lang="en">
<head><title>{p_name} | Verified Directory</title></head>
<body style="font-family:sans-serif; padding:40px; line-height:1.6;">
    <p style="text-transform:uppercase; color:green; font-weight:bold;">{m_name} Verified</p>
    <h1>{p_name}</h1>
    <hr>
    <p>Inventory status for <b>{p_name}</b> is currently active.</p>
    <a href="../" style="display:inline-block; margin-top:20px;">← Back to Directory</a>
</body>
</html>"""
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            # Add to sitemap list
            urls_for_sitemap.append(f"{base_url}/merchants/{s}.html")

    # 5. Write the Sitemap.xml file
    today = datetime.now().strftime("%Y-%m-%d")
    xml_output = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_output += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    for url in urls_for_sitemap:
        xml_output += f"  <url>\n    <loc>{url}</loc>\n    <lastmod>{today}</lastmod>\n    <priority>0.6</priority>\n  </url>\n"
    
    xml_output += "</urlset>"
    
    with open("sitemap.xml", "w", encoding='utf-8') as f:
        f.write(xml_output)

    print(f"✅ SUCCESS: {len(urls_for_sitemap)} URLs written to sitemap.xml")

if __name__ == "__main__":
    build_pSEO_directory()
