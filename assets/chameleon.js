// Chameleon.js - Dynamic Merchant Branding
document.addEventListener('DOMContentLoaded', () => {
    const merchantKey = document.body.dataset.merchant; // Set this in your HTML template
    
    const merchantColors = {
        'abebooks': '#800000',
        'lyst': '#000000',
        'halloweencostumes': '#ff6600',
        'tenorshare': '#007bff'
    };

    if (merchantColors[merchantKey]) {
        // Dynamically update the Buy Button to match the merchant's brand
        const buyBtn = document.querySelector('.buy-btn');
        if (buyBtn) {
            buyBtn.style.backgroundColor = merchantColors[merchantKey];
        }
    }
});
