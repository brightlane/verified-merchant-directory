import json
import os

def generate_pages():
    print("🏗️ GENERATOR: Scaling to 10,000 Pages...")
    feed_dir = "data/feeds"
    output_dir = "merchants"
    os.makedirs(output_dir, exist_ok=True)
    
    total_count = 0
    
    if not os.path.exists(feed_dir):
        return

    for filename in os.listdir(feed_dir):
        if filename.endswith(".json"):
            with open(os.path.join(feed_dir, filename), 'r') as f:
                try:
                    data = json.load(f)
                    products = data if isinstance(data, list) else []
                    
                    for p in products:
                        if not isinstance(p, dict): continue
                        
                        name = p.get('ProductName', p.get('campaign_name', 'Product'))
                        merchant = p.get('Merchant', 'Verified-Merchant')
                        
                        # Generate high-performance SEO URL
                        slug = f"{merchant}-{name}".lower().replace(' ', '-').replace('.', '')
                        path = os.path.join(output_dir, f"{slug}.html")
                        
                        # The HTML Template
                        html_content = f"""
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>{name} | {merchant} Verified</title>
                            <style>body{{font-family:sans-serif;padding:50px;line-height:1.6;}} .box{{border:2px solid #eee;padding:20px;}}</style>
                        </head>
                        <body>
                            <div class="box">
                                <h1>{name}</h1>
                                <p>Official Merchant: <strong>{merchant}</strong></p>
                                <hr>
                                <p>Welcome to the 2026 Verified Merchant Directory. This landing page is optimized for <strong>{name}</strong>.</p>
                                <a href="https://brightlane.github.io/verified-merchant-directory/">Back to Directory</a>
                            </div>
                        </body>
                        </html>
                        """
                        with open(path, 'w', encoding='utf-8') as out:
                            out.write(html_content)
                        total_count += 1
                except:
                    continue
                    
    print(f"✅ TOTAL SUCCESS: Generated {total_count} pages.")

if __name__ == "__main__":
    generate_pages()
