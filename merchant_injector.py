import sqlite3
import os
import json

# Configuration
MERCHANT_DIR = "merchants"
TEMPLATE_FILE = "vulture_live.html"
ID = "014538"

def inject_to_merchant_folder():
    if not os.path.exists(MERCHANT_DIR):
        os.makedirs(MERCHANT_DIR)

    conn = sqlite3.connect('vulture_inventory.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Load the merchant config for the 17 approved
    with open('approved_merchants.json', 'r') as f:
        config = json.load(f)

    print("🦅 Vulture Titan: Injecting merchants folder...")

    # Fetch all products to create the directory entries
    cursor.execute("SELECT * FROM products")
    products = cursor.fetchall()

    for product in products:
        m_key = product['merchant_key']
        merchant_path = os.path.join(MERCHANT_DIR, m_key)
        
        if not os.path.exists(merchant_path):
            os.makedirs(merchant_path)

        # Create a unique JSON or HTML entry for the aggregator
        entry_file = os.path.join(merchant_path, f"{product['slug']}.json")
        
        entry_data = {
            "id": product['product_id'],
            "title": product['title'],
            "price": product['price'],
            "url": product['product_url'],
            "aff_link": f"https://www.linkconnector.com/ta.php?lc={ID}{config['merchants'][m_key]['lc_id']}&url={product['product_url']}"
        }

        with open(entry_file, 'w') as ef:
            json.dump(entry_data, ef, indent=4)

    conn.close()
    print(f"✅ Injection complete into /{MERCHANT_DIR} folder.")

if __name__ == "__main__":
    inject_to_merchant_folder()
