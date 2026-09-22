/* =========================================================
   CYBER PROSPERITY
   BROKER DETAIL PAGE — DATA & RENDER LOGIC
   Membaca ?broker=... dari URL, lalu mengisi konten
   halaman broker-detail.html secara otomatis.
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // DATA BROKER
    // Tambahkan entri baru di sini kalau ada
    // broker baru di kemudian hari.
    // ==========================================

    const BROKERS = {

        cfforex: {
            theme: "gold", // "gold" atau "blue"
            name: "CFFOREX",
            logo: "assets/images/brokers/cfforex.png",
            license: "BAPPEBTI / OJK / BI &bull; Indonesia — Partner Resmi CFX Pros",
            badges: ["Forex", "Gold", "Diregulasi Lokal"],
            registerUrl: "https://clientarea.cfforex.com/auth/register/cypros7",
            websiteUrl: "https://www.cfforex.com",
            about: "CFFOREX adalah broker forex dan komoditas yang telah diregulasi resmi di Indonesia di bawah pengawasan BAPPEBTI, OJK, dan BI. Sebagai mitra resmi CFX Pros, CFFOREX menyediakan akses trading forex dan emas dengan kondisi kompetitif, eksekusi cepat, dan dukungan lokal yang responsif bagi trader Indonesia.",
            tradingConditions: [
                { label: "Minimum Deposit", value: "$100" },
                { label: "Fee per Lot", value: "$0.1" },
                { label: "Spread Mulai", value: "0.1 Pips" },
                { label: "Leverage", value: "Hingga 1:200" },
                { label: "Tipe Akun", value: "Standard, ECN" },
                { label: "Platform", value: "MetaTrader 4 / 5" }
            ],
            pros: [
                "Regulasi lokal lengkap (BAPPEBTI/OJK/BI)",
                "Spread kompetitif mulai 0.1 pips",
                "Support lokal berbahasa Indonesia",
                "Cashback rutin via CFX Pros"
            ],
            cons: [
                "Minimum deposit lebih tinggi dari kompetitor",
                "Belum mendukung trading crypto"
            ],
            summary: [
                { label: "Regulasi", value: "BAPPEBTI/OJK/BI" },
                { label: "Min. Deposit", value: "$100" },
                { label: "Fee/Lot", value: "$0.1" },
                { label: "Instrumen", value: "Forex, Gold" },
                { label: "Status", value: "Partner Resmi" }
            ]
        },

        firsttrade: {
            theme: "blue",
            name: "FIRST TRADE",
            logo: "assets/images/brokers/Firsttrade.png",
            license: "Global Multi Asset International Broker — Partner Resmi CFX Pros",
            badges: ["Forex", "Gold", "Crypto", "Multi Asset"],
            registerUrl: "https://cabinet.firsttrademarkets.com/signup?refferal=69ce54a549802",
            websiteUrl: "https://www.firsttrademarkets.com",
            about: "FIRST TRADE adalah broker multi-aset internasional yang melayani trader di berbagai negara dengan akses ke forex, emas, dan cryptocurrency dalam satu platform. Dengan biaya rendah dan minimum deposit yang terjangkau, FIRST TRADE cocok untuk trader yang mencari fleksibilitas instrumen trading yang lebih luas.",
            tradingConditions: [
                { label: "Minimum Deposit", value: "$30" },
                { label: "Fee per Lot", value: "$0" },
                { label: "Spread Mulai", value: "0.0 Pips" },
                { label: "Leverage", value: "Hingga 1:500" },
                { label: "Tipe Akun", value: "Standard, Pro" },
                { label: "Platform", value: "MetaTrader 4 / 5" }
            ],
            pros: [
                "Minimum deposit rendah, mulai $30",
                "Zero fee per lot",
                "Mendukung trading Forex, Gold, dan Crypto",
                "Leverage tinggi hingga 1:500"
            ],
            cons: [
                "Regulasi bersifat internasional, bukan lokal Indonesia",
                "Waktu respons support bisa lebih lama di jam sibuk"
            ],
            summary: [
                { label: "Regulasi", value: "Internasional" },
                { label: "Min. Deposit", value: "$30" },
                { label: "Fee/Lot", value: "$0" },
                { label: "Instrumen", value: "Forex, Gold, Crypto" },
                { label: "Status", value: "Partner Resmi" }
            ]
        }

    };

    // ==========================================
    // BACA PARAMETER ?broker= DARI URL
    // ==========================================

    const params = new URLSearchParams(window.location.search);
    const brokerKey = params.get("broker");
    const broker = BROKERS[brokerKey] || BROKERS.cfforex; // fallback ke cfforex kalau param kosong/tidak dikenal

    // ==========================================
    // RENDER KE DOM
    // ==========================================

    // Title & breadcrumb
    document.getElementById("bd-page-title").textContent = broker.name + " | Cyber Prosperity";
    document.getElementById("bd-breadcrumb-name").textContent = broker.name;

    // Tema warna hero (gold / blue)
    const heroEl = document.getElementById("bd-hero");
    if (broker.theme === "blue") {
        heroEl.classList.add("bd-theme--blue");
    }

    // Logo
    const logoImg = document.getElementById("bd-logo-img");
    logoImg.src = broker.logo;
    logoImg.alt = broker.name;

    // Nama & lisensi
    document.getElementById("bd-name").textContent = broker.name;
    document.getElementById("bd-license").innerHTML = broker.license;
    document.getElementById("bd-about-name").textContent = broker.name;
    document.getElementById("bd-about-text").textContent = broker.about;

    // Badges
    const badgesWrap = document.getElementById("bd-badges");
    badgesWrap.innerHTML = "";
    broker.badges.forEach(label => {
        const span = document.createElement("span");
        span.textContent = label;
        badgesWrap.appendChild(span);
    });

    // Tombol CTA (ada 2 tombol "daftar" di halaman: hero + panel kanan)
    const registerBtns = [
        document.getElementById("bd-btn-register"),
        document.getElementById("bd-btn-register-2")
    ];
    registerBtns.forEach(btn => {
        if (btn) btn.href = broker.registerUrl;
    });

    const websiteBtn = document.getElementById("bd-btn-website");
    if (websiteBtn) websiteBtn.href = broker.websiteUrl;

    // Tabel kondisi trading
    const table = document.getElementById("bd-table");
    table.innerHTML = "";
    broker.tradingConditions.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${row.label}</td><td>${row.value}</td>`;
        table.appendChild(tr);
    });

    // Kelebihan
    const prosList = document.getElementById("bd-pros-list");
    prosList.innerHTML = "";
    broker.pros.forEach(text => {
        const li = document.createElement("li");
        li.textContent = text;
        prosList.appendChild(li);
    });

    // Pertimbangan
    const consList = document.getElementById("bd-cons-list");
    consList.innerHTML = "";
    broker.cons.forEach(text => {
        const li = document.createElement("li");
        li.textContent = text;
        consList.appendChild(li);
    });

    // Ringkasan cepat (panel kanan)
    const summaryWrap = document.getElementById("bd-summary");
    summaryWrap.innerHTML = "";
    broker.summary.forEach(item => {
        const row = document.createElement("div");
        row.className = "bd-side-item";
        row.innerHTML = `<span>${item.label}</span><span>${item.value}</span>`;
        summaryWrap.appendChild(row);
    });

});