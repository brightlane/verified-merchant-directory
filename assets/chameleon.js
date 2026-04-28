document.addEventListener("DOMContentLoaded", function() {
    const params = new URLSearchParams(window.location.search);
    const site = params.get('ref'); // e.g., ?ref=stadiumstay
    
    const body = document.body;
    const brandName = document.getElementById('brand-name');

    if (site === 'stadium') {
        // Switch to StadiumStay Green/Gold
        document.documentElement.style.setProperty('--accent-blue', '#f1c40f');
        document.documentElement.style.setProperty('--navy-surface', '#1e3932');
        brandName.innerText = 'StadiumStay Global Network';
    } else if (site === 'softlife') {
        // Switch to SoftLife Luxury Navy/Silver
        document.documentElement.style.setProperty('--accent-blue', '#c0c0c0');
        document.documentElement.style.setProperty('--navy-surface', '#001f3f');
        brandName.innerText = 'SoftLife Travel Network';
    }
});
