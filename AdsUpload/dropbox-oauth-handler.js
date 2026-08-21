// Import centralized Dropbox configuration
import DROPBOX_CONFIG from './dropbox-config.js';

/**
 * Get valid Dropbox access token, refreshing if needed
 */
async function getValidDropboxToken() {
    const token = localStorage.getItem(DROPBOX_CONFIG.storage.accessToken);
    const refreshToken = localStorage.getItem(DROPBOX_CONFIG.storage.refreshToken);
    const expiry = parseInt(localStorage.getItem(DROPBOX_CONFIG.storage.tokenExpiry) || '0', 10);
    const now = Date.now();

    // If token exists and not expired (with 5 min buffer), return it
    if (token && now < expiry - 300000) {
        return token;
    }

    // If we have a refresh token, refresh it
    if (refreshToken) {
        try {
            return await refreshAccessToken(refreshToken);
        } catch (error) {
            console.error('[OAUTH] Token refresh failed:', error);
            // If refresh fails, redirect to OAuth login
            initiateOAuthLogin();
            throw new Error('Token refresh failed. Redirecting to login.');
        }
    }

    // No token or refresh token available
    initiateOAuthLogin();
    throw new Error('No valid token. Redirecting to OAuth login.');
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(refreshToken) {
    try {
        let clientSecret = await DROPBOX_CONFIG.getClientSecret();
        const response = await fetch(DROPBOX_CONFIG.oauth.token, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: DROPBOX_CONFIG.clientId,
                client_secret: clientSecret,
            }).toString(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`OAuth refresh failed: ${error.error_description}`);
        }

        const data = await response.json();
        const expiryTime = Date.now() + (data.expires_in * 1000);

        // Store new token and expiry
        localStorage.setItem(DROPBOX_CONFIG.storage.accessToken, data.access_token);
        localStorage.setItem(DROPBOX_CONFIG.storage.tokenExpiry, expiryTime.toString());

        console.log('[OAUTH] ✓ Token refreshed successfully');
        return data.access_token;
    } catch (error) {
        console.error('[OAUTH] Token refresh error:', error);
        throw error;
    }
}

/**
 * Initiate Dropbox OAuth login flow
 */
function initiateOAuthLogin(returnTo) {
    const state = generateRandomString(16);
    sessionStorage.setItem(DROPBOX_CONFIG.storage.oauthState, state);
    if (returnTo) {
        sessionStorage.setItem('dropboxReturnTo', returnTo);
    } else {
        sessionStorage.setItem('dropboxReturnTo', window.location.href);
    }
    window.location.href = DROPBOX_CONFIG.getAuthorizeUrl(state);
}

/**
 * Exchange OAuth code for access token
 */
async function exchangeCodeForToken(code, state) {
    // Verify state
    const storedState = sessionStorage.getItem(DROPBOX_CONFIG.storage.oauthState);
    if (state !== storedState) {
        throw new Error('Invalid state parameter. Possible CSRF attack.');
    }
    sessionStorage.removeItem(DROPBOX_CONFIG.storage.oauthState);

    try {
        let clientSecret = await DROPBOX_CONFIG.getClientSecret();
        const response = await fetch(DROPBOX_CONFIG.oauth.token, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: DROPBOX_CONFIG.redirectUri,
                client_id: DROPBOX_CONFIG.clientId,
                client_secret: clientSecret,
            }).toString(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`OAuth exchange failed: ${error.error_description}`);
        }

        const data = await response.json();
        const expiryTime = Date.now() + (data.expires_in * 1000);

        // Store tokens
        localStorage.setItem(DROPBOX_CONFIG.storage.accessToken, data.access_token);
        if (data.refresh_token) {
            localStorage.setItem(DROPBOX_CONFIG.storage.refreshToken, data.refresh_token);
        }
        localStorage.setItem(DROPBOX_CONFIG.storage.tokenExpiry, expiryTime.toString());

        console.log('[OAUTH] ✓ Token exchange successful');
        return data.access_token;
    } catch (error) {
        console.error('[OAUTH] Token exchange error:', error);
        throw error;
    }
}

/**
 * Clear stored tokens (logout)
 */
function clearDropboxTokens() {
    localStorage.removeItem(DROPBOX_CONFIG.storage.accessToken);
    localStorage.removeItem(DROPBOX_CONFIG.storage.refreshToken);
    localStorage.removeItem(DROPBOX_CONFIG.storage.tokenExpiry);
    console.log('[OAUTH] Dropbox tokens cleared');
}

/**
 * Generate random string for CSRF protection
 */
function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export { getValidDropboxToken, initiateOAuthLogin, exchangeCodeForToken, clearDropboxTokens, DROPBOX_CONFIG };
