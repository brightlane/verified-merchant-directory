import json
import urllib.parse


# ─────────────────────────────────────────────────────────────────
#  LINKCONNECTOR AFFILIATE LINK GENERATOR
#  Correct URL format:
#    https://www.linkconnector.com/ta.php
#      ?wcid={mid}                   ← campaign/merchant ID
#      &lcaffid={full_18digit_id}    ← your affiliate ID
#      &url={encoded_product_url}    ← deep-link destination
#
#  Your affiliate ID : 007949054186005142
#  Source of truth   : approved_merchants.json → merchants[key]['mid']
#
#  WHAT WAS WRONG BEFORE:
#    ✗  lc={short_id}{lc_id}   — param doesn't exist; IDs concatenated
#    ✗  affiliate_id = '014538' — that's your network short-ID, not lcaffid
#    ✗  lc_id field used        — lc_id is an internal ref; use 'mid'
# ─────────────────────────────────────────────────────────────────

LC_BASE   = "https://www.linkconnector.com/ta.php"
LC_AFFID  = "007949054186005142"   # full 18-digit affiliate ID


def generate_affiliate_link(merchant_key: str, target_url: str) -> str:
    """
    Build a correctly-tracked LinkConnector deep-link for any product.

    Args:
        merchant_key : key matching approved_merchants.json  e.g. 'build_a_sign'
        target_url   : the exact product/landing page URL    e.g. 'https://www.buildasign.com/banners'

    Returns:
        Full LC tracking URL string, or target_url as a safe fallback.
    """

    # 1. Load merchant config
    try:
        with open('approved_merchants.json', 'r') as f:
            config = json.load(f)
    except FileNotFoundError:
        print("CRITICAL: approved_merchants.json not found — returning bare URL")
        return target_url
    except json.JSONDecodeError as e:
        print(f"CRITICAL: approved_merchants.json is malformed — {e}")
        return target_url

    # 2. Look up merchant record by key
    merchant_data = config.get('merchants', {}).get(merchant_key)
    if not merchant_data:
        print(f"CRITICAL: No merchant data for key '{merchant_key}' — returning bare URL")
        return target_url

    # 3. Pull the campaign ID ('mid' is the correct LC wcid param)
    wcid = merchant_data.get('mid')
    if not wcid:
        print(f"CRITICAL: Merchant '{merchant_key}' has no 'mid' field — returning bare URL")
        return target_url

    # 4. URL-encode the deep-link destination
    encoded_url = urllib.parse.quote(target_url, safe='')

    # 5. Assemble the correct LC tracking URL
    #    wcid    = LinkConnector campaign/merchant ID  (was: lc_id — wrong)
    #    lcaffid = your full 18-digit affiliate ID     (was: 014538 — wrong)
    #    url     = encoded destination page            (correct, keep as-is)
    final_link = (
        f"{LC_BASE}"
        f"?wcid={wcid}"
        f"&lcaffid={LC_AFFID}"
        f"&url={encoded_url}"
    )

    return final_link


# ─────────────────────────────────────────────────────────────────
#  QUICK SMOKE TEST  (run: python vulture_router.py)
# ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    tests = [
        ("build_a_sign",      "https://www.buildasign.com/banners"),
        ("chess_store",       "https://thechessstore.com/chess-sets"),
        ("halloweencostumes", "https://www.halloweencostumes.com/kids-costumes"),
        ("nordvpn",           "https://nordvpn.com/pricing"),   # not in JSON yet — tests fallback
        ("movavi",            "https://www.movavi.com/video-editor/"),
    ]

    for key, url in tests:
        result = generate_affiliate_link(key, url)
        status = "✓" if "wcid=" in result else "✗ FALLBACK"
        print(f"{status}  {key}")
        print(f"   → {result}\n")
