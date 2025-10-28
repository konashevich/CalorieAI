/**
 * Audio Manager - Android-optimized with forced permission prompts
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
        this.cordovaMedia = null;
        this.cordovaAudioPath = null;
        this._deviceReady = false;
        
        this.elements = {
            recordBtn: document.getElementById('recordBtn'),
            stopBtn: document.getElementById('stopBtn'),
            sendBtn: document.getElementById('sendBtn'),
            recordingStatus: document.getElementById('recordingStatus'),
            recordingTimer: document.getElementById('recordingTimer'),
            recordActions: document.getElementById('recordActions'),
            recordingSection: document.querySelector('.recording-section')
        };

        document.addEventListener('deviceready', () => {
            this._deviceReady = true;
            console.log('[AudioManager] deviceready');
        }, false);

        this.init();
    }

    async init() {
        console.log('[AudioManager] Initializing...', { isCordova: this.isCordova() });
        this.bindEvents();
        
        // On Cordova, wait for deviceready before requesting permissions
        if (this.isCordova()) {
            if (document.readyState === 'complete' || typeof cordova !== 'undefined') {
                this.requestInitialPermissions();
            } else {
                document.addEventListener('deviceready', () => this.requestInitialPermissions(), false);
            }
        }
    }

    isCordova() { return typeof cordova !== 'undefined'; }

    isAndroidWebView() {
        try {
            return location.href.startsWith('file:///android_asset') || /Android/.test(navigator.userAgent);
        } catch { return false; }
    }

    async requestInitialPermissions() {
        console.log('[AudioManager] Requesting initial permissions...');
        try {
            if (window.cordova?.plugins?.permissions) {
                const perms = window.cordova.plugins.permissions;
                // Force request on startup
                perms.requestPermission(perms.RECORD_AUDIO, 
                    (status) => console.log('[AudioManager] Permission granted:', status.hasPermission),
                    (error) => console.warn('[AudioManager] Permission denied:', error)
                );
            }
        } catch (e) {
            console.error('[AudioManager] Initial permission request failed:', e);
        }
    }

    bindEvents() {
        if (this.elements.recordBtn) {
            this.elements.recordBtn.addEventListener('click', () => {
                if (this.isRecording) this.stopRecording(); else this.startRecording();
            });
        }
        if (this.elements.stopBtn) this.elements.stopBtn.addEventListener('click', () => this.stopRecording());
        if (this.elements.sendBtn) {
            this.elements.sendBtn.addEventListener('click', () => {
                if (this.isRecording) { this.autoSendAfterStop = true; this.updateStatus('Stopping and sending to AI...'); this.stopRecording(); }
                else { this.sendToAI(); }
            });
        }
    }

    async requestMicPermission() {
        console.log('[AudioManager] Requesting mic permission...');
        
        // Strategy 1: Cordova permission plugin
        if (window.cordova?.plugins?.permissions) {
            const perms = window.cordova.plugins.permissions;
            const granted = await new Promise((resolve) => {
                perms.requestPermission(perms.RECORD_AUDIO, 
                    (status) => {
                        console.log('[AudioManager] Cordova permission result:', status.hasPermission);
                        resolve(status.hasPermission);
                    },
                    () => {
                        console.warn('[AudioManager] Cordova permission request failed');
                        resolve(false);
                    }
                );
            });
            if (granted) return true;
        }

        // Strategy 2: Trigger native recorder (forces permission on first use)
        if (navigator.device?.capture?.captureAudio) {
            console.log('[AudioManager] Using native capture to trigger permission');
            return true; // captureAudio will handle permission itself
        }

        // Strategy 3: getUserMedia fallback
        if (navigator.mediaDevices?.getUserMedia) {
            try {
                console.log('[AudioManager] Using getUserMedia for permission');
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(t => t.stop());
                return true;
            } catch (e) {
                console.error('[AudioManager] getUserMedia permission failed:', e);
            }
        }

        return false;
    }

    async waitForCaptureReady(timeoutMs = 3000) {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            if (navigator.device?.capture?.captureAudio) return true;
            await new Promise(r => setTimeout(r, 100));
        }
        return false;
    }

    getPreferredMediaOptions() {
        try {
            if (typeof MediaRecorder === 'undefined') return null;
            const candidates = [
                'audio/mp4', // AAC in MP4 container
                'audio/aac',
                'audio/ogg;codecs=vorbis', // if device supports true Vorbis
                'audio/ogg' // some UA may map to Vorbis
            ];
            for (const c of candidates) {
                if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(c)) {
                    return { mimeType: c };
                }
            }
        } catch {}
        return null;
    }

    async startRecording() {
        console.log('[AudioManager] Start recording requested');
        
        // If likely in Android WebView, briefly wait for capture API to be ready
        if (this.isAndroidWebView() && !navigator.device?.capture?.captureAudio) {
            this.updateStatus('Preparing recorder...');
            await this.waitForCaptureReady(3000);
        }

        // Always request permission before attempting to record
        const hasPermission = await this.requestMicPermission();
        if (!hasPermission && !(navigator.device?.capture?.captureAudio)) {
            this.showError('Microphone permission required. Please enable it in Settings → Apps → CalorieAI → Permissions.');
            return;
        }

        const preferred = this.getPreferredMediaOptions();
        if (preferred && navigator.mediaDevices?.getUserMedia) {
            await this.startWebRecording(preferred);
            return;
        }

        if (navigator.mediaDevices?.getUserMedia) {
            await this.startWavRecording();
            return;
        }

        if (this.isCordova() || (this.isAndroidWebView() && navigator.device?.capture?.captureAudio)) await this.startCordovaRecording();
        else await this.startWebRecording();
    }

    async startCordovaRecording() {
        console.log('[AudioManager] Starting Cordova recording...');
        
        try {
            // 1) Prefer in-app recording via Cordova Media plugin (stays in our UI)
            if (typeof Media !== 'undefined') {
                console.log('[AudioManager] Using Cordova Media (in-app)');
                const fileName = `calorieai_${Date.now()}.3gp`;
                this.cordovaAudioPath = (window.cordova?.file?.dataDirectory || '') + fileName;

                this.cordovaMedia = new Media(
                    this.cordovaAudioPath,
                    () => console.log('[AudioManager] Media success (callback)'),
                    (err) => console.error('[AudioManager] Media error:', err)
                );

                try {
                    this.cordovaMedia.startRecord();
                } catch (e) {
                    console.error('[AudioManager] startRecord threw:', e);
                    // Fall through to native capture if starting Media fails
                    this.cordovaMedia.release();
                    this.cordovaMedia = null;
                }

                if (this.cordovaMedia) {
                    this.isRecording = true;
                    this.recordingStartTime = Date.now();
                    this.updateRecordingUI();
                    this.startTimer();
                    return; // Using in-app recorder successfully
                }
            }

            // 2) Fallback: Use native media capture (external UI)
            if (navigator.device?.capture?.captureAudio) {
                console.log('[AudioManager] Falling back to native media capture');
                const options = { limit: 1, duration: 3600 };
                this.isRecording = true;
                this.recordingStartTime = Date.now();
                this.updateRecordingUI();
                this.startTimer();
                navigator.device.capture.captureAudio(async (mediaFiles) => {
                    try {
                        this.stopTimer(); this.isRecording = false; this.updateRecordingUI();
                        if (!mediaFiles?.length) { this.showError('No audio recorded.'); return; }
                        const info = mediaFiles[0];
                        const src = info.fullPath || info.localURL || info.path;
                        if (!src) { this.showError('Could not access recorded audio file.'); return; }
                        const fe = await this.resolveFile(src);
                        const file = await this.getFile(fe);
                        const mime = file.type || info.type || 'audio/3gpp';
                        this.currentRecording = { blob: file, mimeType: mime, size: file.size, duration: this.getRecordingDuration() };
                        if (this.elements.recordActions) this.elements.recordActions.style.display = 'flex';
                        if (this.elements.sendBtn) this.elements.sendBtn.disabled = false;
                        this.updateStatus('Recording saved. Click "Send to AI" to process.');
                        if (this.autoSendAfterStop) { this.autoSendAfterStop = false; setTimeout(() => this.sendToAI(), 50); }
                    } catch (e) {
                        console.error('[AudioManager] capture processing error:', e);
                        this.showError('Failed to process captured audio.');
                        this.resetRecordingUI();
                    }
                }, (error) => {
                    console.error('[AudioManager] Capture error:', error);
                    this.stopTimer(); this.isRecording = false; this.resetRecordingUI();
                    const msg = (error?.code === 3) ? 'Recording canceled.' : 'Failed to start recorder. Check microphone permission.';
                    this.showError(msg);
                }, options);
                return;
            }

            // 3) If neither Media nor capture is available
            this.showError('Recording is not available on this device.');
        } catch (error) {
            console.error('[AudioManager] Cordova recording start failed:', error);
            this.showError('Failed to start recording.');
        }
    }

    async startWebRecording(options) {
        try {
            if (!navigator.mediaDevices?.getUserMedia) throw new Error('MediaRecorder API not supported');
            this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
            const recOptions = options || this.getSupportedMimeType();
            this.mediaRecorder = new MediaRecorder(this.audioStream, recOptions);
            this.audioChunks = []; this.recordingStartTime = Date.now();
            this.mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) this.audioChunks.push(e.data); };
            this.mediaRecorder.onstop = () => setTimeout(() => this.processRecording(), 100);
            this.mediaRecorder.onerror = (e) => { console.error('[AudioManager] MediaRecorder error:', e.error); this.showError('Recording error occurred.'); this.resetRecordingUI(); };
            this.mediaRecorder.start(1000); this.isRecording = true; this.updateRecordingUI(); this.startTimer();
        } catch (error) { console.error('[AudioManager] Web recording start failed:', error); this.showError('Failed to start recording.'); }
    }

    stopRecording() {
        if (!this.isRecording) return;
        if (this.isCordova() && this.cordovaMedia) {
            // In-app Media path
            try { this.cordovaMedia.stopRecord(); } catch (e) { console.warn('[AudioManager] stopRecord error:', e); }
            this.isRecording = false; this.stopTimer(); this.updateRecordingUI();
            // Delay processing slightly to ensure file is flushed
            setTimeout(() => { try { this.cordovaMedia.release(); } catch {} this.processCordovaRecording(); }, 150);
            return;
        } else if (this.isCordova() && !this.cordovaMedia) {
            this.showError('Recording is running in the native recorder. Stop it using the system UI.'); return;
        } else if (this.mediaRecorder) {
            this.mediaRecorder.stop(); this.isRecording = false; if (this.audioStream) this.audioStream.getTracks().forEach(t => t.stop()); this.stopTimer(); this.updateRecordingUI();
        }
    }

    async processCordovaRecording() {
        try {
            const fe = await this.resolveFile(this.cordovaAudioPath);
            const file = await this.getFile(fe);
            const mimeType = file.type || 'audio/3gpp';
            this.currentRecording = { blob: file, mimeType, size: file.size, duration: this.getRecordingDuration() };
            if (this.elements.recordActions) this.elements.recordActions.style.display = 'flex'; if (this.elements.sendBtn) this.elements.sendBtn.disabled = false;
            this.updateStatus('Recording saved. Click "Send to AI" to process.');
            if (this.autoSendAfterStop) { this.autoSendAfterStop = false; setTimeout(() => this.sendToAI(), 50); }
        } catch (error) { console.error('[AudioManager] Cordova processing failed:', error); this.showError('Failed to process recording.'); this.resetRecordingUI(); }
    }

    resolveFile(path) { return new Promise((resolve, reject) => { window.resolveLocalFileSystemURL(path, resolve, reject); }); }
    getFile(fileEntry) { return new Promise((resolve, reject) => { fileEntry.file(resolve, reject); }); }

    async processRecording() {
        if (this.audioChunks.length === 0) { this.showError('No audio data recorded.'); this.resetRecordingUI(); return; }
        try {
            const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType });
            this.currentRecording = { blob: audioBlob, mimeType: this.mediaRecorder.mimeType, size: audioBlob.size, duration: this.getRecordingDuration() };
            if (this.elements.recordActions) this.elements.recordActions.style.display = 'flex'; if (this.elements.sendBtn) this.elements.sendBtn.disabled = false;
            this.updateStatus('Recording saved. Click "Send to AI" to process.');
            if (this.autoSendAfterStop) { this.autoSendAfterStop = false; setTimeout(() => this.sendToAI(), 50); }
        } catch (error) { console.error('[AudioManager] Web processing failed:', error); this.showError('Failed to process recording.'); this.resetRecordingUI(); }
    }

    async reencodeToWebmIfNeeded() {
        try {
            const mt = (this.currentRecording?.mimeType || '').toLowerCase();
            if (!this.currentRecording || !mt.includes('3gp')) return false;
            if (typeof MediaRecorder === 'undefined') return false;
            const canWebm = MediaRecorder.isTypeSupported && (MediaRecorder.isTypeSupported('audio/webm;codecs=opus') || MediaRecorder.isTypeSupported('audio/webm'));
            if (!canWebm) return false;
            const blob = this.currentRecording.blob;
            const url = URL.createObjectURL(blob);
            const audio = new Audio();
            audio.src = url;
            audio.crossOrigin = 'anonymous';
            const stream = audio.captureStream ? audio.captureStream() : (audio.mozCaptureStream && audio.mozCaptureStream());
            if (!stream) { URL.revokeObjectURL(url); return false; }
            const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
            const chunks = [];
            mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
            const done = new Promise((resolve) => { mr.onstop = () => resolve(); audio.onended = () => { try { mr.stop(); } catch {} }; });
            mr.start(250);
            await audio.play().catch(() => {});
            await done;
            const webm = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
            URL.revokeObjectURL(url);
            if (webm.size > 0) {
                this.currentRecording = { blob: webm, mimeType: webm.type, size: webm.size, duration: this.currentRecording.duration };
                return true;
            }
            return false;
        } catch (e) { console.warn('Re-encode to webm failed:', e); return false; }
    }

    async sendToAI() {
        if (!this.currentRecording) { this.showError('No recording to send.'); return; }
        try {
            this.showLoading('Processing with AI...');

            // If recorded as 3gp, try to re-encode to webm for better AI compatibility
            await this.reencodeToWebmIfNeeded();

            const ext = (() => { const mt = (this.currentRecording.mimeType || '').toLowerCase(); if (mt.includes('webm')) return 'webm'; if (mt.includes('3gpp') || mt.includes('3gp')) return '3gp'; if (mt.includes('mp4') || mt.includes('m4a') || mt.includes('aac')) return 'm4a'; if (mt.includes('wav')) return 'wav'; return this.isCordova() ? '3gp' : 'webm'; })();
            const recordData = { filename: `recording_${Date.now()}.${ext}`, mimeType: this.currentRecording.mimeType, size: this.currentRecording.size, duration: this.currentRecording.duration };
            const savedRecord = window.app.storage.addAudioRecord(recordData);
            if (window.app.pwa?.indexedDB) await window.app.pwa.indexedDB.storeAudioFile(savedRecord.id, this.currentRecording.blob, { filename: recordData.filename, mimeType: recordData.mimeType });
            if (navigator.onLine) {
                const aiManager = window.app.getActiveAIManager();
                const aiResponse = await aiManager.processAudio(this.currentRecording);
                window.app.storage.updateAudioRecord(savedRecord.id, { transcribed: true, transcriptionData: JSON.stringify(aiResponse) });
                await aiManager.handleAIResponse(aiResponse, savedRecord.id);
                this.hideLoading(); this.showSuccess('Recording processed and saved!');
            } else {
                if (window.app.pwa?.indexedDB) await window.app.pwa.indexedDB.queueOfflineRequest({ type: 'ai-transcription', recordId: savedRecord.id, audioBlob: this.currentRecording.blob });
                this.hideLoading(); this.showSuccess('Recording saved. Will process when online.');
            }
            this.resetRecordingUI(); this.currentRecording = null; if (window.app?.recordManager) window.app.recordManager.refreshRecordsList();
        } catch (error) {
            console.error('Error sending to AI:', error);
            this.hideLoading();
            const msg = (error && error.message) ? error.message : 'Failed to process recording. Please try again.';
            this.showError(msg);
        }
    }

    getSupportedMimeType() { const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/wav']; for (let t of types) { if (MediaRecorder.isTypeSupported(t)) return { mimeType: t }; } return {}; }

    updateRecordingUI() {
        if (this.isRecording) {
            this.elements.recordBtn.classList.add('recording'); this.elements.recordBtn.innerHTML = '<span class="record-icon">⏹️</span>';
            this.updateStatus('Recording... Click to stop'); if (this.elements.recordingSection) this.elements.recordingSection.classList.add('recording');
            if (this.elements.recordingTimer) this.elements.recordingTimer.style.display = 'block'; if (this.elements.recordingStatus) this.elements.recordingStatus.style.display = 'block';
            if (this.elements.recordActions) this.elements.recordActions.style.display = 'flex'; if (this.elements.sendBtn) this.elements.sendBtn.disabled = false;
        } else {
            this.elements.recordBtn.classList.remove('recording'); this.elements.recordBtn.innerHTML = '<span class="record-icon">🎙️</span>';
            if (this.elements.recordingSection) this.elements.recordingSection.classList.remove('recording');
            if (this.elements.recordingTimer) { this.elements.recordingTimer.style.display = 'none'; this.elements.recordingTimer.textContent = ''; }
        }
    }

    resetRecordingUI() {
        this.elements.recordBtn.classList.remove('recording'); this.elements.recordBtn.innerHTML = '<span class="record-icon">🎙️</span>';
        this.updateStatus(''); this.updateTimer(''); if (this.elements.recordingSection) this.elements.recordingSection.classList.remove('recording');
        if (this.elements.recordingStatus) this.elements.recordingStatus.style.display = 'none'; if (this.elements.recordingTimer) this.elements.recordingTimer.style.display = 'none';
        if (this.elements.recordActions) this.elements.recordActions.style.display = 'none'; if (this.elements.sendBtn) this.elements.sendBtn.disabled = true;
    }

    startTimer() {
        this.recordingTimer = setInterval(() => {
            const elapsed = Date.now() - this.recordingStartTime; const minutes = Math.floor(elapsed / 60000); const seconds = Math.floor((elapsed % 60000) / 1000);
            const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`; this.updateTimer(timeString);
            if (minutes >= 60) { this.stopRecording(); this.showError('Recording stopped automatically after 60 minutes.'); }
        }, 1000);
    }

    stopTimer() { if (this.recordingTimer) { clearInterval(this.recordingTimer); this.recordingTimer = null; } }

    getRecordingDuration() { return this.recordingStartTime ? Math.floor((Date.now() - this.recordingStartTime) / 1000) : 0; }

    updateStatus(message) { if (this.elements.recordingStatus) { this.elements.recordingStatus.textContent = message || ''; this.elements.recordingStatus.style.display = message ? 'block' : 'none'; } }

    updateTimer(timeString) { if (this.elements.recordingTimer) { this.elements.recordingTimer.textContent = timeString || ''; this.elements.recordingTimer.style.display = this.isRecording ? 'block' : 'none'; } }

    showLoading(message) { const overlay = document.getElementById('loadingOverlay'); if (overlay) { const t = overlay.querySelector('.loading-text'); if (t) t.textContent = message; overlay.classList.add('show'); } }
    hideLoading() { const overlay = document.getElementById('loadingOverlay'); if (overlay) overlay.classList.remove('show'); }
    showError(message) { alert('Error: ' + message); console.error('[AudioManager] Error:', message); }
    showSuccess(message) { if (window.app?.showToast) { window.app.showToast(message, 'success', 3000); } else { console.log('[AudioManager] Success:', message); } }
    cleanup() { this.stopRecording(); if (this.recordingTimer) clearInterval(this.recordingTimer); }
}

window.AudioManager = AudioManager;