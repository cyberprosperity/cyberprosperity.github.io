// ==========================================
// Trading Journal - CRUD via Supabase
// Tabel: trading_journal
// Kolom yang dipakai: id, user_id, trade_date, pair,
//   position_type (buy/sell), entry_price, exit_price,
//   lot_size, profit_loss, notes, created_at
// CATATAN: sesuaikan nama kolom di bawah ini kalau nama
// kolom di file SQL migrasi kamu berbeda.
// ==========================================

const journalFeed        = document.getElementById("journalFeed");
const journalEmptyState  = document.getElementById("journalEmptyState");
const journalModal       = document.getElementById("journalModal");
const journalModalTitle  = document.getElementById("journalModalTitle");
const journalAddBtn      = document.getElementById("journalAddBtn");
const journalCancelBtn   = document.getElementById("journalCancelBtn");
const journalSubmitBtn   = document.getElementById("journalSubmitBtn");
const journalEditId      = document.getElementById("journalEditId");

const statTotalTrades = document.getElementById("statTotalTrades");
const statTotalProfit = document.getElementById("statTotalProfit");
const statTotalLoss   = document.getElementById("statTotalLoss");
const statWinRate     = document.getElementById("statWinRate");

let currentUserId = null;

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
    await loadJournal();
}

// ==========================================
// LOAD & RENDER
// ==========================================

async function loadJournal() {
    const { data, error } = await supabaseClient
        .from("trading_journal")
        .select("*")
        .eq("user_id", currentUserId)
        .order("trade_date", { ascending: false });

    if (error) {
        console.error("Gagal memuat journal:", error.message);
        return;
    }

    renderFeed(data || []);
    renderStats(data || []);
}

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
    document.getElementById("journalPL").value = "";
    document.getElementById("journalNotes").value = "";
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
    document.getElementById("journalPL").value    = row.profit_loss;
    document.getElementById("journalNotes").value = row.notes || "";

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
    const pl     = document.getElementById("journalPL").value;
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
        entry_price: entry ? Number(entry) : null,
        exit_price: exit_ ? Number(exit_) : null,
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

initJournal();