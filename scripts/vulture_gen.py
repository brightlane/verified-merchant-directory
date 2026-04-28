import json
import os
import re
import shutil

def slugify(text):
    return re.sub(r'[^a-z0-9]+', '-', str(text).lower()).strip('-')

def generate_production_pages():
    print("🏗️ VULTURE: Building 10k Product Index...")
    feed_file = "data/feeds/lc17_products.json"
    output_dir = "merchants"
    
    if not os.path.exists(feed_file):
        print("🛑 Error: No data file found at data/feeds/lc17_products.json")
        return

    with open(feed_file, 'r') as f:
        products = json.load(f)

    if not products:
        print("⚠️ Feed is empty. Nothing to build.")
        return

    # Clear and Rebuild
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    os.makedirs(output_dir)

    for p in products:
        name = p.get('ProductName', 'Product')
        merchant = p.get('Merchant', 'Merchant')
        slug = f"{slugify(merchant)}-{slugify(name)}"
        
        # High-Conversion Template
        html = f"""<!DOCTYPE html><html><head><title>{name}</title></head>
        <body style="font-family:sans-serif;padding:50px;">
        <span style="color:blue;">Verified {merchant} Partner</span>
        <h1>{name}</h1>
        <a href="../" style="display:inline-block;margin-top:20px;">Back to Directory</a>
        </body></html>"""
        
        with open(os.path.join(output_dir, f"{slug}.html"), 'w') as out:
            out.write(html)

    print(f"✅ BUILD COMPLETE: {len(products)} pages created.")

if __name__ == "__main__":
    generate_production_pages()
