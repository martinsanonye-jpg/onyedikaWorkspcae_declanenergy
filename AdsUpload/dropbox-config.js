// Dropbox Configuration URLs
// Centralized configuration for all Dropbox OAuth and API endpoints

const DROPBOX_CONFIG = {
    // OAuth App Credentials (from Dropbox Console)
    clientId: 'iq8nqdjxu520iz2', // Replace with your Client ID
    clientSecret: 'sawub9h343wgt5m', // Leave empty to prompt; or paste your Client Secret
    
    // OAuth Endpoints
    oauth: {
        authorize: 'https://www.dropbox.com/oauth2/authorize',
        token: 'https://api.dropboxapi.com/oauth2/token',
    },
    
    // Redirect URIs (must match Dropbox Console settings)
    redirectUri: (() => {
        // Automatically detect redirect URI based on current location
        return window.location.href.substring(0, window.location.href.lastIndexOf('/')) + '/oauth-callback.html';
    })(),
    
    // API Endpoints
    api: {
        fileUpload: 'https://content.dropboxapi.com/2/files/upload',
        fileDelete: 'https://api.dropboxapi.com/2/files/delete_v2',
        createSharedLink: 'https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings',
        getTemporaryLink: 'https://api.dropboxapi.com/2/files/get_temporary_link',
        listSharedLinks: 'https://api.dropboxapi.com/2/sharing/list_shared_links',
        getUserAccount: 'https://api.dropboxapi.com/2/users/get_current_account',
    },
    
    // Storage Keys for localStorage
    storage: {
        accessToken: 'dropbox_access_token',
        refreshToken: 'dropbox_refresh_token',
        tokenExpiry: 'dropbox_token_expiry',
        oauthState: 'dropbox_oauth_state',
    },
    
    // OAuth Settings
    scopes: {
        // Request offline access for refresh tokens
        tokenAccessType: 'offline',
        // Response type for authorization code flow
        responseType: 'code',
    },
    
    // Upload Configuration
    upload: {
        path: (fileType, fileName) => `/ads/${fileType}/${Date.now()}_${fileName}`,
        mode: 'add',
        autorename: true,
        mute: false,
    },
    
    // Share Link Configuration
    shareLink: {
        visibility: 'public',
        dlParam: { remove: '?dl=0', add: '?dl=1' },
    },
    
    // Validation
    isConfigured: function() {
        if (!this.clientId || this.clientId === 'YOUR_DROPBOX_CLIENT_ID') {
            console.error('[DROPBOX_CONFIG] Client ID is not configured');
            return false;
        }
        return true;
    },
    
    // Helper: Get client secret (hardcoded or prompt)
    getClientSecret: async function() {
        if (this.clientSecret) {
            return this.clientSecret;
        }
        const secret = window.prompt('Enter your Dropbox Client Secret (will not be saved):');
        if (!secret) {
            throw new Error('Client secret is required for Dropbox OAuth');
        }
        return secret;
    },
    
    // Helper: Build OAuth authorize URL
    getAuthorizeUrl: function(state) {
        const url = new URL(this.oauth.authorize);
        url.searchParams.append('client_id', this.clientId);
        url.searchParams.append('response_type', this.scopes.responseType);
        url.searchParams.append('redirect_uri', this.redirectUri);
        url.searchParams.append('state', state);
        url.searchParams.append('token_access_type', this.scopes.tokenAccessType);
        return url.toString();
    },
    
    // Helper: Get upload path
    getUploadPath: function(fileType, fileName) {
        return this.upload.path(fileType, fileName);
    },
    
    // Helper: Get share link from raw URL
    getShareableUrl: function(url) {
        if (!url) return null;
        return url.replace(this.shareLink.dlParam.remove, this.shareLink.dlParam.add);
    },
};

export default DROPBOX_CONFIG;
