
let accessToken: string | null = null;

// Function to sync auth
async function checkAuth() {
    console.log('Checking auth...');
    try {
        const cookie = await chrome.cookies.get({ url: 'http://localhost:3000', name: 'refresh_token' }); // Dev URL
        if (!cookie) {
            console.warn('No refresh cookie found.');
            return false;
        }

        // Exchange for JWT
        const res = await fetch('http://localhost:3000/auth/refresh', {
            method: 'POST',
            credentials: 'include' // Important
        });

        if (!res.ok) throw new Error('Refresh failed');

        const data = await res.json();
        accessToken = data.token;
        console.log('Auth synced. Token received.');

        // Store in storage
        await chrome.storage.local.set({ accessToken, user: data.user });

        return true;
    } catch (err) {
        console.error('Auth sync failed', err);
        return false;
    }
}

// Listener for messages from Popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'CHECK_AUTH') {
        checkAuth().then(success => sendResponse({ success }));
        return true; // async response
    }
});

// Initial check
checkAuth();
