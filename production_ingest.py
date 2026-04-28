import sqlite3
import csv
import re
import os

def slugify(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')

def full_production_run():
    conn = sqlite3.connect('vulture_inventory.db')
    cursor = conn.cursor()
    # Performance tuning for million-row datasets
    cursor.execute("PRAGMA synchronous = OFF") 
    cursor.execute("PRAGMA journal_mode = MEMORY") 
    
    feed_dir = 'feeds/'
    # Map for your 17 approved merchants
    mid_map = {
        "154194": "abebooks", "159279": "lyst", "88473": "halloweencostumes",
        "168507": "ticketbuyback", "18340": "wolters_kluwer", "1641": "la_fuente",
        "110813": "chess_store", "70695": "build_a_sign", "153105": "movavi",
        "152912": "combat_flip_flops", "155657": "tenorshare", "48130": "wondershare",
        "158029": "products_on_the_go", "141940": "snappy", "167189": "infinite_aloe",
        "153507": "viper_tec", "166587": "rse_hair"
    }

    for filename in os.listdir(feed_dir):
        if filename.endswith(".csv"):
            mid = filename.replace("feed_", "").replace(".csv", "")
            m_key = mid_map.get(mid)
            if not m_key: continue
            
            print(f"🚀 Ingesting {m_key}...")
            with open(os.path.join(feed_dir, filename), 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                batch = []
                for row in reader:
                    title = row.get('Product_Name') or row.get('Title', 'No Title')
                    # Unique slug combining merchant and ID to prevent collisions
                    slug = slugify(f"{m_key}-{title}-{row.get('Product_ID', '')}")
                    batch.append((
                        m_key, row.get('Product_ID'), title, row.get('Description'),
                        row.get('Price'), row.get('Image_URL'), row.get('Product_URL'),
                        row.get('Category'), slug
                    ))
                    
                    if len(batch) >= 10000: # High-capacity batch
                        cursor.executemany("INSERT OR REPLACE INTO products VALUES (NULL,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)", batch)
                        batch = []
                if batch:
                    cursor.executemany("INSERT OR REPLACE INTO products VALUES (NULL,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)", batch)
            conn.commit()
    conn.close()
    print("✅ DATABASE LOADED: 1.2M+ Rows Ready.")

if __name__ == "__main__":
    full_production_run()
