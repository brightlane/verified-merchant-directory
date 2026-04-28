import json
import os
from datetime import datetime

# --- CONFIGURATION ---
FEED_DIR = "data/feeds"
OUTPUT_DIR = "merchants"
MY_LC_ID = "007949054186005142"

def update_lmss_log(total_count):
    """Updates the engine log with the latest build stats."""
    log_content = f"""ENGINE: Vulture 10K Pro
OPERATOR: brightlane
NETWORKS: SoftLife Travel, StadiumStay Global, Professor Owl Tax
CORE_ID: {MY_LC_ID}
LAST_BUILD: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
TOTAL_PAGES: {total_count}
STATUS: OPERATIONAL
"""
    with open("lmss.txt", "w") as f:
        f.write(log_content)
    print(f"📋 Metadata logged to lmss.txt ({total_count} pages)")

def generate_pages():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    total_pages = 0
    if not os.path.exists(FEED_DIR):
        print("❌ Error: Feed directory missing.")
        return

    print("🚀 Starting Chameleon Page Generation...")

    for filename in os.listdir(FEED_DIR):
        if filename.endswith(".json"):
            merchant_id = filename.replace(".json", "")
            with open(os.path.join(FEED_DIR, filename), 'r', encoding='utf-8') as f:
                try:
                    products = json.load(f)
                except: continue
            
            merchant_path = os.path.join(OUTPUT_DIR, merchant_id)
            os.makedirs(merchant_path, exist_ok=True)
            
            for p in products:
                raw_title = p.get('Title', 'product')
                clean_name = "".join(x for x in raw_title if x.isalnum() or x==' ').replace(' ', '-').lower()
                filepath = os.path.join(merchant_path, f"{clean_name}.html")
                
                target_url = p.get('URL', '')
                tracking_link = f"https://www.linkconnector.com/ta.php?lc={MY_LC_ID}&lc_pid={merchant_id}&url={target_url}"
                
                # HTML template with Chameleon Hook
                html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{raw_title}</title>
    <link rel="stylesheet" href="../../assets/style.css">
    <script src="../../assets/chameleon.js" defer></script>
</head>
<body>
    <div class="container">
        <header><h2 id="brand-name">Verified Merchant Directory</h2></header>
        <main class="card">
            <img src="{p.get('ImageURL', '')}" style="max-width:100%; border-radius:8px;">
            <h1>{raw_title}</h1>
            <p>{p.get('Description', 'Verified listing.')}</p>
            <h2 style="color:var(--accent-blue)">Price: ${p.get('Price', 'Check Site')}</h2>
            <a href="{tracking_link}" class="cta-btn" target="_blank" rel="nofollow">Secure Purchase</a>
        </main>
        <footer><p>&copy; 2026 <span id="brand-footer">Brightlane Verified Network</span></p></footer>
    </div>
</body>
</html>"""

                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(html_content)
                total_pages += 1

    # Update the status file
    update_lmss_log(total_pages)
    print(f"✅ Build Complete: {total_pages} pages live.")

if __name__ == "__main__":
    generate_pages()
