import json
import urllib.parse

def generate_affiliate_link(merchant_key, target_url=None):
    # Load the approved data
    with open('approved_merchants.json', 'r') as f:
        data = json.load(f)
    
    merchant = data['merchants'].get(merchant_key)
    if not merchant:
        return "Merchant not in approved list."

    # Use base URL if no specific product URL is provided
    final_target = target_url if target_url else merchant['base_url']
    
    # URL Encode the target for the 'url' parameter
    encoded_url = urllib.parse.quote(final_target, safe='')
    
    # Construct the LinkConnector deep link
    # Format: ta.php?lc=[AFF_ID][LC_ID]&url=[ENCODED_TARGET]
    aff_link = f"https://www.linkconnector.com/ta.php?lc={data['affiliate_id']}{merchant['lc_id']}&url={encoded_url}"
    
    return aff_link

# EXAMPLES FOR YOUR LANDING PAGES
# 1. Broad Home Page Link
print(f"Main Store: {generate_affiliate_link('lyst')}")

# 2. Deep Product Link (e.g. from an AbeBooks search result)
product_url = "https://www.abebooks.com/servlet/BookDetailsPL?bi=12345"
print(f"Deep Product Link: {generate_affiliate_link('abebooks', product_url)}")
