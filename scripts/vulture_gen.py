import json
import os
import re
import shutil

def slugify(text):
    text = str(text).lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def generate_pure_lc_pages():
    print("🏗️ VULTURE LMSS: Building LC-17 Directory...")
    feed_file = "data/feeds/lc17_products.json"
    output_dir = "merchants"
    
    # FIX: Use shutil.rmtree to safely clear folders and files
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    os.makedirs(output_dir)

    if not os.path.exists(feed_file):
        print("🛑 STOP: No LC-17 data found.")
        return

    try:
        with open(feed_file, 'r', encoding='utf-8') as f:
            products = json.load(f)
    except:
        print("❌ JSON is empty or corrupt.")
        return
        
    count = 0
    for p in products:
        if not isinstance(p, dict): continue
        
        name = p.get('ProductName', 'Verified Product')
        merchant = p.get('Merchant', 'LC-Partner')
        
        slug = f"{slugify(merchant)}-{slugify(name)}"
        path = os.path.join(output_dir, f"{slug}.html")
        
        html = f"""<!DOCTYPE html><html><head><title>{name}</title></head>
        <body style="font-family:sans-serif; padding:40px;">
        <h1>{name}</h1><p>Merchant: {merchant}</p>
        <a href="../">Back to Directory</a></body></html>"""
        
        with open(path, 'w', encoding='utf-8') as out:
            out.write(html)
        count += 1
        
    print(f"✅ LC-17 COMPLETE: {count} Pages Generated.")

if __name__ == "__main__":
    generate_pure_lc_pages()
