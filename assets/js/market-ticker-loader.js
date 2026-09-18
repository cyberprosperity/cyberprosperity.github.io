async function loadMarketTicker() {
    const slot = document.getElementById('tv-ticker-slot');
    if (!slot) return;

    try {
        const res = await fetch('market-ticker.html');
        const html = await res.text();
        slot.innerHTML = html;

        slot.querySelectorAll('script').forEach(oldScript => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr =>
                newScript.setAttribute(attr.name, attr.value)
            );
            newScript.textContent = oldScript.textContent;
            oldScript.replaceWith(newScript);
        });
    } catch (err) {
        console.error('Gagal memuat market ticker:', err);
    }
}

document.addEventListener('DOMContentLoaded', loadMarketTicker);