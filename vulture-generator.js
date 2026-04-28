// Vulture Titan: Front-End Merchant Injector
// Affiliate ID: 014538

const VultureInjector = {
    init: async function() {
        const urlParams = new URLSearchParams(window.location.search);
        const productSlug = window.location.pathname.split('/').pop() || urlParams.get('p');

        if (productSlug) {
            await this.fetchAndInject(productSlug);
        }
    },

    fetchAndInject: async function(slug) {
        try {
            // Fetching from your dynamic API/Flask endpoint
            const response = await fetch(`/api/product/${slug}`);
            const product = await response.json();

            if (product) {
                this.updateDOM(product);
            }
        } catch (error) {
            console.error("Vulture Injector Error:", error);
        }
    },

    updateDOM: function(product) {
        // Injecting Title & Price
        document.title = `${product.title} - Best Price Online`;
        if (document.getElementById('product-title')) document.getElementById('product-title').innerText = product.title;
        if (document.getElementById('product-price')) document.getElementById('product-price').innerText = product.price;
        if (document.getElementById('product-desc')) document.getElementById('product-desc').innerText = product.description;

        // Injecting the Tracking Link (ID: 014538)
        const buyButton = document.getElementById('vulture-buy-button');
        if (buyButton) {
            buyButton.href = product.affiliate_button_url;
            buyButton.innerText = `Buy Now from ${product.merchant}`;
        }

        // Image Injection
        const prodImg = document.getElementById('product-image');
        if (prodImg) {
            prodImg.src = product.image;
            prodImg.alt = product.title;
        }
    }
};

window.onload = () => VultureInjector.init();
