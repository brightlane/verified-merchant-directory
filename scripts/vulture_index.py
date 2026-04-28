import json
import os

# --- CONFIGURATION ---
CONFIG_FILE = "affiliate.json"
INDEX_FILE = "index.html"

def generate_index():
    with open(CONFIG_FILE, 'r') as f:
        config = json.load(f)
    
    merchants = config['campaigns']
    
    html_start = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Verified Merchant Directory | Brightlane Network</title>
    <link rel="stylesheet" href="assets/style.css">
</head>
<body>
    <div class="container">
        <header><h1>Verified Merchant Directory</h1><p>2026 Global Partner Network</p></header>
        <main class="grid-container">"""

    html_end = """
        </main>
        <footer><p>&copy; 2026 Brightlane Global | All Links Verified</p></footer>
    </div>
</body>
</html>"""

    merchant_cards = ""
    for m_id, meta in merchants.items():
        # Check if the merchant folder actually exists before showing it
        if os.path.exists(f"merchants/{m_id}"):
            merchant_cards += f"""
            <div class="card">
                <h3>{meta['name']}</h3>
                <p>Category: {meta['niche'] if 'niche' in meta else 'General'}</p>
                <a href="merchants/{m_id}/" class="cta-btn">View All Products</a>
            </div>"""

    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        f.write(html_start + merchant_cards + html_end)
    
    print(f"✅ Master Index created with {len(merchants)} merchant portals.")

if __name__ == "__main__":
    generate_index()
