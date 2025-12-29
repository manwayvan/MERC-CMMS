// Shared authentication utilities for static pages

(function () {
    const defaultUrl = 'https://wxfyhuhsbhvtyfjzxakb.supabase.co';
    const defaultKey = 'sb_publishable_Hgl9W9c6KNUA2sL9i3PE4g_03X6m5Dh';

    const supabaseUrl = typeof CONFIG !== 'undefined' && CONFIG.SUPABASE_URL
        ? CONFIG.SUPABASE_URL
        : defaultUrl;
    const supabaseKey = typeof CONFIG !== 'undefined' && CONFIG.SUPABASE_ANON_KEY
        ? CONFIG.SUPABASE_ANON_KEY
        : defaultKey;

    const client = window.supabase?.createClient(supabaseUrl, supabaseKey);
    window.sharedSupabaseClient = client || null;

    const isLoginPage = () => window.location.pathname.endsWith('login.html');

    const requireAuth = async () => {
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

    document.addEventListener('DOMContentLoaded', () => {
        setupLogout();
        requireAuth();
    });
})();
