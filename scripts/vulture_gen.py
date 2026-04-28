import json
import os
import re

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def generate_lmss_pages():
    print("🏗️ VULTURE LMSS: Executing High-Scale Generation...")
    feed_dir = "data/feeds"
    output_dir = "merchants"
    os.makedirs(output_dir, exist_ok=True)
    
    total_count = 0
    
    for filename in os.listdir(feed_dir):
        if filename.endswith(".json"):
            with open(os.path.join(feed_dir, filename), 'r', encoding='utf-8') as f:
                try:
                    products = json.load(f)
                    for p in products:
                        if not isinstance(p, dict): continue
                        
                        name = p.get('ProductName', 'Verified Product')
                        merchant = p.get('Merchant', 'Official Partner')
                        
                        # LMSS URL Protocol
                        slug = f"{slugify(merchant)}-{slugify(name)}"
                        path = os.path.join(output_dir, f"{slug}.html")
                        
                        # High-Performance 2026 SEO Template
                        html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{name} | {merchant} Verified</title>
    <style>
        body {{ font-family: sans-serif; background: #f8fafc; color: #1e293b; padding: 40px; }}
        .card {{ max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 12px; border-top: 5px solid #2563eb; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
        .tag {{ color: #2563eb; font-weight: bold; text-transform: uppercase; font-size: 12px; }}
        .btn {{ display: block; text-align: center; background: #2563eb; color: white; padding: 12px; text-decoration: none; border-radius: 6px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class="card">
        <span class="tag">{merchant} Official</span>
        <h1>{name}</h1>
        <p>Verified landing page for <strong>{name}</strong> via {merchant}. Access 2026 availability.</p>
        <a href="https://brightlane.github.io/verified-merchant-directory/" class="btn">View Merchant Directory</a>
    </div>
</body>
</html>
"""
                        with open(path, 'w', encoding='utf-8') as out:
                            out.write(html_content)
                        total_count += 1
                except:
                    continue
                    
    print(f"✅ LMSS COMPLETE: {total_count} Pages Printed.")

if __name__ == "__main__":
    generate_lmss_pages()
