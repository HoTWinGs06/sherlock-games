/* ===========================================================================
   supabase-config.js — WHERE THE BACKEND LIVES (safe to commit).
   The anon key is a PUBLIC key by design in Supabase architectures: it
   identifies the project, it does not authorize data. Every sensitive rule
   lives in Row Level Security + the verify-answer edge function.
   Fill url + anonKey from: Supabase Dashboard → Project Settings → API.
   Left empty, the whole points layer silently disables — the site plays
   exactly as before (pure local vault logic).
   ======================================================================== */
window.SUPABASE_CONFIG = {
    url: 'https://sdwlikvhhoamsrrtxtvr.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkd2xpa3ZoaG9hbXNycnR4dHZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0MTg5MDQsImV4cCI6MjEwODk5NDkwNH0.56Md_LBydoyRdGtF-60bFv_fmRu7JJl8S384XA5l5MI'
};