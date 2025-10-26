/**
 * IndexedDB Manager
 * Handles large file storage (audio blobs) and offline request queue
 */

class IndexedDBManager {
    constructor() {
        this.dbName = 'CalorieAIDB';
        this.dbVersion = 1;
        this.db = null;
        
        this.stores = {
            AUDIO_FILES: 'audioFiles',
            OFFLINE_REQUESTS: 'offlineRequests',
            METADATA: 'metadata'
        };
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('IndexedDB: Failed to open database');
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB: Database opened successfully');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create audio files store
                if (!db.objectStoreNames.contains(this.stores.AUDIO_FILES)) {
                    const audioStore = db.createObjectStore(this.stores.AUDIO_FILES, {
                        keyPath: 'id'
                    });
                    audioStore.createIndex('recordId', 'recordId', { unique: true });
                    audioStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
                
                // Create offline requests store
                if (!db.objectStoreNames.contains(this.stores.OFFLINE_REQUESTS)) {
                    const requestStore = db.createObjectStore(this.stores.OFFLINE_REQUESTS, {
                        keyPath: 'timestamp'
                    });
                    requestStore.createIndex('status', 'status', { unique: false });
                }
                
                // Create metadata store
                if (!db.objectStoreNames.contains(this.stores.METADATA)) {
                    db.createObjectStore(this.stores.METADATA, {
                        keyPath: 'key'
                    });
                }
                
                console.log('IndexedDB: Database structure created');
            };
        });
    }

    // Audio File Operations
    async storeAudioFile(recordId, audioBlob, metadata = {}) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.AUDIO_FILES], 'readwrite');
            const store = transaction.objectStore(this.stores.AUDIO_FILES);
            
            const audioData = {
                id: this.generateId(),
                recordId: recordId,
                blob: audioBlob,
                size: audioBlob.size,
                type: audioBlob.type,
                timestamp: Date.now(),
                ...metadata
            };
            
            const request = store.add(audioData);
            
            request.onsuccess = () => {
                console.log('IndexedDB: Audio file stored successfully', recordId);
                resolve(audioData.id);
            };
            
            request.onerror = () => {
                console.error('IndexedDB: Failed to store audio file', request.error);
                reject(request.error);
            };
        });
    }

    async getAudioFile(recordId) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.AUDIO_FILES], 'readonly');
            const store = transaction.objectStore(this.stores.AUDIO_FILES);
            const index = store.index('recordId');
            
            const request = index.get(recordId);
            
            request.onsuccess = () => {
                if (request.result) {
                    console.log('IndexedDB: Audio file retrieved', recordId);
                    resolve(request.result);
                } else {
                    console.log('IndexedDB: Audio file not found', recordId);
                    resolve(null);
                }
            };
            
            request.onerror = () => {
                console.error('IndexedDB: Failed to retrieve audio file', request.error);
                reject(request.error);
            };
        });
    }

    async deleteAudioFile(recordId) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.AUDIO_FILES], 'readwrite');
            const store = transaction.objectStore(this.stores.AUDIO_FILES);
            const index = store.index('recordId');
            
            // First find the record
            const getRequest = index.get(recordId);
            
            getRequest.onsuccess = () => {
                if (getRequest.result) {
                    // Delete the record
                    const deleteRequest = store.delete(getRequest.result.id);
                    
                    deleteRequest.onsuccess = () => {
                        console.log('IndexedDB: Audio file deleted', recordId);
                        resolve(true);
                    };
                    
                    deleteRequest.onerror = () => {
                        console.error('IndexedDB: Failed to delete audio file', deleteRequest.error);
                        reject(deleteRequest.error);
                    };
                } else {
                    resolve(false);
                }
            };
            
            getRequest.onerror = () => {
                reject(getRequest.error);
            };
        });
    }

    async getAllAudioFiles() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.AUDIO_FILES], 'readonly');
            const store = transaction.objectStore(this.stores.AUDIO_FILES);
            
            const request = store.getAll();
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Offline Request Queue Operations
    async queueOfflineRequest(requestData) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.OFFLINE_REQUESTS], 'readwrite');
            const store = transaction.objectStore(this.stores.OFFLINE_REQUESTS);
            
            const queueItem = {
                timestamp: Date.now(),
                status: 'queued',
                retryCount: 0,
                ...requestData
            };
            
            const request = store.add(queueItem);
            
            request.onsuccess = () => {
                console.log('IndexedDB: Request queued for offline sync');
                resolve(queueItem.timestamp);
            };
            
            request.onerror = () => {
                console.error('IndexedDB: Failed to queue request', request.error);
                reject(request.error);
            };
        });
    }

    async getQueuedRequests() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.OFFLINE_REQUESTS], 'readonly');
            const store = transaction.objectStore(this.stores.OFFLINE_REQUESTS);
            const index = store.index('status');
            
            const request = index.getAll('queued');
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async updateRequestStatus(timestamp, status, data = {}) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.OFFLINE_REQUESTS], 'readwrite');
            const store = transaction.objectStore(this.stores.OFFLINE_REQUESTS);
            
            const getRequest = store.get(timestamp);
            
            getRequest.onsuccess = () => {
                if (getRequest.result) {
                    const item = getRequest.result;
                    item.status = status;
                    item.updatedAt = Date.now();
                    
                    if (data) {
                        Object.assign(item, data);
                    }
                    
                    const putRequest = store.put(item);
                    
                    putRequest.onsuccess = () => {
                        resolve(item);
                    };
                    
                    putRequest.onerror = () => {
                        reject(putRequest.error);
                    };
                } else {
                    reject(new Error('Request not found'));
                }
            };
            
            getRequest.onerror = () => {
                reject(getRequest.error);
            };
        });
    }

    async removeRequest(timestamp) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.OFFLINE_REQUESTS], 'readwrite');
            const store = transaction.objectStore(this.stores.OFFLINE_REQUESTS);
            
            const request = store.delete(timestamp);
            
            request.onsuccess = () => {
                resolve(true);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Metadata Operations
    async setMetadata(key, value) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.METADATA], 'readwrite');
            const store = transaction.objectStore(this.stores.METADATA);
            
            const data = {
                key: key,
                value: value,
                timestamp: Date.now()
            };
            
            const request = store.put(data);
            
            request.onsuccess = () => {
                resolve(data);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async getMetadata(key) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.METADATA], 'readonly');
            const store = transaction.objectStore(this.stores.METADATA);
            
            const request = store.get(key);
            
            request.onsuccess = () => {
                if (request.result) {
                    resolve(request.result.value);
                } else {
                    resolve(null);
                }
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Utility methods
    async getStorageUsage() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            return {
                used: estimate.usage,
                quota: estimate.quota,
                percentage: (estimate.usage / estimate.quota) * 100
            };
        }
        return null;
    }

    async cleanupOldFiles(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 days default
        const cutoffTime = Date.now() - maxAge;
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.AUDIO_FILES], 'readwrite');
            const store = transaction.objectStore(this.stores.AUDIO_FILES);
            const index = store.index('timestamp');
            
            const range = IDBKeyRange.upperBound(cutoffTime);
            const request = index.openCursor(range);
            
            let deletedCount = 0;
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    deletedCount++;
                    cursor.continue();
                } else {
                    console.log(`IndexedDB: Cleaned up ${deletedCount} old audio files`);
                    resolve(deletedCount);
                }
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    async close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}

// Export for use in other modules
window.IndexedDBManager = IndexedDBManager;