# Troubleshooting Guide

This guide helps you resolve common issues with CalorieAI.

## Voice Recording Issues

### "Microphone access denied"
**Problem**: The app cannot access your microphone.

**Solutions**:
1. **Check browser permissions**: Click the lock icon in the address bar and allow microphone access
2. **HTTPS requirement**: Voice recording requires HTTPS. Use a local server:
   ```bash
   cd web
   python -m http.server 8000
   ```
3. **Browser compatibility**: Use Chrome, Firefox, or Edge for best results

### "Recording failed to start"
**Problem**: The record button doesn't work.

**Solutions**:
1. Refresh the page and try again
2. Check browser console for errors (F12 → Console)
3. Ensure no other apps are using the microphone
4. Try a different browser

## AI Integration Issues

### "Failed to initialize Gemini AI"
**Problem**: AI features don't work.

**Solutions**:
1. **Check API key**: Go to Settings (⋮ menu) and verify your Gemini API key
2. **Internet connection**: AI requires internet access
3. **API limits**: Check if you've exceeded Google's API limits
4. **Valid key**: Ensure the API key is from [Google AI Studio](https://aistudio.google.com/app/apikey)

### "Falling back to simulated response"
**Problem**: Getting demo responses instead of real AI.

**Solutions**:
1. Enable "Use Real Gemini AI" in Settings
2. Verify your API key is saved correctly
3. Check internet connection
4. Wait a moment and try again

## Camera/Scanning Issues

### "Camera not accessible"
**Problem**: Cannot scan food labels.

**Solutions**:
1. **Grant permissions**: Allow camera access when prompted
2. **HTTPS requirement**: Camera access requires HTTPS
3. **Mobile device**: Camera works best on mobile devices
4. **Browser support**: Use Chrome or Safari mobile

### "AI failed to process image"
**Problem**: Food label scanning doesn't extract data.

**Solutions**:
1. **Clear photo**: Ensure the nutrition label is well-lit and in focus
2. **Supported formats**: Works best with standard nutrition labels
3. **API key**: Verify Gemini API key is configured
4. **Try manual entry**: Use the + button to add foods manually

## Data Issues

### "Data not saving"
**Problem**: Your data disappears after refresh.

**Solutions**:
1. **Browser storage**: Ensure cookies/local storage aren't blocked
2. **Incognito mode**: Data doesn't persist in incognito/private mode
3. **Storage quota**: Check if device storage is full
4. **Export data**: Use Export feature to backup your data

### "Import failed"
**Problem**: Cannot restore backup data.

**Solutions**:
1. **File format**: Ensure it's a valid JSON export from CalorieAI
2. **File size**: Large files may fail - try smaller exports
3. **Browser limits**: Some browsers limit file upload sizes

## PWA Issues

### "App won't install"
**Problem**: Cannot install as PWA.

**Solutions**:
1. **HTTPS requirement**: PWA installation requires HTTPS
2. **Browser support**: Use Chrome, Edge, or Samsung Internet
3. **Service worker**: Ensure service worker is registered (check console)
4. **Manifest**: Verify web app manifest is accessible

### "Offline mode not working"
**Problem**: App doesn't work without internet.

**Solutions**:
1. **First visit**: Must visit the app online first to cache resources
2. **Service worker**: Check if service worker is active (DevTools → Application)
3. **Cache storage**: Clear cache and try again
4. **Browser support**: Some features require modern browsers

## Performance Issues

### "App is slow"
**Problem**: CalorieAI feels sluggish.

**Solutions**:
1. **Close other tabs**: Free up browser memory
2. **Clear cache**: Clear browser cache and storage
3. **Update browser**: Use the latest browser version
4. **Restart browser**: Sometimes a restart helps

### "Large storage usage"
**Problem**: App is using too much storage.

**Solutions**:
1. **Check storage**: Go to browser settings to see storage usage
2. **Clear old data**: The app automatically cleans up old audio files
3. **Export and reset**: Backup data, clear storage, then import

## Browser Compatibility

### Chrome (Recommended)
- ✅ Full support for all features
- ✅ Best PWA experience
- ✅ Reliable camera and microphone access

### Firefox
- ✅ Full support for core features
- ⚠️ PWA installation limited
- ✅ Camera and microphone access

### Safari
- ✅ Core functionality works
- ⚠️ PWA features limited
- ✅ Mobile camera access

### Edge
- ✅ Full support similar to Chrome
- ✅ Good PWA experience

## Getting Help

If these solutions don't work:

1. **Check the console**: Press F12 → Console tab for error messages
2. **Browser info**: Note your browser and OS version
3. **Steps to reproduce**: Describe exactly what you're doing
4. **Screenshots**: Include screenshots of errors
5. **Export logs**: If possible, export your data for analysis

## Development Mode

For developers troubleshooting issues:

```javascript
// Check service worker status
navigator.serviceWorker.getRegistrations().then(console.log);

// Check storage usage
navigator.storage.estimate().then(console.log);

// Test AI connection
window.app.ai.testConnection();

// Clear all data
window.app.storage.clearAllData();
```

## Common Error Messages

- **"DOMException: Permission denied"**: Microphone/camera permission issue
- **"Failed to fetch"**: Network connectivity problem
- **"Quota exceeded"**: Storage limit reached
- **"Service worker registration failed"**: HTTPS or file protocol issue
- **"Invalid API key"**: Gemini API key problem