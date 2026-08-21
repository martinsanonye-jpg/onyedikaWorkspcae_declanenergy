# Dropbox OAuth Setup Guide

## Overview
Your CloudVault app now uses Dropbox OAuth 2.0 for automatic token management. This means:
- ✅ Tokens automatically refresh when expired
- ✅ No more hardcoded tokens in your code
- ✅ Secure offline access with refresh tokens
- ✅ Better security practices

## Step 1: Create Dropbox App

1. Go to [Dropbox Developers Console](https://www.dropbox.com/developers/apps)
2. Click **"Create app"**
3. Choose:
   - **API**: Scoped API
   - **Access type**: App folder
   - **App name**: CloudVault (or your choice)
4. Click **"Create app"**

## Step 2: Configure OAuth Settings

1. In your app settings, go to **"OAuth 2"** section
2. Set **Redirect URIs** to:
   ```
   http://localhost/AdsUpload/oauth-callback.html
   ```
   (Or your actual domain: `https://yourdomain.com/AdsUpload/oauth-callback.html`)

3. Under **Scopes**, make sure these are enabled:
   - `files.metadata.read`
   - `files.content.read`
   - `files.content.write`
   - `sharing.write`

4. Copy your **App key (Client ID)** - you'll need this

## Step 3: Update OAuth Handler

Edit `dropbox-oauth-handler.js` and replace:

```javascript
const DROPBOX_CLIENT_ID = 'YOUR_DROPBOX_CLIENT_ID'; // <- Replace this
```

With your actual Client ID from the Dropbox Console.

If hosting on a different domain, also update:
```javascript
const DROPBOX_REDIRECT_URI = window.location.origin + '/AdsUpload/oauth-callback.html';
```

## Step 4: First Login

1. Open `index.html` in your browser
2. When you try to upload a file, the app will redirect to Dropbox login
3. Authorize CloudVault to access your Dropbox
4. You'll be redirected back and can start uploading

## How It Works

### First Time:
1. User clicks "Upload All"
2. App checks for stored token
3. No token found → Redirects to Dropbox OAuth
4. User authorizes → Receives access + refresh token
5. Tokens stored securely in localStorage

### Subsequent Times:
1. User clicks "Upload All"
2. App gets token from storage
3. If expired → Automatically refreshes using refresh token
4. Upload proceeds with fresh token

### Token Storage:
- `dropbox_access_token` - Current access token (short-lived, ~4 hours)
- `dropbox_refresh_token` - Refresh token (long-lived, months)
- `dropbox_token_expiry` - Token expiration time

## Testing

### Test Normal Upload:
1. Add files to queue
2. Click "Upload All"
3. Files should upload and appear in Database Files

### Test Token Refresh:
1. Open browser console (F12)
2. Run:
   ```javascript
   localStorage.setItem('dropbox_token_expiry', '0');
   ```
3. Try uploading again
4. Should see "[OAUTH] Token refreshed successfully" in console

### Test New Login:
1. Open browser console (F12)
2. Run:
   ```javascript
   localStorage.clear();
   ```
3. Try uploading
4. Should redirect to Dropbox login

## Troubleshooting

**"CSRF attack" error:**
- Clear browser localStorage: `localStorage.clear()`
- Try uploading again

**"Token refresh failed" error:**
- Check Dropbox app scopes are correct
- Verify Client ID is correct in `dropbox-oauth-handler.js`
- Clear localStorage and re-authorize

**"Redirect URI doesn't match" error:**
- Verify redirect URI in Dropbox Console matches exactly
- Must be `http://localhost/...` for local testing
- Must be `https://yourdomain.com/...` for production

**Files not uploading after OAuth:**
- Check browser console for error messages
- Verify scopes include `files.content.write`
- Check that redirect HTML file `oauth-callback.html` exists

## Files Created/Modified

- ✅ `dropbox-oauth-handler.js` - OAuth token management
- ✅ `oauth-callback.html` - OAuth redirect handler
- ✅ `index.html` - Updated to use OAuth

## Security Notes

1. **Never** commit real Client IDs to GitHub
2. **Never** hardcode tokens in code
3. Refresh tokens are long-lived - store securely
4. Localhost testing only - use HTTPS in production
5. Consider adding token encryption for localStorage

## Next Steps

1. Update `dropbox-oauth-handler.js` with your Client ID
2. Test locally with `http://localhost`
3. For production, update redirect URI to your domain
4. Deploy to your server

---

**Need help?** Check Dropbox OAuth docs: https://developers.dropbox.com/documentation/oauth/guide
