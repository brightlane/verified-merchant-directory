import sqlite3
import csv
import re

def slugify(text):
    text = text.lower()
    return re.sub(r'[^a-z0-9]+', '-', text).strip('-')

def ingest_csv(merchant_key, file_path):
    conn = sqlite3.connect('vulture_inventory.db')
    cursor = conn.cursor()
    
    with open(file_path, mode='r', encoding='utf-8') as f:
        # LinkConnector feeds usually use Tab or Comma
        reader = csv.DictReader(f) 
        
        items_added = 0
        for row in reader:
            # Mapping standard LC headers (adjust if feed headers vary)
            title = row.get('Product_Name') or row.get('Title')
            raw_url = row.get('Product_URL') or row.get('Link')
            
            if not title or not raw_url:
                continue

            slug = slugify(f"{merchant_key}-{title}-{row.get('Product_ID', '')}")
            
            try:
                cursor.execute('''
                    INSERT OR REPLACE INTO products 
                    (merchant_key, product_id, title, description, price, image_url, product_url, category, slug)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    merchant_key,
                    row.get('Product_ID'),
                    title,
                    row.get('Description'),
                    row.get('Price'),
                    row.get('Image_URL'),
                    raw_url,
                    row.get('Category'),
                    slug
                ))
                items_added += 1
            except sqlite3.Error:
                continue
                
    conn.commit()
    conn.close()
    print(f"Success: {items_added} items ingested for {merchant_key}")

# EXAMPLE USAGE:
# ingest_csv('abebooks', 'abebooks_full_feed.csv')
# ingest_csv('lyst', 'lyst_inventory.csv')
