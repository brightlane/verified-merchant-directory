import json
import os

# Configuration
FEED_DIR = "data/feeds"
OUTPUT_DIR = "merchants"
MY_LC_ID = "007949054186005142"

def generate_pages():
    if not os.path.exists(OUTPUT_DIR): os.makedirs(OUTPUT_DIR)
    
    # Process each merchant JSON file
    for filename in os.listdir(FEED_DIR):
        if filename.endswith(".json"):
            merchant_id = filename.replace(".json", "")
            with open(os.path.join(FEED_DIR, filename), 'r') as f:
                products = json.load(f)
            
            # Create merchant subfolder
            merchant_path = os.path.join(OUTPUT_DIR, merchant_id)
            if not os.path.exists(merchant_path): os.makedirs(merchant_path)
            
            for p in products:
                # Clean title for filename
                clean_name = "".join(x for x in p['Title'] if x.isalnum() or x==' ').replace(' ', '-').lower()
                filepath = os.path.join(merchant_path, f"{clean_name}.html")
                
                # Build Parallel Tracking Link
                tracking_link = f"https://www.linkconnector.com/ta.php?lc={MY_LC_ID}&lc_pid={merchant_id}&clickid={{gclid}}&url={p['URL']}"
                
                # Generate Navy Blue HTML
                html = f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <title>{p['Title']} | Verified Merchant Directory</title>
                    <link rel="stylesheet" href="../../assets/style.css">
                </head>
                <body>
                    <div class="container">
                        <div class="card" style="max-width: 800px; margin: 40px auto; text-align: center;">
                            <img src="{p.get('ImageURL', '')}" style="max-width: 100%; border-radius: 8px;">
                            <h1>{p['Title']}</h1>
                            <p style="color: var(--text-muted); font-size: 1.2rem;">{p.get('Description', 'Verified partner product.')}</p>
                            <h2 style="color: #0074D9;">Price: ${p.get('Price', 'See Site')}</h2>
                            <a href="{tracking_link}" class="cta-btn" style="padding: 20px 40px; font-size: 1.5rem;">Secure Purchase</a>
                        </div>
                    </div>
                </body>
                </html>
                """
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(html)
    print("✅ Successfully generated all product pages.")

if __name__ == "__main__":
    generate_pages()
