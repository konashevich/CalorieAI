/**
 * CalorieAI - Cordova Integration Module
 * Bridges Cordova native features with the web app
 */

const CordovaIntegration = {
    /**
     * Initialize Cordova-specific features
     */
    init() {
        console.log('Cordova Integration initializing...');
        
        // Wait for deviceready event
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    /**
     * Called when Cordova is ready
     */
    onDeviceReady() {
        console.log('Cordova device ready!');
        
        // Log device information
        if (window.device) {
            console.log('Device Info:', {
                platform: device.platform,
                version: device.version,
                model: device.model,
                manufacturer: device.manufacturer
            });
        }
        
        // Request permissions first
        this.requestPermissions().then(() => {
            console.log('Permissions requested');
        }).catch((err) => {
            console.error('Error requesting permissions:', err);
        });
        
        // Check network status
        this.checkNetworkStatus();
        
        // Listen for network changes
        document.addEventListener('online', this.onOnline.bind(this), false);
        document.addEventListener('offline', this.onOffline.bind(this), false);
        
        // Listen for pause/resume events
        document.addEventListener('pause', this.onPause.bind(this), false);
        document.addEventListener('resume', this.onResume.bind(this), false);
        
        // Initialize back button handler
        document.addEventListener('backbutton', this.onBackButton.bind(this), false);
        
        console.log('Cordova integration complete!');
    },

    /**
     * Check if running in Cordova
     */
    isCordova() {
        return typeof cordova !== 'undefined';
    },

    /**
     * Check network status
     */
    checkNetworkStatus() {
        if (navigator.connection) {
            const networkState = navigator.connection.type;
            console.log('Network type:', networkState);
            
            if (networkState === Connection.NONE) {
                console.log('No network connection');
                if (window.app && window.app.pwa) {
                    window.app.pwa.handleOffline();
                }
            }
        }
    },

    /**
     * Called when device goes online
     */
    onOnline() {
        console.log('Device is now online');
        if (window.app && window.app.pwa) {
            window.app.pwa.handleOnline();
        }
    },

    /**
     * Called when device goes offline
     */
    onOffline() {
        console.log('Device is now offline');
        if (window.app && window.app.pwa) {
            window.app.pwa.handleOffline();
        }
    },

    /**
     * Called when app goes to background
     */
    onPause() {
        console.log('App paused');
        // Stop any ongoing recordings
        if (window.app && window.app.audio && window.app.audio.isRecording) {
            console.log('Stopping recording due to app pause');
            window.app.audio.stopRecording();
        }
    },

    /**
     * Called when app returns to foreground
     */
    onResume() {
        console.log('App resumed');
        // Refresh data if needed
        if (window.app && window.app.refreshData) {
            window.app.refreshData();
        }
    },

    /**
     * Handle Android back button
     */
    onBackButton(e) {
        e.preventDefault();
        
        // Check if we're on the first tab (Record page)
        if (window.app && window.app.navigation) {
            const currentTab = window.app.navigation.getCurrentTab();
            
            if (currentTab === 'record') {
                // On first tab, exit app or show confirmation
                navigator.app.exitApp();
            } else {
                // Navigate to previous tab
                window.app.navigation.showTab('record');
            }
        } else {
            // Fallback: exit app
            navigator.app.exitApp();
        }
    },

    /**
     * Capture audio using Cordova media capture
     * @param {Function} successCallback - Called with audio file path
     * @param {Function} errorCallback - Called on error
     */
    captureAudio(successCallback, errorCallback) {
        if (!this.isCordova() || !navigator.device || !navigator.device.capture) {
            console.warn('Cordova media capture not available, falling back to web API');
            errorCallback('Cordova not available');
            return;
        }

        const options = {
            limit: 1,
            duration: 3600 // 60 minutes in seconds
        };

        navigator.device.capture.captureAudio(
            function(mediaFiles) {
                console.log('Audio captured:', mediaFiles);
                if (mediaFiles && mediaFiles.length > 0) {
                    successCallback(mediaFiles[0]);
                } else {
                    errorCallback('No audio captured');
                }
            },
            function(error) {
                console.error('Audio capture error:', error);
                errorCallback(error);
            },
            options
        );
    },

    /**
     * Capture image using Cordova camera
     * @param {Function} successCallback - Called with image data
     * @param {Function} errorCallback - Called on error
     */
    captureImage(successCallback, errorCallback) {
        if (!this.isCordova() || !navigator.camera) {
            console.warn('Cordova camera not available, falling back to web API');
            errorCallback('Cordova camera not available');
            return;
        }

        const options = {
            quality: 80,
            destinationType: Camera.DestinationType.DATA_URL,
            sourceType: Camera.PictureSourceType.CAMERA,
            encodingType: Camera.EncodingType.JPEG,
            mediaType: Camera.MediaType.PICTURE,
            correctOrientation: true,
            targetWidth: 1920,
            targetHeight: 1080
        };

        navigator.camera.getPicture(
            function(imageData) {
                console.log('Image captured');
                successCallback('data:image/jpeg;base64,' + imageData);
            },
            function(error) {
                console.error('Camera error:', error);
                errorCallback(error);
            },
            options
        );
    },

    /**
     * Request permissions for camera and microphone
     */
    requestPermissions() {
        if (!this.isCordova()) {
            console.log('Not running in Cordova, skipping permission requests');
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            // Request Android runtime permissions
            if (window.cordova && window.cordova.plugins && window.cordova.plugins.permissions) {
                const permissions = window.cordova.plugins.permissions;
                const list = [];
                // Core permissions
                if (permissions.RECORD_AUDIO) list.push(permissions.RECORD_AUDIO);
                if (permissions.CAMERA) list.push(permissions.CAMERA);
                if (permissions.WRITE_EXTERNAL_STORAGE) list.push(permissions.WRITE_EXTERNAL_STORAGE);
                if (permissions.READ_EXTERNAL_STORAGE) list.push(permissions.READ_EXTERNAL_STORAGE);
                // Android 13+ media read permission (if exposed by plugin)
                if (permissions.READ_MEDIA_AUDIO) list.push(permissions.READ_MEDIA_AUDIO);
                
                const checkPermission = (permission) => {
                    return new Promise((res) => {
                        permissions.checkPermission(permission, (status) => {
                            if (status.hasPermission) {
                                console.log(`Permission ${permission} already granted`);
                                res(true);
                            } else {
                                permissions.requestPermission(permission, (status) => {
                                    if (status.hasPermission) {
                                        console.log(`Permission ${permission} granted`);
                                        res(true);
                                    } else {
                                        console.warn(`Permission ${permission} denied`);
                                        res(false);
                                    }
                                }, () => {
                                    console.error(`Error requesting permission ${permission}`);
                                    res(false);
                                });
                            }
                        }, () => {
                            console.error(`Error checking permission ${permission}`);
                            res(false);
                        });
                    });
                };
                
                Promise.all(list.map(checkPermission)).then((results) => {
                    const allGranted = results.every(r => r === true);
                    if (allGranted) {
                        console.log('All permissions granted');
                        resolve(true);
                    } else {
                        console.warn('Some permissions were not granted');
                        resolve(false);
                    }
                });
            } else {
                // Fallback: Just check if plugins are available
                const hasCamera = typeof navigator.camera !== 'undefined';
                const hasCapture = typeof navigator.device !== 'undefined' && 
                                  typeof navigator.device.capture !== 'undefined';
                
                if (hasCamera && hasCapture) {
                    console.log('Camera and audio capture available');
                    resolve(true);
                } else {
                    console.warn('Some permissions may not be available');
                    resolve(false);
                }
            }
        });
    },

    /**
     * Get file system path for storing data
     */
    getDataDirectory() {
        if (!this.isCordova() || !window.cordova || !window.cordova.file) {
            return null;
        }
        
        return window.cordova.file.dataDirectory;
    }
};

// Auto-initialize if Cordova is present
if (typeof cordova !== 'undefined') {
    CordovaIntegration.init();
} else {
    console.log('Cordova not detected, running in web mode');
}

// Make available globally
window.CordovaIntegration = CordovaIntegration;