// Navigation and Redirect URLs Configuration
// Centralized configuration for all window.location.href redirects

const NAVIGATION_CONFIG = {
    // Main App Pages
    pages: {
        index: './index.html',
        auth: './auth.html',
        oauthCallback: './oauth-callback.html',
    },
    
    // OAuth Redirects
    oauth: {
        successRedirect: './index.html?oauth=success',
        errorBackToApp: './index.html',
    },
    
    // Auth Redirects
    auth: {
        signInPage: './auth.html',
        mainApp: './index.html',
    },
    
    // Helper: Navigate to page
    navigateTo: function(page) {
        window.location.href = page;
    },
    
    // Helper: Redirect after successful OAuth
    redirectAfterOAuth: function() {
        window.location.href = this.oauth.successRedirect;
    },
    
    // Helper: Redirect on OAuth error
    redirectOnOAuthError: function() {
        window.location.href = this.oauth.errorBackToApp;
    },
    
    // Helper: Redirect to auth
    redirectToAuth: function() {
        window.location.href = this.auth.signInPage;
    },
    
    // Helper: Redirect to main app
    redirectToMainApp: function() {
        window.location.href = this.auth.mainApp;
    },
};

export default NAVIGATION_CONFIG;
