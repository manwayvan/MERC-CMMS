// Shared authentication utilities for static pages

(function () {
    const defaultUrl = 'https://hmdemsbqiqlqcggwblvl.supabase.co';
    const defaultKey = 'sb_publishable_Z9oNxTGDCCz3EZnh6NqySg_QzF6amCN';

    const supabaseUrl = typeof CONFIG !== 'undefined' && CONFIG.SUPABASE_URL
        ? CONFIG.SUPABASE_URL
        : defaultUrl;
    const supabaseKey = typeof CONFIG !== 'undefined' && CONFIG.SUPABASE_ANON_KEY
        ? CONFIG.SUPABASE_ANON_KEY
        : defaultKey;

    // Initialize Supabase client - wait for library to load if needed
    function initSupabaseClient() {
        if (window.supabase) {
            const client = window.supabase.createClient(supabaseUrl, supabaseKey);
            window.sharedSupabaseClient = client;
            return client;
        }
        return null;
    }

    // Initialize client - wait for DOMContentLoaded to ensure Supabase script is loaded
    let client = null;
    
    function initializeClient() {
        if (!client) {
            client = initSupabaseClient();
        }
        return client;
    }

    // Try to initialize immediately if Supabase is already loaded
    client = initSupabaseClient();

    const isLoginPage = () => window.location.pathname.endsWith('login.html');

    const requireAuth = async () => {
        // Ensure client is initialized
        if (!client) {
            client = initializeClient();
        }
        
        if (!client || isLoginPage()) {
            return;
        }

        try {
            const { data } = await client.auth.getSession();
            if (!data?.session) {
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Error checking auth session:', error);
            window.location.href = 'login.html';
        }
    };

    const setupLogout = () => {
        const logoutButton = document.getElementById('logout-button');
        if (!logoutButton) return;

        logoutButton.addEventListener('click', async () => {
            // Ensure client is initialized
            if (!client) {
                client = initializeClient();
            }
            
            if (client?.auth?.signOut) {
                try {
                    await client.auth.signOut();
                } catch (error) {
                    console.error('Error signing out:', error);
                }
            }
            window.location.href = 'login.html';
        });
    };

    // Wait for DOMContentLoaded to ensure Supabase script is loaded
    document.addEventListener('DOMContentLoaded', () => {
        // Initialize client if not already done
        if (!client) {
            client = initializeClient();
        }
        
        setupLogout();
        requireAuth();
    });
})();
