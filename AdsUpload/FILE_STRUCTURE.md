# CloudVault - File Index & Documentation Guide

## 📁 Active Application Files

### Core HTML Files
| File | Purpose | Required |
|------|---------|----------|
| `index.html` | Main app - UI & upload logic | ✅ YES |
| `auth.html` | Firebase authentication page | ✅ YES |
| `oauth-callback.html` | Dropbox OAuth redirect handler | ✅ YES |

### Configuration Files
| File | Purpose | Required |
|------|---------|----------|
| `dropbox-config.js` | All Dropbox URLs, endpoints, storage keys | ✅ YES |
| `dropbox-oauth-handler.js` | OAuth token lifecycle management | ✅ YES |
| `navigation-config.js` | Centralized navigation URLs | ✅ YES |

### Styling
| File | Purpose | Required |
|------|---------|----------|
| `styles.css` | App UI styling and theme | ✅ YES |

### Documentation
| File | Purpose | Description |
|------|---------|-------------|
| `README.md` | **START HERE** | Complete app overview, setup guide, troubleshooting |
| `DROPBOX_OAUTH_SETUP.md` | Dropbox OAuth configuration | Detailed step-by-step Dropbox app setup |
| `FIREBASE_SETUP.md` | Firebase configuration | Firebase project and authentication setup |

---

## 🎯 Quick Navigation

### New Users
1. **Start with:** `README.md` - Get overview and quick start
2. **Setup Dropbox:** `DROPBOX_OAUTH_SETUP.md` - Create Dropbox app
3. **Setup Firebase:** `FIREBASE_SETUP.md` - Configure Firebase
4. **Run app:** Open `index.html` with Live Server

### Developers
- **Configuration:** Edit `dropbox-config.js`, `navigation-config.js`
- **Authentication:** See `dropbox-oauth-handler.js`
- **UI Logic:** See `index.html` (main app script)
- **Styling:** Edit `styles.css`

### Integration
- **Dropbox API:** All URLs in `dropbox-config.js`
- **Firebase:** Credentials in `index.html` script block
- **Navigation:** All redirects in `navigation-config.js`

---

## 📊 Dependencies

### External Services
- **Dropbox API** (OAuth 2.0)
  - Files upload/delete
  - Share link creation
  - Requires: Client ID, Client Secret

- **Firebase** (Authentication & Realtime Database)
  - User authentication (Google Sign-In)
  - Metadata storage
  - Requires: Firebase credentials

### JavaScript Libraries (CDN)
- Firebase App SDK
- Firebase Auth
- Firebase Realtime Database

### Browser APIs
- localStorage (token storage)
- fetch API (HTTP requests)
- File API (drag & drop)
- URLSearchParams (query parsing)

---

## 🔧 Configuration Checklist

Before running the app, configure these:

### Dropbox Setup
- [ ] Create Dropbox app at https://www.dropbox.com/developers/apps
- [ ] Get Client ID and Client Secret
- [ ] Set redirect URI: `http://localhost:5500/AdsUpload/oauth-callback.html`
- [ ] Add to `dropbox-config.js`:
  ```javascript
  clientId: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET'
  ```

### Firebase Setup
- [ ] Create Firebase project at https://console.firebase.google.com
- [ ] Enable Google Sign-In in Authentication
- [ ] Create Realtime Database
- [ ] Update credentials in `index.html`:
  ```javascript
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    // ... other fields
  };
  ```

### App Configuration
- [ ] Update `AUTHORIZED_EMAIL` in `index.html` to your email
- [ ] Test local: `http://localhost:5500/AdsUpload/index.html`

---

## 🚀 File Usage in App

### How files are loaded:

```
index.html (entry point)
├── imports NAVIGATION_CONFIG from navigation-config.js
├── imports OAuth handler from dropbox-oauth-handler.js
│   └── imports DROPBOX_CONFIG from dropbox-config.js
├── links styles.css
└── contains Firebase setup and upload logic

auth.html (authentication)
├── links styles.css
└── Firebase Google Sign-In logic

oauth-callback.html (Dropbox auth callback)
├── imports NAVIGATION_CONFIG from navigation-config.js
├── imports OAuth handler from dropbox-oauth-handler.js
│   └── imports DROPBOX_CONFIG from dropbox-config.js
└── exchanges auth code for tokens
```

---

## 📝 File Deletion History

**Removed (Not Used):**
- `index copy.html` - Duplicate backup file
- `styles_new.css` - Old unused stylesheet
- `firebase-stub.js` - Stub file not imported
- `google-drive.js` - Google Drive integration (inactive)
- `delete/` - Old directory
- Multiple outdated .md files (consolidated into main README.md)

---

## 💾 Storage Structure

### Browser localStorage
```javascript
dropbox_access_token      // Current access token (~4 hours)
dropbox_refresh_token     // Refresh token (long-lived)
dropbox_token_expiry      // Token expiration timestamp
```

### Dropbox Storage
```
/ads/
├── all/              // All file types
├── banner/           // Banner images
├── fullimage/        // Full-size images
└── video/            // Video files
```

### Firebase Database
```
ads/
├── all/              // All files metadata
├── banner/           // Banner metadata
├── fullimage/        // Image metadata
└── video/            // Video metadata
```

---

## 🔍 Key Functions by File

### `index.html`
- `showMainFor(email)` - Display main app for user
- `addFilesToQueue(files)` - Add files to upload queue
- `updateFileList()` - Refresh file list display
- `loadDatabaseFiles()` - Load files from Firebase
- Upload handler with Dropbox + Firebase logic

### `dropbox-oauth-handler.js`
- `getValidDropboxToken()` - Get/refresh token
- `refreshAccessToken()` - Refresh using refresh token
- `initiateOAuthLogin()` - Start OAuth login
- `exchangeCodeForToken()` - Exchange code for tokens
- `clearDropboxTokens()` - Clear stored tokens

### `dropbox-config.js`
- OAuth endpoints configuration
- API endpoints configuration
- `getAuthorizeUrl()` - Build OAuth URL
- `getUploadPath()` - Generate Dropbox path
- `getShareableUrl()` - Convert to shareable link

### `navigation-config.js`
- Page URLs configuration
- `redirectAfterOAuth()` - Redirect after OAuth
- `redirectToAuth()` - Go to login
- Other navigation helpers

---

## ✅ Verification

Run these commands to verify setup:

```bash
# Check all required files exist
ls -la index.html auth.html oauth-callback.html
ls -la dropbox-config.js dropbox-oauth-handler.js navigation-config.js
ls -la styles.css

# Check no unused files remain
ls *.html *.js *.css *.md
```

All files should be listed above with no extras.

---

**Last Updated:** February 25, 2026
**Version:** 2.0 (Clean Release)
