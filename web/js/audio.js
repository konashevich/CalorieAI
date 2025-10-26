/**
 * Audio Manager
 * Handles MediaRecorder API for voice recording functionality
 */

class AudioManager {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.audioStream = null;
        this.isRecording = false;
        this.autoSendAfterStop = false; // if true, stop -> process -> send
        this.recordingTimer = null;
        this.recordingStartTime = null;
        this.microphonePermission = false;
        
        this.elements = {
            recordBtn: document.getElementById('recordBtn'),
            stopBtn: document.getElementById('stopBtn'),
            sendBtn: document.getElementById('sendBtn'),
            recordingStatus: document.getElementById('recordingStatus'),
            recordingTimer: document.getElementById('recordingTimer'),
            recordActions: document.getElementById('recordActions')
        };

        // Debug: Check if elements exist
        console.log('AudioManager elements:', this.elements);

        this.init();
    }

    async init() {
        try {
            this.bindEvents();
            // Don't check microphone permission during init - do it when user clicks record
        } catch (error) {
            console.error('Audio Manager initialization error:', error);
        }
    }

    async checkMicrophonePermission() {
        try {
            // Check if browser supports MediaRecorder
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('MediaRecorder API not supported');
            }

            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop()); // Stop immediately after permission check
            
            console.log('Microphone permission granted');
            return true;
        } catch (error) {
            console.error('Microphone permission denied or not available:', error);
            this.showError('Microphone access is required for recording. Please allow microphone permission and refresh the page.');
            return false;
        }
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

        if (this.elements.stopBtn) {
            this.elements.stopBtn.addEventListener('click', () => {
                this.stopRecording();
            });
        }

        if (this.elements.sendBtn) {
            this.elements.sendBtn.addEventListener('click', () => {
                console.log('Send button clicked, currentRecording:', this.currentRecording);
                // One-click experience: if recording, stop and auto-send
                if (this.isRecording) {
                    this.autoSendAfterStop = true;
                    this.updateStatus('Stopping and sending to AI...');
                    this.stopRecording();
                } else {
                    this.sendToAI();
                }
            });
        } else {
            console.error('Send button element not found');
        }
    }

    async startRecording() {
        try {
            // Check if browser supports MediaRecorder
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('MediaRecorder API not supported in this browser');
            }

            // Get media stream
            this.audioStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000
                }
            });

            this.microphonePermission = true;

            // Determine the best supported format
            const options = this.getSupportedMimeType();
            
            // Create MediaRecorder
            this.mediaRecorder = new MediaRecorder(this.audioStream, options);
            
            this.audioChunks = [];
            this.recordingStartTime = Date.now();

            // Event handlers
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                // Small delay to ensure all data is available
                setTimeout(() => {
                    this.processRecording();
                }, 100);
            };

            this.mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event.error);
                this.showError('Recording error occurred. Please try again.');
                this.resetRecordingUI();
            };

            // Start recording
            this.mediaRecorder.start(1000); // Collect data every second
            this.isRecording = true;
            
            this.updateRecordingUI();
            this.startTimer();

        } catch (error) {
            console.error('Error starting recording:', error);
            this.showError('Failed to start recording. Please check your microphone.');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            // Stop audio stream
            if (this.audioStream) {
                this.audioStream.getTracks().forEach(track => track.stop());
            }
            
            this.stopTimer();
            this.updateRecordingUI();
        }
    }

    async processRecording() {
        if (this.audioChunks.length === 0) {
            this.showError('No audio data recorded. Please try again.');
            this.resetRecordingUI();
            return;
        }

        try {
            // Create blob from chunks
            const audioBlob = new Blob(this.audioChunks, { 
                type: this.mediaRecorder.mimeType 
            });

            this.currentRecording = {
                blob: audioBlob,
                mimeType: this.mediaRecorder.mimeType,
                size: audioBlob.size,
                duration: this.getRecordingDuration()
            };

            // Show record actions and enable send button
            if (this.elements.recordActions) {
                this.elements.recordActions.style.display = 'flex';
            }
            
            if (this.elements.sendBtn) {
                this.elements.sendBtn.disabled = false; // ensure enabled after recording
            }

            // Update status
            this.updateStatus('Recording saved. Click "Send to AI" to process.');

            // If user clicked Send while recording, auto-send now
            if (this.autoSendAfterStop) {
                this.autoSendAfterStop = false;
                // Defer slightly to allow UI to update
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
            // Show loading
            this.showLoading('Processing with AI...');

            // Save to storage first (metadata in localStorage)
            const recordData = {
                filename: `recording_${Date.now()}.webm`,
                mimeType: this.currentRecording.mimeType,
                size: this.currentRecording.size,
                duration: this.currentRecording.duration
            };

            const savedRecord = window.app.storage.addAudioRecord(recordData);

            // Save audio blob to IndexedDB
            if (window.app.pwa && window.app.pwa.indexedDB) {
                await window.app.pwa.indexedDB.storeAudioFile(
                    savedRecord.id, 
                    this.currentRecording.blob,
                    {
                        filename: recordData.filename,
                        mimeType: recordData.mimeType
                    }
                );
            }

            // Send to AI service (check if online)
            if (navigator.onLine) {
                // Process with AI
                const aiManager = window.app.getActiveAIManager();
                const aiResponse = await aiManager.processAudio(this.currentRecording);
                
                // Update record with transcription
                window.app.storage.updateAudioRecord(savedRecord.id, {
                    transcribed: true,
                    transcriptionData: JSON.stringify(aiResponse)
                });

                // Handle AI response (save to appropriate storage)
                await aiManager.handleAIResponse(aiResponse, savedRecord.id);

                this.hideLoading();
                this.showSuccess('Recording processed and saved!');
            } else {
                // Queue for offline processing
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
            
            // Refresh records list
            if (window.app && window.app.recordManager) {
                window.app.recordManager.refreshRecordsList();
            }

        } catch (error) {
            console.error('Error sending to AI:', error);
            this.hideLoading();
            // Show specific error message if it's an API key issue
            if (error.message && error.message.includes('API key')) {
                this.showError(error.message);
            } else {
                this.showError('Failed to process recording. Please try again.');
            }
        }
    }

    getSupportedMimeType() {
        const possibleTypes = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/mp4',
            'audio/wav'
        ];

        for (let type of possibleTypes) {
            if (MediaRecorder.isTypeSupported(type)) {
                return { mimeType: type };
            }
        }

        return {}; // Use default
    }

    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    updateRecordingUI() {
        if (this.isRecording) {
            // Recording state
            this.elements.recordBtn.classList.add('recording');
            this.elements.recordBtn.innerHTML = '<span class="record-icon">⏹️</span>';
            this.updateStatus('Recording... Click to stop');
            
            if (this.elements.recordActions) {
                this.elements.recordActions.style.display = 'flex';
            }
            
            // Allow one-click send during recording
            if (this.elements.sendBtn) {
                this.elements.sendBtn.disabled = false;
            }
        } else {
            // Stopped state
            this.elements.recordBtn.classList.remove('recording');
            this.elements.recordBtn.innerHTML = '<span class="record-icon">🎙️</span>';
            
            // Don't hide record actions immediately - wait for processRecording to complete
            // The processRecording method will handle showing the send button
        }
    }

    resetRecordingUI() {
        this.elements.recordBtn.classList.remove('recording');
        this.elements.recordBtn.innerHTML = '<span class="record-icon">🎙️</span>';
        this.updateStatus('Tap to record');
        this.updateTimer('00:00');
        
        if (this.elements.recordActions) {
            this.elements.recordActions.style.display = 'none';
        }
        
        if (this.elements.sendBtn) {
            this.elements.sendBtn.disabled = true;
        }
    }

    startTimer() {
        this.recordingTimer = setInterval(() => {
            const elapsed = Date.now() - this.recordingStartTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            this.updateTimer(timeString);

            // Auto-stop at 60 minutes as per spec
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
        if (this.recordingStartTime) {
            return Math.floor((Date.now() - this.recordingStartTime) / 1000);
        }
        return 0;
    }

    updateStatus(message) {
        if (this.elements.recordingStatus) {
            this.elements.recordingStatus.textContent = message;
        }
    }

    updateTimer(timeString) {
        if (this.elements.recordingTimer) {
            this.elements.recordingTimer.textContent = timeString;
        }
    }

    showLoading(message) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            const loadingText = overlay.querySelector('.loading-text');
            if (loadingText) {
                loadingText.textContent = message;
            }
            overlay.classList.add('show');
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
    }

    showError(message) {
        // Simple alert for now - can be enhanced with custom modal
        alert('Error: ' + message);
        console.error('Audio Manager Error:', message);
    }

    showSuccess(message) {
        // Use in-app toast notification instead of alert
        if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast(message, 'success', 3000);
        } else {
            console.log('Success:', message);
        }
        console.log('Audio Manager Success:', message);
    }

    // Cleanup method
    cleanup() {
        this.stopRecording();
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
        }
    }
}

// Export for use in other modules
window.AudioManager = AudioManager;