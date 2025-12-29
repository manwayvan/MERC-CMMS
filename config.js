// MERC-CMMS Configuration
// Update these with your Supabase credentials

const CONFIG = {
    // Supabase Configuration
    // Get these from: https://supabase.com/dashboard → Your Project → Settings → API
    SUPABASE_URL: 'https://hmdemsbqiqlqcggwblvl.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_Z9oNxTGDCCz3EZnh6NqySg_QzF6amCN',
    
    // Application Configuration
    APP_NAME: 'MERC-CMMS Enterprise',
    APP_VERSION: '1.0.0',
    
    // Feature Flags
    ENABLE_DEBUG_MODE: false,
    ENABLE_MOCK_DATA: false, // Set to true to use mock data instead of Supabase
};

// Initialize Supabase client
const initSupabase = () => {
    if (!window.supabase) {
        console.error('Supabase library not loaded');
        return null;
    }
    
    return window.supabase.createClient(
        CONFIG.SUPABASE_URL,
        CONFIG.SUPABASE_ANON_KEY
    );
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, initSupabase };
}
