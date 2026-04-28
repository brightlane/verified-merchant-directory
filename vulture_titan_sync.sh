#!/bin/bash

# Vulture Titan: Automated Sync & Deploy Protocol
# Affiliate ID: 014538
# Target: 17 Approved Merchants

echo "🦅 Starting Vulture Titan Sync..."

# 1. Update Inventory from LinkConnector
echo "Step 1: Downloading Fresh Feeds..."
python3 fetch_feeds.py

# 2. Ingest Data into SQLite
echo "Step 2: Running Production Ingest (1.2M Rows)..."
python3 production_ingest.py

# 3. Optimize Database for Search
echo "Step 3: Optimizing Database Indexes..."
python3 vulture_monitor.py --optimize

# 4. Generate Programmatic SEO Assets
echo "Step 4: Generating Sitemaps..."
python3 sitemap_gen.py

# 5. Generate Master Sitemap Index
echo "Step 5: Wrapping Sitemap Index..."
python3 sitemap_index_gen.py

# 6. Final Health Check
echo "Step 6: Verifying Affiliate Links (ID: 014538)..."
python3 vulture_router.py --test-run

echo "✅ SYNC COMPLETE. Vulture Titan is live."
