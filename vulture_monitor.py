import sqlite3
import requests
import json

def optimize_db():
    print("🧹 Vacuuming database for speed...")
    conn = sqlite3.connect('vulture_inventory.db')
    conn.execute("VACUUM") # Compresses the DB file
    conn.execute("REINDEX") # Refreshes indexes for 1.2M rows
    conn.commit()
    conn.close()

def check_random_links(sample_size=50):
    print(f"🔍 Testing {sample_size} random affiliate links...")
    conn = sqlite3.connect('vulture_inventory.db')
    cursor = conn.cursor()
    
    # Grab a random sample of your 1.2M rows
    cursor.execute("SELECT merchant_key, product_url FROM products ORDER BY RANDOM() LIMIT ?", (sample_size,))
    samples = cursor.fetchall()
    
    with open('approved_merchants.json', 'r') as f:
        config = json.load(f)

    for merchant_key, target in samples:
        merchant = config['merchants'].get(merchant_key)
        # Test the LinkConnector redirect logic
        test_link = f"https://www.linkconnector.com/ta.php?lc={config['affiliate_id']}{merchant['lc_id']}&url={target}"
        
        try:
            res = requests.head(test_link, allow_redirects=True, timeout=5)
            status = "OK" if res.status_code == 200 else f"ERR: {res.status_code}"
            print(f"[{merchant_key}] {status} -> {test_link[:50]}...")
        except Exception as e:
            print(f"[{merchant_key}] FAILED: {str(e)}")

    conn.close()

if __name__ == "__main__":
    optimize_db()
    check_random_links()
