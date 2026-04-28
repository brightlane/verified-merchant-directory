#!/bin/bash

# Vulture Titan: Automated Sync & Deploy Protocol
# Affiliate ID: 014538
# Status: RECOVERY MODE ENABLED

echo "🦅 Starting Vulture Titan Sync..."

# 1. Update Inventory
echo "Step 1: Downloading Fresh Feeds..."
python3 fetch_feeds.py

# 2. Ingest Data
echo "Step 2: Running Production Ingest..."
python3 production_ingest.py

# 2b. Merchant Injection (THE MISSING STEP)
echo "Step 2b: Injecting Data into /merchants folder..."
python3 merchant_injector.py

# 3. Optimize
echo "Step 3: Optimizing Database..."
python3 vulture_monitor.py --optimize

# 4. SEO & Sitemaps
echo "Step 4: Generating Sitemaps..."
python3 sitemap_gen.py
python3 sitemap_index_gen.py

# 5. Commit Changes
echo "Step 5: Preparing Vulture 10K Push..."
# This part is usually handled by your GitHub Action main.yml
# but can be run locally if needed.

echo "✅ RECOVERY COMPLETE. Merchants folder repopulated."
