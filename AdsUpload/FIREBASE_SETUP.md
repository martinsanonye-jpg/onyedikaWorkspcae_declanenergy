# CloudVault - Firebase Setup Guide

## Overview
CloudVault now uses Firebase Realtime Database and Storage for file management. Files are uploaded to Firebase Storage and URLs are saved to the Realtime Database under the `quadraticDanielOdum` root reference with three ad type categories: **banner**, **fullimage**, and **video**.

## Features
✅ Upload files to Firebase Storage  
✅ Auto-save URLs to Firebase Realtime Database  
✅ Three ad type references (banner, fullimage, video)  
✅ Update existing files (not create duplicates)  
✅ View all files in database  
✅ Delete files from both Storage and Database  
✅ File type selection for ads  

---

## Setup Instructions

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add Project** or select existing project
3. Enable Google Analytics (optional)
4. Click **Create Project**

### Step 2: Get Firebase Credentials
1. In your Firebase project, go to **Project Settings** (⚙️ icon)
2. Scroll to **Your apps** section
3. Click **Web** icon to add a web app
4. Register your app and copy the config
5. You'll get a config like this:
```javascript
{
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
}
```

### Step 3: Update firebase-config.js
Replace the credentials in `firebase-config.js`:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### Step 4: Enable Firebase Storage
1. In Firebase Console, go to **Storage**
2. Click **Get Started**
3. Accept security rules and continue
4. Select a location (closest to your users)

### Step 5: Enable Firebase Realtime Database
1. In Firebase Console, go to **Realtime Database**
2. Click **Create Database**
3. Choose location and click **Next**
4. Select **Test Mode** (for development) or **Locked Mode** (for production)
5. Click **Enable**

### Step 6: Set Security Rules (Important!)

**For Development (Test Mode):**
1. Go to **Realtime Database > Rules**
2. Replace with:
```json
{
  "rules": {
    "quadraticDanielOdum": {
      ".read": true,
      ".write": true
    }
  }
}
```

**For Storage (Development):**
1. Go to **Storage > Rules**
2. Replace with:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /quadraticDanielOdum/{allPaths=**} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

⚠️ **WARNING:** These are open rules for testing only. For production, implement proper authentication!

### Step 7: Serve Your App
```bash
# Using Python 3
python -m http.server 8000

# Or using Node.js with http-server
npx http-server

# Or using PHP
php -S localhost:8000
```

Then open: `http://localhost:8000`

---

## How It Works

### File Upload Process
1. User selects file type (Banner, Full Image, or Video)
2. User chooses file(s)
3. User clicks "Upload All Files"
4. App uploads file to Firebase Storage: `quadraticDanielOdum/{adType}/{filename}`
5. App saves URL to Realtime Database: `quadraticDanielOdum/{adType}`
6. If file for that ad type exists, it's replaced (updated, not duplicated)

### Database Structure
```
quadraticDanielOdum/
├── banner/
│   ├── filename: "logo.png"
│   ├── url: "https://firebasestorage.googleapis.com/..."
│   ├── type: "image/png"
│   ├── size: 102400
│   └── uploadedAt: 1708345200000
├── fullimage/
│   ├── filename: "promo.jpg"
│   ├── url: "https://firebasestorage.googleapis.com/..."
│   ├── type: "image/jpeg"
│   ├── size: 2097152
│   └── uploadedAt: 1708345300000
└── video/
    ├── filename: "ad.mp4"
    ├── url: "https://firebasestorage.googleapis.com/..."
    ├── type: "video/mp4"
    ├── size: 52428800
    └── uploadedAt: 1708345400000
```

### View Database Files
1. Click **"View Database Files"** button
2. See all uploaded ad files with:
   - Filename
   - File size
   - File type
   - Upload timestamp
   - Download link
3. Click **Delete** to remove file

### Delete Files
1. Click **"View Database Files"**
2. Click **Delete** button next to file
3. Confirm deletion
4. File is removed from both Storage and Database

---

## Supported File Types

| Ad Type | Supported Formats |
|---------|------------------|
| Banner | JPG, PNG, GIF, WebP |
| Full Image | JPG, PNG, GIF, WebP, BMP |
| Video | MP4, WebM, OGG, MOV, AVI |

---

## Important Notes

### Only 3 References Maintained
- Only one file per ad type is stored
- Uploading a new banner replaces the old one
- No duplicate files created

### File URLs
- All uploaded file URLs are public and can be accessed directly
- URLs are stored in Realtime Database for quick access
- Files can be accessed via Firebase Storage or database URL

### Storage Quotas
- Firebase free tier: 5GB Storage + 1GB Downloads/day
- Realtime Database: 100 concurrent connections

---

## Troubleshooting

### Firebase SDK Error
**Problem:** "firebase is not defined"  
**Solution:** Ensure `firebase-config.js` is loaded before `app.js` in HTML

### Upload Fails
**Problem:** Upload shows error  
**Solution:** 
- Check Firebase credentials are correct
- Verify Storage and Database are enabled
- Check security rules allow writes

### Can't View Database Files
**Problem:** Database button doesn't show files  
**Solution:**
- Verify Realtime Database is enabled
- Check security rules allow reads
- Ensure files are uploaded to correct path

### Delete Not Working
**Problem:** Delete button doesn't remove file  
**Solution:**
- Check Firebase Storage and Database have delete permissions
- Verify file path is correct

---

## Upgrading to Production

When moving to production:

1. **Set up proper authentication** (Google, Facebook, etc.)
2. **Implement strict security rules**
3. **Set file size limits**
4. **Monitor storage quotas**
5. **Implement error tracking**
6. **Enable backups**

Example production rules:
```json
{
  "rules": {
    "quadraticDanielOdum": {
      ".read": "auth != null",
      ".write": "auth != null && auth.uid == 'YOUR_ADMIN_UID'"
    }
  }
}
```

---

## Support

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Console](https://console.firebase.google.com/)
- [Security Rules Guide](https://firebase.google.com/docs/rules)

---

**CloudVault v2.0.0 - Firebase Edition**
