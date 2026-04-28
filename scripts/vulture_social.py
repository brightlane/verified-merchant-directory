import json
import random
import os
from datetime import datetime

# --- CONFIGURATION ---
CONFIG_FILE = "affiliate.json"
OUTPUT_FILE = "daily_caption.txt"

def generate_social_post():
    print("📱 Generating Daily Social Media Intelligence...")
    
    # 1. Load Master Config
    if not os.path.exists(CONFIG_FILE):
        print(f"❌ Error: {CONFIG_FILE} not found.")
        return

    with open(CONFIG_FILE, 'r') as f:
        config = json.load(f)
    
    merchants = config.get('campaigns', {})
    if not merchants:
        print("⚠️ No merchants found in config.")
        return

    # 2. Pick a random merchant to feature today
    m_id = random.choice(list(merchants.keys()))
    merchant = merchants[m_id]
    
    # 3. Safe Extraction (Prevents KeyError)
    merchant_name = merchant.get('name', 'Verified Partner')
    # Use .get() with a fallback 'Verified Merchant' to fix your specific error
    niche_name = merchant.get('niche', 'Verified Merchant')
    
    # 4. Trigger Word Logic for ManyChat
    # We map specific IDs to trigger words, or use a default
    trigger_map = {
        "70695": "SIGN",      # Build A Sign
        "88473": "SPOOKY",    # HalloweenCostumes
        "100273": "REFUND",   # E-file
        "120034": "SECURE",   # NordVPN
        "53532": "PHOTO"      # Depositphotos
    }
    trigger_word = trigger_map.get(m_id, "DEAL")

    # 5. Build the Caption
    today = datetime.now().strftime('%B %d, %2026')
    
    caption = f"""
🚀 NETWORK UPDATE: {today}

Looking for the best deals on {merchant_name}? 
Our 10K Engine just refreshed all listings in the {niche_name} directory!

Everything is verified and ready for the 2026 season. 🏆

👇 COMMENT '{trigger_word}' below and I'll DM you the direct access link!

#AffiliateMarketing #SmartShopping #BrightlaneNetwork #{niche_name.replace(' ', '')}
"""

    # 6. Save for the Operator (You)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(caption.strip())
    
    print(f"✅ Success! Social caption for {merchant_name} saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    generate_social_post()
