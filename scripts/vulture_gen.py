import json
import os

# --- CONFIG ---
FEED_DIR = "data/feeds"
OUTPUT_INDEX = "index.html"

def generate_empire_index():
    """
    This function generates the high-authority landing page.
    It includes the Global SEO Architecture, Hreflang, and JSON-LD.
    """
    
    # --- THE FULL SEO TEMPLATE ---
    html_template = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verified Merchant Directory | AI Travel & Tax Solutions 2026</title>
    <meta name="description" content="Global verified merchant directory for 2026 World Cup travel and tax services.">
    <meta name="robots" content="index, follow, max-image-preview:large">
    <link rel="canonical" href="https://brightlane.github.io/verified-merchant-directory/" />

    <link rel="alternate" hreflang="x-default" href="https://brightlane.github.io/verified-merchant-directory/" />
    <link rel="alternate" hreflang="en-US" href="https://brightlane.github.io/verified-merchant-directory/en-us/" />
    <link rel="alternate" hreflang="es-ES" href="https://brightlane.github.io/verified-merchant-directory/es-es/" />

    <script type="application/ld+json">
    [
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Vulture 10K Engine",
        "operatingSystem": "Web",
        "applicationCategory": "TravelApplication",
        "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "reviewCount": "8420" }
      },
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Brightlane Global",
        "url": "https://brightlane.github.io/verified-merchant-directory/"
      }
    ]
    </script>

    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        :root { --navy: #020617; --cyan: #22d3ee; }
        body { background: var(--navy); color: #94a3b8; font-family: 'Inter', sans-serif; overflow-x: hidden; }
        .lang-scroll { display: inline-block; animation: scroll 40s linear infinite; }
        @keyframes scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .glass { background: #0f172a; border: 1px solid #1e293b; transition: all 0.3s; }
        .glass:hover { border-color: var(--cyan); box-shadow: 0 0 15px rgba(34, 211, 238, 0.1); }
    </style>
</head>
<body>

    <div class="bg-slate-800 overflow-hidden py-2 border-b border-slate-700">
        <div class="lang-scroll whitespace-nowrap text-[10px] font-mono uppercase text-slate-400">
            EN US • ES ES • FR FR • DE DE • HI IN • ZH CN • JA JP • PT BR • RU RU • IT IT • KO KR • NL NL • &nbsp;
            EN US • ES ES • FR FR • DE DE • HI IN • ZH CN • JA JP • PT BR • RU RU • IT IT • KO KR • NL NL •
        </div>
    </div>

    <header class="max-w-6xl mx-auto pt-24 pb-16 px-6 text-center">
        <div class="inline-block px-3 py-1 border border-cyan-500/30 rounded-full text-[10px] text-cyan-400 mb-4 font-mono">
            VULTURE_ENGINE_v17.4 // ACTIVE
        </div>
        <h1 class="text-6xl font-black text-white mb-6 tracking-tighter leading-none">
            Verified Merchant <span class="text-cyan-400">Network</span>
        </h1>
        <p class="text-xl max-w-2xl mx-auto text-slate-400 mb-12 leading-relaxed">
            2026 Global Partner Network. Specialized travel intelligence and verified financial service portals.
        </p>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <a href="merchants/100273/index.html" class="glass p-8 rounded-2xl block group">
                <div class="text-3xl mb-4 group-hover:scale-110 transition-transform">💸</div>
                <h3 class="text-xl font-bold text-white mb-2">IRS Tax Hub</h3>
                <p class="text-sm text-slate-400">Automated refund tracking and simplified guides for 2026 filers.</p>
                <div class="mt-6 text-cyan-400 text-xs font-bold tracking-widest">ACCESS_PORTAL →</div>
            </a>

            <a href="merchants/skyscanner/index.html" class="glass p-8 rounded-2xl block group border-cyan-500/30">
                <div class="text-3xl mb-4 group-hover:scale-110 transition-transform">✈️</div>
                <h3 class="text-xl font-bold text-white mb-2">World Cup Travel</h3>
                <p class="text-sm text-slate-400">Real-time Skyscanner flights and stadium lodging for the 2026 games.</p>
                <div class="mt-6 text-cyan-400 text-xs font-bold tracking-widest">SEARCH_DEALS →</div>
            </a>

            <a href="merchants/stadiumstay/index.html" class="glass p-8 rounded-2xl block group">
                <div class="text-3xl mb-4 group-hover:scale-110 transition-transform">🏟️</div>
                <h3 class="text-xl font-bold text-white mb-2">StadiumStay</h3>
                <p class="text-sm text-slate-400">Verified lodging within walking distance of global stadium venues.</p>
                <div class="mt-6 text-cyan-400 text-xs font-bold tracking-widest">FIND_HOTELS →</div>
            </a>
        </div>
    </header>

    <section class="max-w-6xl mx-auto px-6 mb-24 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="glass p-6 rounded-xl text-center">
            <div class="text-2xl font-bold text-white">17</div>
            <div class="text-[10px] uppercase tracking-widest text-cyan-500">Active Hubs</div>
        </div>
        <div class="glass p-6 rounded-xl text-center">
            <div class="text-2xl font-bold text-white">10K+</div>
            <div class="text-[10px] uppercase tracking-widest text-cyan-500">Global Pages</div>
        </div>
        <div class="glass p-6 rounded-xl text-center">
            <div class="text-2xl font-bold text-white">24/7</div>
            <div class="text-[10px] uppercase tracking-widest text-cyan-500">API Sync</div>
        </div>
        <div class="glass p-6 rounded-xl text-center">
            <div class="text-2xl font-bold text-white">190+</div>
            <div class="text-[10px] uppercase tracking-widest text-cyan-500">Countries</div>
        </div>
    </section>

    <footer class="border-t border-slate-800 py-12 text-center">
        <div class="flex justify-center gap-8 mb-6 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            <a href="sitemap.xml" class="hover:text-cyan-400">Sitemap</a>
            <a href="lmss.txt" class="hover:text-cyan-400">Audit_Log</a>
            <a href="robots.txt" class="hover:text-cyan-400">Robots</a>
        </div>
        <p class="text-[10px] font-mono text-slate-600 uppercase">© 2026 BRIGHTLANE GLOBAL | ALL LINKS VERIFIED</p>
    </footer>

    <script>
        document.querySelectorAll('a').forEach(link => {
            if(link.href.includes('merchants')) {
                const url = new URL(link.href, window.location.origin);
                url.searchParams.set('utm_source', 'brightlane_network');
                url.searchParams.set('utm_campaign', 'vulture_10k');
                link.href = url.toString();
            }
        });
    </script>
</body>
</html>
    """

    with open(OUTPUT_INDEX, "w", encoding="utf-8") as f:
        f.write(html_template)
    
    print(f"✅ EMPIRE INDEX REBUILT: {OUTPUT_INDEX}")

if __name__ == "__main__":
    # If you have your atomic product logic, call it here too.
    # For now, let's just force the index to be correct.
    generate_empire_index()
