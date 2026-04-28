import json
import os
import re

def slugify(text):
    text = str(text).lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def generate_pure_lc_pages():
    print("🏗️ VULTURE LMSS: Building LC-17 Directory...")
    feed_file = "data/feeds/lc17_products.json"
    output_dir = "merchants"
    
    # Clean old merchant pages to ensure 100% LC-17 accuracy
    if os.path.exists(output_dir):
        for f in os.listdir(output_dir):
            os.remove(os.path.join(output_dir, f))
    else:
        os.makedirs(output_dir)

    if not os.path.exists(feed_file):
        print("🛑 STOP: No LC-17 data found. Run Harvester first.")
        return

    with open(feed_file, 'r', encoding='utf-8') as f:
        products = json.load(f)
        
    count = 0
    for p in products:
        name = p.get('ProductName', 'Verified Product')
        merchant = p.get('Merchant', 'LC-Partner')
        
        slug = f"{slugify(merchant)}-{slugify(name)}"
        path = os.path.join(output_dir, f"{slug}.html")
        
        html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{name} | {merchant} Verified</title>
    <style>
        body {{ font-family: sans-serif; line-height: 1.6; padding: 40px; background: #f4f4f9; }}
        .box {{ max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-left: 5px solid #007bff; }}
        .m-tag {{ color: #007bff; font-weight: bold; font-size: 0.8rem; text-transform: uppercase; }}
        .btn {{ display: inline-block; margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }}
    </style>
</head>
<body>
    <div class="box">
        <div class="m-tag">{merchant} Verified Partner</div>
        <h1>{name}</h1>
        <p>Authorized merchant listing for <strong>{name}</strong>. Updated for April 2026.</p>
        <a href="https://brightlane.github.io/verified-merchant-directory/" class="btn">Return to Directory</a>
    </div>
</body>
</html>"""
        
        with open(path, 'w', encoding='utf-8') as out:
            out.write(html)
        count += 1
        
    print(f"✅ LC-17 COMPLETE: {count} Verified Pages Generated.")

if __name__ == "__main__":
    generate_pure_lc_pages()
