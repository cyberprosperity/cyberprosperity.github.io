// ==========================================
// Trading Journal - CRUD via Supabase
// ==========================================

const journalFeed        = document.getElementById("journalFeed");
const journalEmptyState  = document.getElementById("journalEmptyState");
const journalModal       = document.getElementById("journalModal");
const journalModalTitle  = document.getElementById("journalModalTitle");
const journalAddBtn      = document.getElementById("journalAddBtn");
const journalCancelBtn   = document.getElementById("journalCancelBtn");
const journalSubmitBtn   = document.getElementById("journalSubmitBtn");
const journalEditId      = document.getElementById("journalEditId");
const journalPLInput     = document.getElementById("journalPL");

const statTotalTrades = document.getElementById("statTotalTrades");
const statTotalProfit = document.getElementById("statTotalProfit");
const statTotalLoss   = document.getElementById("statTotalLoss");
const statWinRate     = document.getElementById("statWinRate");

const journalSortSelect  = document.getElementById("journalSortSelect");
const journalMonthFilter = document.getElementById("journalMonthFilter");

let currentUserId = null;
let allTrades = [];   // cache seluruh data dari Supabase (belum difilter/disortir)

// ==========================================
// INIT
// ==========================================

async function initJournal() {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUserId = user.id;

    journalSortSelect.addEventListener("change", applyFilterAndSort);
    journalMonthFilter.addEventListener("change", applyFilterAndSort);

    await loadJournal();
}

// ==========================================
// LOAD (fetch mentah dari Supabase, sekali saja)
// ==========================================

async function loadJournal() {
    const { data, error } = await supabaseClient
        .from("trading_journal")
        .select("*")
        .eq("user_id", currentUserId);

    if (error) {
        console.error("Gagal memuat journal:", error.message);
        return;
    }

    allTrades = data || [];

    // Statistik SELALU dari seluruh data (tidak ikut filter bulan),
    // supaya angka total tetap mencerminkan keseluruhan riwayat.
    renderStats(allTrades);

    populateMonthFilter(allTrades);
    applyFilterAndSort();
}

// ==========================================
// FILTER BULAN & SORTIR (di sisi client)
// ==========================================

function populateMonthFilter(rows) {
    const monthSet = new Set();

    rows.forEach((row) => {
        if (!row.trade_date) return;
        monthSet.add(row.trade_date.slice(0, 7)); // "YYYY-MM"
    });

    const sortedMonths = Array.from(monthSet).sort((a, b) => (a < b ? 1 : -1));
    const previousValue = journalMonthFilter.value || "all";

    journalMonthFilter.innerHTML = '<option value="all">Semua Bulan</option>';

    sortedMonths.forEach((ym) => {
        const label = new Date(`${ym}-01T00:00:00`).toLocaleDateString("id-ID", {
            month: "long",
            year: "numeric"
        });
        const opt = document.createElement("option");
        opt.value = ym;
        opt.textContent = label;
        journalMonthFilter.appendChild(opt);
    });

    if (Array.from(journalMonthFilter.options).some((o) => o.value === previousValue)) {
        journalMonthFilter.value = previousValue;
    }
}

function applyFilterAndSort() {
    const selectedMonth = journalMonthFilter.value;
    const sortMode = journalSortSelect.value;

    let rows = [...allTrades];

    if (selectedMonth !== "all") {
        rows = rows.filter((row) => row.trade_date && row.trade_date.slice(0, 7) === selectedMonth);
    }

    switch (sortMode) {
        case "date-asc":
            rows.sort((a, b) => new Date(a.trade_date) - new Date(b.trade_date));
            break;
        case "profit-desc":
            rows.sort((a, b) => Number(b.profit_loss) - Number(a.profit_loss));
            break;
        case "loss-desc":
            rows.sort((a, b) => Number(a.profit_loss) - Number(b.profit_loss));
            break;
        case "date-desc":
        default:
            rows.sort((a, b) => new Date(b.trade_date) - new Date(a.trade_date));
            break;
    }

    renderFeed(rows);
}

// ==========================================
// RENDER FEED
// ==========================================

function renderFeed(rows) {
    journalFeed.innerHTML = "";

    if (rows.length === 0) {
        journalEmptyState.style.display = "block";
        return;
    }

    journalEmptyState.style.display = "none";

    rows.forEach((row) => {
        const isPositive = Number(row.profit_loss) >= 0;
        const isBuy = row.position_type === "buy";
        const swap = Number(row.swap) || 0;
        const tax = Number(row.tax) || 0;

        const card = document.createElement("article");
        card.className = "journal-card";

        card.innerHTML = `
            <div class="journal-icon ${row.position_type}">
                <i class="fa-solid ${isBuy ? "fa-arrow-trend-up" : "fa-arrow-trend-down"}"></i>
            </div>

            <div class="journal-card-content">

                <div class="journal-card-top">

                    <div class="journal-card-title">
                        <h3>${escapeHtml(row.pair)}</h3>
                        <span class="journal-badge ${row.position_type}">${row.position_type.toUpperCase()}</span>
                    </div>

                    <div class="journal-card-actions">
                        <span class="journal-card-date">${formatDate(row.trade_date)}</span>
                        <button class="journal-edit-btn" data-id="${row.id}" title="Edit">
                            <i class="fa-regular fa-pen-to-square"></i>
                        </button>
                        <button class="journal-delete-btn" data-id="${row.id}" title="Hapus">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    </div>

                </div>

                <div class="journal-card-meta">
                    <span>Entry ${row.entry_price ?? "-"}</span>
                    <span>Exit ${row.exit_price ?? "-"}</span>
                    <span>Lot ${row.lot_size ?? "-"}</span>
                    ${swap !== 0 ? `<span class="swap-chip">Swap ${swap >= 0 ? "+" : ""}$${swap.toFixed(2)}</span>` : ""}
                    ${tax !== 0 ? `<span class="tax-chip">Tax -$${tax.toFixed(2)}</span>` : ""}
                </div>

                ${row.notes ? `<p class="journal-card-notes">${escapeHtml(row.notes)}</p>` : ""}

                <div class="journal-card-footer">
                    <span class="journal-pl ${isPositive ? "positive" : "negative"}">
                        ${isPositive ? "+" : ""}$${Number(row.profit_loss).toFixed(2)}
                    </span>
                </div>

            </div>
        `;

        journalFeed.appendChild(card);

        card.querySelector(".journal-edit-btn")
            .addEventListener("click", () => openEditModal(row));

        card.querySelector(".journal-delete-btn")
            .addEventListener("click", () => deleteTrade(row.id));
    });
}

function renderStats(rows) {
    const total = rows.length;
    const wins  = rows.filter(r => Number(r.profit_loss) > 0);
    const losses = rows.filter(r => Number(r.profit_loss) < 0);

    const totalProfit = wins.reduce((sum, r) => sum + Number(r.profit_loss), 0);
    const totalLoss   = losses.reduce((sum, r) => sum + Number(r.profit_loss), 0);
    const winRate      = total > 0 ? Math.round((wins.length / total) * 100) : 0;

    statTotalTrades.textContent = total;
    statTotalProfit.textContent = `$${totalProfit.toFixed(2)}`;
    statTotalLoss.textContent   = `$${Math.abs(totalLoss).toFixed(2)}`;
    statWinRate.textContent     = `${winRate}%`;
}

// ==========================================
// KALKULASI OTOMATIS PROFIT/LOSS (NET: termasuk Swap & Tax)
// ==========================================

// Menentukan "contract size" (nilai 1 lot) berdasarkan nama pair.
// XAU (gold)  -> 100 oz per lot
// XAG (silver)-> 5000 oz per lot
// Pair lain (dianggap forex mayor, quote dalam USD) -> 100.000 unit per lot
function detectContractSize(pairRaw) {
    const p = (pairRaw || "").toUpperCase().replace(/[^A-Z]/g, "");
    if (p.includes("XAU")) return 100;
    if (p.includes("XAG")) return 5000;
    return 100000;
}

function computeProfitLoss(pairRaw, type, entry, exit_, lot, swap, tax) {
    if (entry === null || exit_ === null || !lot || lot <= 0) return null;

    const contractSize = detectContractSize(pairRaw);
    let diff = exit_ - entry;

    if (type === "sell") diff = -diff;

    const gross = diff * lot * contractSize;
    const swapVal = Number(swap) || 0;
    const taxVal  = Number(tax) || 0;

    return gross + swapVal - taxVal;
}

// Dipanggil setiap kali Pair/Tipe/Entry/Exit/Lot/Swap/Tax berubah
// di modal. Field Profit/Loss otomatis diisi ulang - kecuali user
// sudah membuka kunci manual (double-click field Profit/Loss).
let plRecalcLocked = false;

function recalculatePL() {
    if (plRecalcLocked) return;

    const pair  = document.getElementById("journalPair").value;
    const type  = document.getElementById("journalType").value;
    const entry = parseDecimal(document.getElementById("journalEntry").value);
    const exit_ = parseDecimal(document.getElementById("journalExit").value);
    const lot   = Number(document.getElementById("journalLot").value);
    const swap  = document.getElementById("journalSwap").value;
    const tax   = document.getElementById("journalTax").value;

    const pl = computeProfitLoss(pair, type, entry, exit_, lot, swap, tax);

    if (pl !== null) {
        journalPLInput.value = pl.toFixed(2);
    }
}

function bindAutoCalc() {
    ["journalPair", "journalType", "journalEntry", "journalExit", "journalLot", "journalSwap", "journalTax"].forEach((id) => {
        const el = document.getElementById(id);
        el.addEventListener("input", recalculatePL);
        el.addEventListener("change", recalculatePL);
    });

    // Double-click pada field Profit/Loss untuk membuka kunci
    // (override manual, misalnya ada penyesuaian khusus dari broker).
    journalPLInput.addEventListener("dblclick", () => {
        plRecalcLocked = true;
        journalPLInput.readOnly = false;
        journalPLInput.classList.remove("journal-pl-readonly");
        journalPLInput.focus();
    });
}

function lockPLField() {
    plRecalcLocked = false;
    journalPLInput.readOnly = true;
    journalPLInput.classList.add("journal-pl-readonly");
}

// ==========================================
// MODAL: ADD / EDIT
// ==========================================

journalAddBtn.addEventListener("click", () => {
    journalModalTitle.textContent = "Tambah Transaksi";
    journalEditId.value = "";
    clearForm();
    journalModal.style.display = "flex";
});

journalCancelBtn.addEventListener("click", closeModal);

function closeModal() {
    journalModal.style.display = "none";
}

function clearForm() {
    document.getElementById("journalDate").value = "";
    document.getElementById("journalPair").value = "";
    document.getElementById("journalType").value = "buy";
    document.getElementById("journalLot").value = "";
    document.getElementById("journalEntry").value = "";
    document.getElementById("journalExit").value = "";
    document.getElementById("journalSwap").value = "";
    document.getElementById("journalTax").value = "";
    journalPLInput.value = "";
    document.getElementById("journalNotes").value = "";
    lockPLField();
}

function openEditModal(row) {
    journalModalTitle.textContent = "Edit Transaksi";
    journalEditId.value = row.id;

    document.getElementById("journalDate").value  = row.trade_date;
    document.getElementById("journalPair").value  = row.pair;
    document.getElementById("journalType").value  = row.position_type;
    document.getElementById("journalLot").value   = row.lot_size;
    document.getElementById("journalEntry").value = row.entry_price;
    document.getElementById("journalExit").value  = row.exit_price;
    document.getElementById("journalSwap").value  = row.swap ?? 0;
    document.getElementById("journalTax").value   = row.tax ?? 0;
    journalPLInput.value = row.profit_loss;
    document.getElementById("journalNotes").value = row.notes || "";

    // Nilai Profit/Loss yang sudah tersimpan dianggap "terkunci" -
    // tidak langsung ditimpa saat modal edit dibuka. Baru dihitung
    // ulang otomatis kalau user mengubah Entry/Exit/Lot/Tipe/Pair/Swap/Tax.
    plRecalcLocked = true;
    journalPLInput.readOnly = true;
    journalPLInput.classList.add("journal-pl-readonly");

    journalModal.style.display = "flex";
}

// ==========================================
// SUBMIT (INSERT / UPDATE)
// ==========================================

journalSubmitBtn.addEventListener("click", async () => {
    const date   = document.getElementById("journalDate").value;
    const pair   = document.getElementById("journalPair").value.trim();
    const type   = document.getElementById("journalType").value;
    const lot    = document.getElementById("journalLot").value;
    const entry  = document.getElementById("journalEntry").value;
    const exit_  = document.getElementById("journalExit").value;
    const swap   = document.getElementById("journalSwap").value;
    const tax    = document.getElementById("journalTax").value;
    const pl     = journalPLInput.value;
    const notes  = document.getElementById("journalNotes").value.trim();

    if (!date || !pair || pl === "") {
        alert("Tanggal, Pair, dan Profit/Loss wajib diisi.");
        return;
    }

    const payload = {
        user_id: currentUserId,
        trade_date: date,
        pair: pair,
        position_type: type,
        lot_size: lot ? Number(lot) : null,
        entry_price: parseDecimal(entry),
        exit_price: parseDecimal(exit_),
        swap: swap ? Number(swap) : 0,
        tax: tax ? Number(tax) : 0,
        profit_loss: Number(pl),
        notes: notes || null,
    };

    const editId = journalEditId.value;

    let error;

    if (editId) {
        ({ error } = await supabaseClient
            .from("trading_journal")
            .update(payload)
            .eq("id", editId)
            .eq("user_id", currentUserId));
    } else {
        ({ error } = await supabaseClient
            .from("trading_journal")
            .insert(payload));
    }

    if (error) {
        console.error("Gagal menyimpan transaksi:", error.message);
        alert("Gagal menyimpan: " + error.message);
        return;
    }

    closeModal();
    await loadJournal();
});

// ==========================================
// DELETE
// ==========================================

async function deleteTrade(id) {
    const confirmed = confirm("Hapus transaksi ini?");
    if (!confirmed) return;

    const { error } = await supabaseClient
        .from("trading_journal")
        .delete()
        .eq("id", id)
        .eq("user_id", currentUserId);

    if (error) {
        console.error("Gagal menghapus transaksi:", error.message);
        alert("Gagal menghapus: " + error.message);
        return;
    }

    await loadJournal();
}

// ==========================================
// HELPERS
// ==========================================

function formatDate(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function parseDecimal(str) {
    if (!str) return null;

    // buang semua karakter selain angka, titik, koma, dan minus
    let cleaned = String(str).trim().replace(/[^0-9.,-]/g, "");

    if (cleaned === "") return null;

    // kalau ada lebih dari satu titik/koma, anggap yang terakhir sebagai desimal
    // dan sisanya sebagai pemisah ribuan yang dibuang
    const lastDot   = cleaned.lastIndexOf(".");
    const lastComma = cleaned.lastIndexOf(",");
    const decimalPos = Math.max(lastDot, lastComma);

    if (decimalPos === -1) {
        const num = Number(cleaned);
        return isNaN(num) ? null : num;
    }

    const wholePart    = cleaned.slice(0, decimalPos).replace(/[.,]/g, "");
    const decimalPart  = cleaned.slice(decimalPos + 1).replace(/[.,]/g, "");
    const normalized   = `${wholePart}.${decimalPart}`;

    const num = Number(normalized);
    return isNaN(num) ? null : num;
}

function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// ==========================================
// START
// ==========================================

bindAutoCalc();
lockPLField();
initJournal();