# Use this inside your generate_vulture_empire() function
    html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>17 Verified Merchants | Vulture Engine 10K Global</title>
    
    <link rel="alternate" hreflang="en" href="{BASE_URL}" />
    <link rel="alternate" hreflang="es" href="{BASE_URL}?lang=es" />
    <link rel="alternate" hreflang="fr" href="{BASE_URL}?lang=fr" />
    
    <style>
        body {{ background: #020617; color: white; font-family: 'Inter', sans-serif; text-align: center; margin: 0; padding: 0; }}
        .nav {{ position: sticky; top: 0; background: rgba(2, 6, 23, 0.9); backdrop-filter: blur(10px); padding: 15px; border-bottom: 1px solid #1e293b; }}
        .hero {{ padding: 80px 20px; background: radial-gradient(circle at top, #0f172a 0%, #020617 100%); }}
        .count {{ font-size: 7rem; color: #22d3ee; font-weight: 900; margin: 0; line-height: 1; }}
        .ticker {{ background: #0f172a; padding: 12px; overflow: hidden; white-space: nowrap; border-y: 1px solid #1e293b; color: #22d3ee; font-size: 0.8rem; letter-spacing: 2px; }}
        .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; padding: 40px; max-width: 1200px; margin: 0 auto; }}
        .card {{ background: #0f172a; border: 1px solid #1e293b; padding: 20px; border-radius: 12px; transition: 0.3s; text-decoration: none; color: white; }}
        .card:hover {{ border-color: #22d3ee; transform: translateY(-5px); }}
    </style>
</head>
<body>
    <nav class="nav">
        <span style="color:#22d3ee; font-weight:bold;">VULTURE PRO v17</span>
    </nav>

    <section class="hero">
        <h1 class="count">{total_count}</h1>
        <p style="color: #94a3b8; font-size: 1.4rem;">Verified LinkConnector Campaigns Active</p>
        <p style="color: #22d3ee;">Affiliate ID: {LC_ID}</p>
    </section>

    <div class="ticker">
        EN • ES • FR • DE • IT • PT • JA • ZH • KO • HI • AR • RU • TR • VI • GLOBAL COMPLIANT
    </div>

    <div class="grid">
        {" ".join([f'<a href="#" class="card"><h3>{m["name"]}</h3><p>{m["category"]}</p><span>View Deal →</span></a>' for m in merchant_data])}
    </div>

    <script>
        // Automatic Affiliate Link Injector
        const LCID = "{LC_ID}";
        document.querySelectorAll('.card').forEach(card => {{
            // This replaces the '#' with your actual tracking link logic
            card.onclick = (e) => {{
                e.preventDefault();
                const merchantName = card.querySelector('h3').innerText;
                console.log("Redirecting to " + merchantName + " with ID " + LCID);
                // window.location.href = "YOUR_LC_BASE_URL" + LCID; 
            }};
        }});
    </script>
</body>
</html>
"""
