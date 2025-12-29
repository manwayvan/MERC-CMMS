// MERC-CMMS Configuration
// Update these with your Supabase credentials

const CONFIG = {
    // Supabase Configuration
    // Get these from: https://supabase.com/dashboard → Your Project → Settings → API
    SUPABASE_URL: 'https://wxfyhuhsbhvtyfjzxakb.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_Hgl9W9c6KNUA2sL9i3PE4g_03X6m5Dh',
    
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
