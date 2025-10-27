# CalorieAI PWA Testing Guide

## Phase 1B - PWA Enhancement Testing

### 🧪 **Test Checklist**

#### **Service Worker Tests**
- [ ] **Installation**: Service worker registers successfully
- [ ] **Caching**: Static files cached on first load
- [ ] **Offline Mode**: App works without internet connection
- [ ] **Updates**: New service worker activates when available
- [ ] **Background Sync**: Offline requests sync when online

#### **IndexedDB Tests**
- [ ] **Audio Storage**: Large audio files stored in IndexedDB
- [ ] **Metadata**: Audio metadata stored correctly
- [ ] **Retrieval**: Audio files retrieved successfully
- [ ] **Cleanup**: Old files cleaned up automatically
- [ ] **Storage Usage**: Storage usage monitored and reported

#### **PWA Installation Tests**
- [ ] **Install Prompt**: Installation prompt appears
- [ ] **Install Button**: Manual install button works
- [ ] **Standalone Mode**: App runs in standalone mode
- [ ] **App Icons**: Correct icons display in home screen
- [ ] **Splash Screen**: Loading screen appears on startup

#### **Push Notifications Tests**
- [ ] **Permission Request**: Notification permission requested
- [ ] **Subscription**: Push subscription created
- [ ] **Local Notifications**: Manual notifications work
- [ ] **Meal Reminders**: Scheduled reminders function
- [ ] **Notification Actions**: Action buttons work correctly

#### **Processed Foods Tests**
- [ ] **Camera Access**: Camera permission requested and granted
- [ ] **Image Capture**: Camera opens and captures food label images
- [ ] **AI Processing**: Images sent to Gemini AI for processing
- [ ] **Data Extraction**: Nutritional data correctly extracted from labels
- [ ] **Manual Entry**: Add button opens manual entry modal
- [ ] **Food Storage**: Processed foods saved to local storage
- [ ] **Edit/Delete**: Food items can be edited and deleted
- [ ] **Add to Eat**: Foods can be added to daily calorie tracking

## 🌐 **Browser Testing Matrix**

### **Desktop Browsers**
| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| IndexedDB | ✅ | ✅ | ✅ | ✅ |
| PWA Install | ✅ | ⚠️ | ⚠️ | ✅ |
| Push Notifications | ✅ | ✅ | ⚠️ | ✅ |
| MediaRecorder | ✅ | ✅ | ✅ | ✅ |
| Camera API | ✅ | ✅ | ✅ | ✅ |

### **Mobile Browsers**
| Feature | Chrome Mobile | Safari Mobile | Samsung Internet | Firefox Mobile |
|---------|---------------|---------------|------------------|----------------|
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| IndexedDB | ✅ | ✅ | ✅ | ✅ |
| PWA Install | ✅ | ✅ | ⚠️ | ⚠️ |
| Push Notifications | ✅ | ⚠️ | ✅ | ✅ |
| MediaRecorder | ✅ | ✅ | ✅ | ✅ |
| Camera API | ✅ | ✅ | ✅ | ✅ |

## 📱 **Mobile Testing Steps**

### **Android Chrome**
1. Open CalorieAI in Chrome
2. Tap menu → "Add to Home screen"
3. Verify app icon on home screen
4. Launch from home screen
5. Test all functionality in standalone mode

### **iOS Safari**
1. Open CalorieAI in Safari
2. Tap share button → "Add to Home Screen"
3. Verify app icon on home screen
4. Launch from home screen
5. Test all functionality in standalone mode

## 🔧 **Developer Testing Tools**

### **Chrome DevTools**
```javascript
// Check service worker status
navigator.serviceWorker.getRegistrations().then(console.log);

// Check cache contents
caches.keys().then(console.log);

// Check IndexedDB
indexedDB.databases().then(console.log);

// Check storage usage
navigator.storage.estimate().then(console.log);

// Test notification permission
Notification.requestPermission().then(console.log);

// Simulate offline
// DevTools → Network → Offline checkbox
```

### **Firefox DevTools**
- Application → Service Workers
- Application → Storage
- Console → Web APIs

### **Testing Commands**
```javascript
// Test PWA features
window.app.pwa.promptInstall();
window.app.pwa.showNotification('Test', 'Testing notifications');
window.app.pwa.scheduleMealReminder('breakfast', 0.1); // 6 minutes

// Test storage
window.app.pwa.checkStorageUsage();
window.app.pwa.cleanupOldData();

// Test offline functionality
window.app.pwa.handleOffline();
window.app.pwa.handleOnline();
```

## 🚨 **Common Issues & Solutions**

### **Service Worker Issues**
- **Problem**: Service worker not registering
- **Solution**: Check HTTPS requirement, file path, CORS headers

### **PWA Install Issues**
- **Problem**: Install prompt not showing
- **Solution**: Verify manifest.json, HTTPS, service worker

### **IndexedDB Issues**
- **Problem**: Storage quota exceeded
- **Solution**: Implement cleanup, request persistent storage

### **Notification Issues**
- **Problem**: Notifications not working
- **Solution**: Check permissions, HTTPS requirement, service worker

## 📊 **Performance Testing**

### **Storage Metrics**
- Audio file size: ~1MB per minute
- Metadata size: ~1KB per record
- Cache size: ~2MB for app assets

### **Network Testing**
- Test on 3G, 4G, WiFi connections
- Test offline → online transitions
- Test background sync delays

### **Battery Testing**
- Monitor battery usage during recording
- Test background sync impact
- Check notification frequency impact

## ✅ **Acceptance Criteria**

### **Core PWA Features**
- [ ] App installs successfully on all major browsers
- [ ] Works offline with full functionality
- [ ] Service worker caches all necessary assets
- [ ] Background sync works when returning online
- [ ] Push notifications function correctly

### **Performance Standards**
- [ ] App loads in <3 seconds on 3G
- [ ] Audio recording starts in <1 second
- [ ] Storage usage stays under device limits
- [ ] Battery usage is reasonable

### **User Experience**
- [ ] Install prompt is intuitive
- [ ] Offline indicator is clear
- [ ] Sync status is visible
- [ ] Error messages are helpful
- [ ] Responsive on all screen sizes

## 🎯 **Next Phase Readiness**

Phase 1B is complete and ready for Phase 2A (Android Conversion) when:

- [ ] All PWA features tested and working
- [ ] Cross-browser compatibility confirmed
- [ ] Performance meets standards
- [ ] User experience is polished
- [ ] Documentation is complete

## 🐛 **Bug Reporting Template**

```
**Bug Title**: 
**Browser**: 
**Device**: 
**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Result**: 
**Actual Result**: 
**Console Errors**: 
**Screenshots**: 
```