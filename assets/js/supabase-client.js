// ============================================
// SUPABASE CLIENT SETUP
// File ini dipakai bersama oleh semua halaman
// yang butuh koneksi ke Supabase (register, login,
// forgot-password, dashboard, dll)
// ============================================

// Project URL & Publishable Key dari Supabase Dashboard
// Settings > API Keys
const SUPABASE_URL = "https://kkjorptrpkmdgqesspvj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_QjhygCZNYC4-qHKKcjLFiQ_50CfiQeK";

// Buat satu instance client Supabase yang dipakai di seluruh halaman
const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);