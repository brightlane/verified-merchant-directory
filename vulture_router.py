import json
import urllib.parse

def generate_affiliate_link(merchant_key, target_url):
    # 1. Load the master config (rebuild_config.py ensures this exists)
    try:
        with open('approved_merchants.json', 'r') as f:
            config = json.load(f)
    except FileNotFoundError:
        return "Error: Config Missing"

    # 2. Get User ID (Your ID: 014538)
    aff_id = config.get('affiliate_id', '014538')

    # 3. Get Merchant Specific Data
    # This is where the e-file.com leak usually happens
    merchant_data = config['merchants'].get(merchant_key)

    if not merchant_data:
        # Fallback to prevent dead links, but log the error
        print(f"CRITICAL: No merchant data for {merchant_key}")
        return target_url 

    # 4. Construct the Merchant-Specific LC String
    # Format: https://www.linkconnector.com/ta.php?lc=[AFF_ID][LC_ID]&url=[ENCODED_URL]
    lc_id = merchant_data['lc_id']
    encoded_url = urllib.parse.quote(target_url, safe='')
    
    final_link = f"https://www.linkconnector.com/ta.php?lc={aff_id}{lc_id}&url={encoded_url}"
    
    return final_link

# TEST RUN: 
# print(generate_affiliate_link('build_a_sign', 'https://www.buildasign.com/banners'))
