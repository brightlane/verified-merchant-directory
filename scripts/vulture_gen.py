import json
import os

def generate_product_pages():
    print("🏗️ GENERATOR: Printing LC-17 Product Pages...")
    feed_path = "data/feeds/lc17_data.json"
    output_dir = "merchants"
    
    # Ensure the directory exists
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    if not os.path.exists(feed_path):
        print("⚠️ FEED MISSING: No data to process.")
        return

    with open(feed_path, 'r') as f:
        try:
            data = json.load(f)
        except Exception as e:
            print(f"❌ JSON ERROR: {e}")
            return

    # Handle both list format and dictionary wrap
    products = data if isinstance(data, list) else data.get('results', [])

    count = 0
    for p in products:
        # If the product is just a string (the error we saw), skip it
        if not isinstance(p, dict):
            continue
            
        # Extracting data based on LC-17 Feed structure
        name = p.get('ProductName', p.get('campaign_name', 'Verified Product'))
        merchant = p.get('Merchant', 'LC-Partner')
        
        # Clean the slug for the URL
        safe_name = "".join([c for c in name if c.isalnum() or c==' ']).strip().replace(' ', '-')
        file_name = f"{merchant.lower()}-{safe_name.lower()}.html"
        path = os.path.join(output_dir, file_name)
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(f"<html><head><title>{name}</title></head>")
            f.write(f"<body><h1>{name}</h1><p>Merchant: {merchant}</p></body></html>")
        count += 1
        
    print(f"✅ SUCCESS: Generated {count} Merchant Product pages.")

if __name__ == "__main__":
    generate_product_pages()
