import json
import os
import re
import shutil

def slugify(text):
    text = str(text).lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def generate_persistent_pages():
    print("🏗️ VULTURE LMSS: Checking for LC-17 Data...")
    feed_file = "data/feeds/lc17_products.json"
    output_dir = "merchants"
    
    if not os.path.exists(feed_file):
        print("🛑 STOP: Feed file missing.")
        return

    # Load and validate
    try:
        with open(feed_file, 'r', encoding='utf-8') as f:
            products = json.load(f)
    except:
        products = []

    # SAFETY GATE: If products == 0, stop here and leave the folder alone.
    if not products or len(products) == 0:
        print("⚠️ No products in feed. Keeping existing pages to protect sitemap.")
        return

    print(f"🔥 Data Verified! Rebuilding {len(products)} merchant pages...")
    
    # Only wipe if we have the new data ready
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    os.makedirs(output_dir)

    count = 0
    for p in products:
        if not isinstance(p, dict): continue
        
        name = p.get('ProductName', 'Verified Product')
        merchant = p.get('Merchant', 'Official Partner')
        
        slug = f"{slugify(merchant)}-{slugify(name)}"
        path = os.path.join(output_dir, f"{slug}.html")
        
        # Standard SEO Template
        html = f"""<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>{name}</title></head>
        <body style="font-family:sans-serif;padding:40px;"><h1>{name}</h1><p>Merchant: {merchant}</p>
        <hr><a href="../">Return to Directory</a></body></html>"""
        
        with open(path, 'w', encoding='utf-8') as out:
            out.write(html)
        count += 1
        
    print(f"✅ SUCCESS: {count} Pages Printed.")

if __name__ == "__main__":
    generate_persistent_pages()
