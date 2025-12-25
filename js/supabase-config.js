// Supabase Configuration
const SUPABASE_CONFIG = {
    url: 'https://hmdemsbqiqlqcggwblvl.supabase.co',
    key: 'sb_publishable_Z9oNxTGDCCz3EZnh6NqySg_QzF6amCN'
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