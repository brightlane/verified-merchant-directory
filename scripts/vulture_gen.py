import json
import os

# --- CONFIGURATION ---
FEED_DIR = "data/feeds"
OUTPUT_DIR = "merchants"
# Your verified LinkConnector ID
MY_LC_ID = "007949054186005142"

def generate_pages():
    # 1. Ensure the output directory exists
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print("🚀 Vulture Page Generator: Starting Build...")
    
    # 2. Process each merchant JSON file harvested
    if not os.path.exists(FEED_DIR):
        print(f"❌ Error: {FEED_DIR} not found. Run the harvester first.")
        return

    for filename in os.listdir(FEED_DIR):
        if filename.endswith(".json"):
            merchant_id = filename.replace(".json", "")
            
            with open(os.path.join(FEED_DIR, filename), 'r', encoding='utf-8') as f:
                try:
                    products = json.load(f)
                except Exception as e:
                    print(f"⚠️ Skip {filename}: Invalid JSON ({e})")
                    continue
            
            # Create merchant subfolder (Silo Architecture)
            merchant_path = os.path.join(OUTPUT_DIR, merchant_id)
            os.makedirs(merchant_path, exist_ok=True)
            
            print(f"📂 Processing Merchant {merchant_id}: {len(products)} items...")
            
            for p in products:
                # 3. Clean product title for URL safety
                raw_title = p.get('Title', 'product')
                clean_name = "".join(x for x in raw_title if x.isalnum() or x==' ').replace(' ', '-').lower()
                if not clean_name: clean_name = f"product-{p.get('ProductID', 'id')}"
                
                filepath = os.path.join(merchant_path, f"{clean_name}.html")
                
                # 4. Build the Chameleon-Ready Tracking Link
                # We pass the 'ref' parameter through to the merchant if possible
                target_url = p.get('URL', '')
                tracking_link = f"https://www.linkconnector.com/ta.php?lc={MY_LC_ID}&lc_pid={merchant_id}&url={target_url}"
                
                # 5. The Chameleon-Powered HTML Template
                html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{raw_title} | Verified Merchant Directory</title>
    <link rel="stylesheet" href="../../assets/style.css">
    <script src="../../assets/chameleon.js" defer></script>
</head>
<body>
    <div class="container">
        <header>
            <h2 id="brand-name">Verified Merchant Directory</h2>
            <nav><a href="../../index.html" style="color: var(--text-muted);">← Back to Directory</a></nav>
        </header>

        <main class="card" style="max-width: 900px; margin: 40px auto; text-align: center;">
            <div class="product-image">
                <img src="{p.get('ImageURL', 'https://via.placeholder.com/400')}" 
                     alt="{raw_title}" 
                     style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid var(--accent-blue);">
            </div>
            
            <h1 style="margin-top: 25px;">{raw_title}</h1>
            
            <p class="description" style="color: var(--text-muted); font-size: 1.1rem; padding: 0 20px;">
                {p.get('Description', 'This is a verified product from our merchant network.')}
            </p>
            
            <div class="price-action" style="margin-top: 30px; padding: 20px; background: rgba(0,0,0,0.2); border-radius: 8px;">
                <h2 style="color: var(--accent-blue); margin: 0 0 20px 0;">Price: ${p.get('Price', 'Check Site')}</h2>
                <a href="{tracking_link}" class="cta-btn" target="_blank" rel="nofollow">Secure Checkout</a>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 15px;">
                    *Prices and availability verified by LinkConnector Network.
                </p>
            </div>
        </main>

        <footer style="margin-top: 50px; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
            <p>&copy; 2026 <span id="brand-footer">Brightlane Verified Merchant Network</span></p>
        </footer>
    </div>
</body>
</html>"""

                # 6. Save the file
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(html_content)

    print(f"✅ GENERATION COMPLETE: All silos built in /{OUTPUT_DIR}")

if __name__ == "__main__":
    generate_pages()
