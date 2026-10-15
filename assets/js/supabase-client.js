// ============================================
// SUPABASE CLIENT SETUP
// File ini dipakai bersama oleh semua halaman
// yang butuh koneksi ke Supabase (register, login,
// forgot-password, dashboard, dll)
//
// PROJECT BARU: cfxpros (dibuat 14 Oktober 2026)
// ============================================

// Project URL & Publishable Key dari Supabase Dashboard
// Settings > API Keys
// Catatan: Project URL hanya sampai ".supabase.co",
// TANPA tambahan "/rest/v1/" di belakangnya.
const SUPABASE_URL = "https://ziwzslvxtbpipvicygst.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_2VeNHswnCQpsQh89CJuGVg_GqBf1U-T";

// Buat satu instance client Supabase yang dipakai di seluruh halaman
const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);