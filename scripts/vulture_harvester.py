import json
import os

FEED_DIR = "data/feeds"
OUTPUT_DIR = "merchants"

def generate_pages():
    print(f"🏗️ GENERATOR: Starting build...")
    
    # 1. Ensure output directory exists
    if not os.path.exists(OUTPUT_DIR):
        print(f"📁 Creating directory: {OUTPUT_DIR}")
        os.makedirs(OUTPUT_DIR)
        
    # 2. Check if we actually have data
    if not os.path.exists(FEED_DIR):
        print(f"❌ ERROR: {FEED_DIR} does not exist. Harvester failed!")
        return

    feed_files = [f for f in os.listdir(FEED_DIR) if f.endswith(".json")]
    print(f"📂 Found {len(feed_files)} feed files in {FEED_DIR}")

    if len(feed_files) == 0:
        print("⚠️ WARNING: No JSON data found. Check your Harvester API key!")
        return

    count = 0
    for filename in feed_files:
        print(f"📄 Processing feed: {filename}")
        try:
            with open(os.path.join(FEED_DIR, filename), 'r') as f:
                products = json.load(f)
            
            for p in products:
                # Use a unique identifier for the filename
                m_id = str(p.get('id', 'item'))
                p_name = p.get('Title', 'product').replace(' ', '-').lower()
                
                # We save it directly in the 'merchants' folder for the sitemap to find
                file_name = f"{m_id}-{p_name}.html"
                path = os.path.join(OUTPUT_DIR, file_name)
                
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(f"<html><body><h1>{p.get('Title')}</h1></body></html>")
                count += 1
        except Exception as e:
            print(f"❌ FAILED to process {filename}: {e}")
                
    print(f"✅ SUCCESS: Generated {count} static HTML pages in /{OUTPUT_DIR}")

if __name__ == "__main__":
    generate_pages()
