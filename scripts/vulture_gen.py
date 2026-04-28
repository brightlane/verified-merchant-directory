import json
import os
import re
import shutil

def slugify(text):
    return re.sub(r'[^a-z0-9]+', '-', str(text).lower()).strip('-')

def build_massive_directory():
    print("🏗️ VULTURE LMSS: Building Massive Directory...")
    feed_path = "data/feeds/lc17_products.json"
    output_dir = "merchants"

    if not os.path.exists(feed_path): return

    with open(feed_path, 'r') as f:
        products = json.load(f)

    if not products:
        print("⚠️ Feed empty.")
        return

    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    os.makedirs(output_dir)

    # Building pages in bulk
    for p in products:
        m_name = p.get('Merchant', 'Partner')
        p_name = p.get('ProductName', 'Product')
        slug = f"{slugify(m_name)}-{slugify(p_name)}"
        
        html = f"<html><body><h1>{p_name}</h1><p>Via {m_name}</p></body></html>"
        
        with open(os.path.join(output_dir, f"{slug}.html"), 'w') as f:
            f.write(html)

    print(f"✅ DONE: Generated {len(products)} pages.")

if __name__ == "__main__":
    build_massive_directory()
