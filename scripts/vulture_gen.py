import json
import os

def generate_production_pages():
    print("🏗️ VULTURE: Building Production Merchant Directory...")
    feed_dir = "data/feeds"
    output_dir = "merchants"
    os.makedirs(output_dir, exist_ok=True)
    
    total_count = 0
    
    # Iterate through every JSON feed in the folder
    for filename in os.listdir(feed_dir):
        if filename.endswith(".json"):
            with open(os.path.join(feed_dir, filename), 'r') as f:
                try:
                    data = json.load(f)
                    products = data if isinstance(data, list) else []
                    
                    for p in products:
                        if not isinstance(p, dict): continue
                        
                        name = p.get('ProductName', 'Verified Merchant')
                        merchant = p.get('Merchant', 'Official Partner')
                        
                        # SEO-Friendly URL Slug
                        slug = f"{merchant}-{name}".lower().replace(' ', '-').replace('.', '').replace('/', '')
                        path = os.path.join(output_dir, f"{slug}.html")
                        
                        # High-Performance SEO Template
                        html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{name} | {merchant} Verified Directory</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }}
        .card {{ background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-top: 5px solid #2c3e50; }}
        .badge {{ background: #eef2f7; color: #2c3e50; padding: 5px 12px; border-radius: 4px; font-weight: bold; font-size: 12px; text-transform: uppercase; }}
        h1 {{ margin-top: 10px; color: #1a1a1a; }}
        .btn {{ display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }}
        .footer {{ margin-top: 40px; font-size: 12px; color: #777; text-align: center; }}
    </style>
</head>
<body>
    <div class="card">
        <span class="badge">Verified Merchant: {merchant}</span>
        <h1>{name}</h1>
        <p>This is an official verified landing page for <strong>{name}</strong>. Access the latest 2026 pricing and availability through our authorized {merchant} portal.</p>
        
        <a href="https://brightlane.github.io/verified-merchant-directory/" class="btn">View Directory</a>
    </div>
    <div class="footer">
        © 2026 Verified Merchant Directory | Powered by Vulture Titan Engine
    </div>
</body>
</html>
"""
                        with open(path, 'w', encoding='utf-8') as out:
                            out.write(html_content)
                        total_count += 1
                except Exception as e:
                    print(f"⚠️ Error skipping entry: {e}")
                    continue
                    
    print(f"✅ FINAL SUCCESS: {total_count} Pages Printed to /merchants")

if __name__ == "__main__":
    generate_production_pages()
