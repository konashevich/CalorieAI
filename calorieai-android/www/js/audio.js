/**
 * Audio Manager
 * Handles MediaRecorder API for voice recording functionality, with a fallback to Cordova's Media plugin.
 */

class AudioManager {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.audioStream = null;
        this.isRecording = false;
        this.autoSendAfterStop = false;
        this.recordingTimer = null;
        this.recordingStartTime = null;
        this.microphonePermission = false;
        this.cordovaMedia = null;
        this.cordovaAudioPath = null;
        
        this.elements = {
            recordBtn: document.getElementById('recordBtn'),
            stopBtn: document.getElementById('stopBtn'),
            sendBtn: document.getElementById('sendBtn'),
            recordingStatus: document.getElementById('recordingStatus'),
            recordingTimer: document.getElementById('recordingTimer'),
            recordActions: document.getElementById('recordActions'),
            recordingSection: document.querySelector('.recording-section')
        };

        this.init();
    }

    async init() {
        try {
            this.bindEvents();
        } catch (error) {
            console.error('Audio Manager initialization error:', error);
        }
    }
    
    isCordova() {
        return !!window.cordova;
    }

    bindEvents() {
        if (this.elements.recordBtn) {
            this.elements.recordBtn.addEventListener('click', () => {
                if (this.isRecording) {
                    this.stopRecording();
                } else {
                    this.startRecording();
                }
            });
        }
    }

    async startRecording() {
        if (this.isCordova()) {
            await this.startCordovaRecording();
        } else {
            await this.startWebRecording();
        }
    }

    async startCordovaRecording() {
        try {
            // Request permissions if needed
            if (window.cordova && window.cordova.plugins && window.cordova.plugins.permissions) {
                const permissions = window.cordova.plugins.permissions;
                
                // Check RECORD_AUDIO permission
                const hasPermission = await new Promise((resolve) => {
                    permissions.checkPermission(permissions.RECORD_AUDIO, (status) => {
                        if (status.hasPermission) {
                            resolve(true);
                        } else {
                            // Request permission
                            permissions.requestPermission(permissions.RECORD_AUDIO, (status) => {
                                resolve(status.hasPermission);
                            }, () => resolve(false));
                        }
                    }, () => resolve(false));
                });
                
                if (!hasPermission) {
                    this.showError('Microphone permission is required to record audio.');
                    return;
                }
            }
            
            const fileName = `calorieai_recording_${Date.now()}.wav`;
            this.cordovaAudioPath = cordova.file.dataDirectory + fileName;
    
            this.cordovaMedia = new Media(this.cordovaAudioPath,
                () => console.log('Cordova Media success'),
                (err) => console.error('Cordova Media error:', err)
            );
    
            this.cordovaMedia.startRecord();
            this.isRecording = true;
            this.recordingStartTime = Date.now();
            this.updateRecordingUI();
            this.startTimer();
        } catch (error) {
            console.error('Error starting Cordova recording:', error);
            this.showError('Failed to start recording. Please check your microphone.');
        }
    }
    
    async startWebRecording() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('MediaRecorder API not supported in this browser');
            }

            this.audioStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000
                }
            });

            this.microphonePermission = true;
            const options = this.getSupportedMimeType();
            this.mediaRecorder = new MediaRecorder(this.audioStream, options);
            
            this.audioChunks = [];
            this.recordingStartTime = Date.now();

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => setTimeout(() => this.processRecording(), 100);
            this.mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event.error);
                this.showError('Recording error occurred. Please try again.');
                this.resetRecordingUI();
            };

            this.mediaRecorder.start(1000);
            this.isRecording = true;
            
            this.updateRecordingUI();
            this.startTimer();

        } catch (error) {
            console.error('Error starting recording:', error);
            this.showError('Failed to start recording. Please check your microphone.');
        }
    }

    stopRecording() {
        if (!this.isRecording) return;
    
        if (this.isCordova() && this.cordovaMedia) {
            this.cordovaMedia.stopRecord();
            this.isRecording = false;
            this.stopTimer();
            this.updateRecordingUI();
            // The success callback of the Media object will handle the processing
            this.cordovaMedia.release();
            this.processCordovaRecording();
        } else if (this.mediaRecorder) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            if (this.audioStream) {
                this.audioStream.getTracks().forEach(track => track.stop());
            }
            this.stopTimer();
            this.updateRecordingUI();
        }
    }
    
    
    async processCordovaRecording() {
        try {
            const fileEntry = await this.resolveFile(this.cordovaAudioPath);
            const file = await this.getFile(fileEntry);
            
            const audioBlob = new Blob([file], { type: 'audio/wav' });
            this.currentRecording = {
                blob: audioBlob,
                mimeType: 'audio/wav',
                size: audioBlob.size,
                duration: this.getRecordingDuration()
            };
    
            if (this.elements.recordActions) this.elements.recordActions.style.display = 'flex';
            if (this.elements.sendBtn) this.elements.sendBtn.disabled = false;
    
            this.updateStatus('Recording saved. Click "Send to AI" to process.');
    
            if (this.autoSendAfterStop) {
                this.autoSendAfterStop = false;
                setTimeout(() => this.sendToAI(), 50);
            }
        } catch (error) {
            console.error('Error processing Cordova recording:', error);
            this.showError('Failed to process recording. Please try again.');
            this.resetRecordingUI();
        }
    }
    
    resolveFile(path) {
        return new Promise((resolve, reject) => {
            window.resolveLocalFileSystemURL(path, resolve, reject);
        });
    }
    
    getFile(fileEntry) {
        return new Promise((resolve, reject) => {
            fileEntry.file(resolve, reject);
        });
    }

    async processRecording() {
        if (this.audioChunks.length === 0) {
            this.showError('No audio data recorded. Please try again.');
            this.resetRecordingUI();
            return;
        }

        try {
            const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType });

            this.currentRecording = {
                blob: audioBlob,
                mimeType: this.mediaRecorder.mimeType,
                size: audioBlob.size,
                duration: this.getRecordingDuration()
            };

            if (this.elements.recordActions) this.elements.recordActions.style.display = 'flex';
            if (this.elements.sendBtn) this.elements.sendBtn.disabled = false;

            this.updateStatus('Recording saved. Click "Send to AI" to process.');

            if (this.autoSendAfterStop) {
                this.autoSendAfterStop = false;
                setTimeout(() => this.sendToAI(), 50);
            }
        } catch (error) {
            console.error('Error processing recording:', error);
            this.showError('Failed to process recording. Please try again.');
            this.resetRecordingUI();
        }
    }

    async sendToAI() {
        if (!this.currentRecording) {
            this.showError('No recording to send. Please record audio first.');
            return;
        }

        try {
            this.showLoading('Processing with AI...');

            const recordData = {
                filename: `recording_${Date.now()}.${this.isCordova() ? 'wav' : 'webm'}`,
                mimeType: this.currentRecording.mimeType,
                size: this.currentRecording.size,
                duration: this.currentRecording.duration
            };

            const savedRecord = window.app.storage.addAudioRecord(recordData);

            if (window.app.pwa && window.app.pwa.indexedDB) {
                await window.app.pwa.indexedDB.storeAudioFile(savedRecord.id, this.currentRecording.blob, {
                    filename: recordData.filename,
                    mimeType: recordData.mimeType
                });
            }

            if (navigator.onLine) {
                const aiManager = window.app.getActiveAIManager();
                const aiResponse = await aiManager.processAudio(this.currentRecording);
                
                window.app.storage.updateAudioRecord(savedRecord.id, {
                    transcribed: true,
                    transcriptionData: JSON.stringify(aiResponse)
                });

                await aiManager.handleAIResponse(aiResponse, savedRecord.id);
                this.hideLoading();
                this.showSuccess('Recording processed and saved!');
            } else {
                if (window.app.pwa && window.app.pwa.indexedDB) {
                    await window.app.pwa.indexedDB.queueOfflineRequest({
                        type: 'ai-transcription',
                        recordId: savedRecord.id,
                        audioBlob: this.currentRecording.blob
                    });
                }
                this.hideLoading();
                this.showSuccess('Recording saved. Will process when online.');
            }

            this.resetRecordingUI();
            this.currentRecording = null;
            
            if (window.app && window.app.recordManager) {
                window.app.recordManager.refreshRecordsList();
            }

        } catch (error) {
            console.error('Error sending to AI:', error);
            this.hideLoading();
            if (error.message && error.message.includes('API key')) {
                this.showError(error.message);
            } else {
                this.showError('Failed to process recording. Please try again.');
            }
        }
    }

    getSupportedMimeType() {
        const possibleTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/wav'];
        for (let type of possibleTypes) {
            if (MediaRecorder.isTypeSupported(type)) return { mimeType: type };
        }
        return {};
    }

    updateRecordingUI() {
        if (this.isRecording) {
            this.elements.recordBtn.classList.add('recording');
            this.elements.recordBtn.innerHTML = '<span class="record-icon">⏹️</span>';
            this.updateStatus('Recording... Click to stop');

            if (this.elements.recordingSection) this.elements.recordingSection.classList.add('recording');
            if (this.elements.recordingTimer) this.elements.recordingTimer.style.display = 'block';
            if (this.elements.recordingStatus) this.elements.recordingStatus.style.display = 'block';
            if (this.elements.recordActions) this.elements.recordActions.style.display = 'flex';
            if (this.elements.sendBtn) this.elements.sendBtn.disabled = false;
        } else {
            this.elements.recordBtn.classList.remove('recording');
            this.elements.recordBtn.innerHTML = '<span class="record-icon">🎙️</span>';
            if (this.elements.recordingSection) this.elements.recordingSection.classList.remove('recording');
            if (this.elements.recordingTimer) {
                this.elements.recordingTimer.style.display = 'none';
                this.elements.recordingTimer.textContent = '';
            }
        }
    }

    resetRecordingUI() {
        this.elements.recordBtn.classList.remove('recording');
        this.elements.recordBtn.innerHTML = '<span class="record-icon">🎙️</span>';
        this.updateStatus('');
        this.updateTimer('');
        if (this.elements.recordingSection) this.elements.recordingSection.classList.remove('recording');
        if (this.elements.recordingStatus) this.elements.recordingStatus.style.display = 'none';
        if (this.elements.recordingTimer) this.elements.recordingTimer.style.display = 'none';
        if (this.elements.recordActions) this.elements.recordActions.style.display = 'none';
        if (this.elements.sendBtn) this.elements.sendBtn.disabled = true;
    }

    startTimer() {
        this.recordingTimer = setInterval(() => {
            const elapsed = Date.now() - this.recordingStartTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            this.updateTimer(timeString);

            if (minutes >= 60) {
                this.stopRecording();
                this.showError('Recording stopped automatically after 60 minutes.');
            }
        }, 1000);
    }

    stopTimer() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
    }

    getRecordingDuration() {
        return this.recordingStartTime ? Math.floor((Date.now() - this.recordingStartTime) / 1000) : 0;
    }

    updateStatus(message) {
        if (this.elements.recordingStatus) {
            this.elements.recordingStatus.textContent = message || '';
            this.elements.recordingStatus.style.display = message ? 'block' : 'none';
        }
    }

    updateTimer(timeString) {
        if (this.elements.recordingTimer) {
            this.elements.recordingTimer.textContent = timeString || '';
            this.elements.recordingTimer.style.display = this.isRecording ? 'block' : 'none';
        }
    }

    showLoading(message) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            const loadingText = overlay.querySelector('.loading-text');
            if (loadingText) loadingText.textContent = message;
            overlay.classList.add('show');
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.remove('show');
    }

    showError(message) {
        alert('Error: ' + message);
        console.error('Audio Manager Error:', message);
    }

    showSuccess(message) {
        if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast(message, 'success', 3000);
        } else {
            console.log('Success:', message);
        }
    }

    cleanup() {
        this.stopRecording();
        if (this.recordingTimer) clearInterval(this.recordingTimer);
    }
}

window.AudioManager = AudioManager;
