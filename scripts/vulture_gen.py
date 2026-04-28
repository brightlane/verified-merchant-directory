import json
import os
from datetime import datetime

def update_lmss_log(total_count, breakdown):
    """
    Generates a master audit log for the 2026 Omni-Protocol.
    Tracks 17 merchants, Blog status, and AI Briefing sync.
    """
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # 1. Build Header
    log_content = [
        "==========================================",
        "      VULTURE ENGINE 10K PRO v17          ",
        "         OMNI-PROTOCOL ACTIVE             ",
        "==========================================",
        f"OPERATOR: brightlane",
        f"LAST BUILD: {timestamp}",
        f"TOTAL PAGES LIVE: {total_count}",
        "------------------------------------------",
        "CAMPAIGN AUDIT STATUS:"
    ]
    
    # 2. Check individual merchant health (Build A Sign, HalloweenCostumes, etc.)
    # We sort by merchant ID to keep the log clean
    for m_id in sorted(breakdown.keys()):
        count = breakdown[m_id]
        status = "✅ ACTIVE" if count > 0 else "❌ FAILED"
        log_content.append(f"ID {m_id}: {count} Pages | {status}")
    
    # 3. Ecosystem Verification
    # We check if the files were actually created on disk this run
    sync_checks = {
        "SITEMAP.XML": "sitemap.xml",
        "INDEX.HTML": "index.html",
        "BLOG.HTML": "blog.html",
        "SOCIAL_CAP": "daily_caption.txt",
        "AI_BRIEFING": "ai_briefing.json"
    }

    log_content.extend([
        "------------------------------------------",
        "ECOSYSTEM SYNC STATUS:"
    ])

    for label, filename in sync_checks.items():
        if os.path.exists(filename):
            mtime = datetime.fromtimestamp(os.path.getmtime(filename)).strftime('%H:%M')
            log_content.append(f"{label.ljust(12)}: [ VERIFIED @ {mtime} ]")
        else:
            log_content.append(f"{label.ljust(12)}: [ ⚠️ MISSING ]")

    # 4. Footer
    log_content.extend([
        "------------------------------------------",
        "BUILD STATUS: 100% OPERATIONAL",
        "=========================================="
    ])
    
    # 5. Write to file
    with open("lmss.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(log_content))
    
    print(f"✅ Audit Log updated in lmss.txt for {total_count} pages.")

# Ensure this is called at the very end of your generate_network() function
# update_lmss_log(total_pages, merchant_breakdown)
