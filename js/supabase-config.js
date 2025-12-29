// Supabase Configuration
const SUPABASE_CONFIG = {
    url: 'https://wxfyhuhsbhvtyfjzxakb.supabase.co',
    key: 'sb_publishable_Hgl9W9c6KNUA2sL9i3PE4g_03X6m5Dh'
};

let supabaseClient = null;

function initializeSupabase() {
    if (!window.supabase) {
        console.error('Supabase library not loaded');
        return null;
    }
    
    supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
    console.log('✅ Supabase initialized for assets');
    return supabaseClient;
}

// Initialize on load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        initializeSupabase();
    });
}