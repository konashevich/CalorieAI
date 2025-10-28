/**
 * Audio Manager - Single-path AACRecorder integration (Android only)
 */
class AudioManager {
    constructor() {
        this.isRecording = false;
        this.recordingTimer = null;
        this.recordingStartTime = null;
        this.currentFile = null; // { filePath, mimeType, duration, sizeBytes }
        this.autoSendAfterStop = false;
        this.deviceReady = false;

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
            this.deviceReady = true;
            console.log('[AudioManager] deviceready - AAC only');
        }, false);

        this.bindEvents();
        this.resetRecordingUI();
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

    async ensurePermission() {
        if (!this.deviceReady) {
            this.showError('App not ready yet. Please try again in a moment.');
            return false;
        }
        if (!window.AACRecorder) {
            this.showError('Audio recorder unavailable. Please restart the app.');
            return false;
        }
        try {
            const has = await window.AACRecorder.hasPermission();
            if (has === true || has === 1) return true;
        } catch {}
        const granted = await window.AACRecorder.requestPermission().catch(() => 0);
        return granted === true || granted === 1;
    }

    async startRecording() {
        try {
            this.updateStatus('Preparing recorder...');
            const ok = await this.ensurePermission();
            if (!ok) { this.showError('Microphone permission required. Grant it to record.'); return; }
            const res = await window.AACRecorder.start({ maxSeconds: 3600 });
            this.isRecording = true;
            this.recordingStartTime = Date.now();
            this.currentFile = { filePath: res.filePath, mimeType: res.mimeType || 'audio/aac' };
            this.updateRecordingUI();
            this.startTimer();
        } catch (e) {
            console.error('[AudioManager] start failed', e);
            this.showError('Failed to start recording.');
            this.resetRecordingUI();
        }
    }

    async stopRecording() {
        if (!this.isRecording) return;
        try {
            const res = await window.AACRecorder.stop();
            this.isRecording = false;
            this.stopTimer();
            this.updateRecordingUI();
            this.currentFile = { filePath: res.filePath, mimeType: res.mimeType || 'audio/aac', duration: Math.floor((res.durationMs||0)/1000), sizeBytes: res.sizeBytes||0 };
            if (this.elements.recordActions) this.elements.recordActions.style.display = 'flex';
            if (this.elements.sendBtn) this.elements.sendBtn.disabled = false;
            this.updateStatus('Recording saved. Click "Send to AI" to process.');
            if (this.autoSendAfterStop) { this.autoSendAfterStop = false; setTimeout(() => this.sendToAI(), 50); }
        } catch (e) {
            console.error('[AudioManager] stop failed', e);
            this.isRecording = false;
            this.stopTimer();
            this.resetRecordingUI();
            this.showError('Failed to stop recording.');
        }
    }

    readFileAsBlob(filePath) {
        return new Promise((resolve, reject) => {
            window.resolveLocalFileSystemURL(filePath, (entry) => {
                entry.file((file) => resolve(file), reject);
            }, reject);
        });
    }

    async sendToAI() {
        try {
            if (!this.currentFile || !this.currentFile.filePath) { this.showError('No recording to send.'); return; }
            const blob = await this.readFileAsBlob(this.currentFile.filePath);
            const mime = (this.currentFile.mimeType || blob.type || 'audio/aac').toLowerCase();
            const ext = mime.includes('aac') ? 'aac' : (mime.includes('m4a') || mime.includes('mp4') ? 'm4a' : (mime.includes('wav') ? 'wav' : 'aac'));
            const recording = { blob, mimeType: mime, size: blob.size, duration: this.currentFile.duration || 0 };

            this.showLoading('Processing with AI...');
            const aiManager = window.app.getActiveAIManager();
            const aiResponse = await aiManager.processAudio(recording);

            const recordData = { filename: `recording_${Date.now()}.${ext}`, mimeType: recording.mimeType, size: recording.size, duration: recording.duration };
            const savedRecord = window.app.storage.addAudioRecord(recordData);
            if (window.app.pwa?.indexedDB) await window.app.pwa.indexedDB.storeAudioFile(savedRecord.id, blob, { filename: recordData.filename, mimeType: recordData.mimeType });

            window.app.storage.updateAudioRecord(savedRecord.id, { transcribed: true, transcriptionData: JSON.stringify(aiResponse) });
            await aiManager.handleAIResponse(aiResponse, savedRecord.id);

            this.hideLoading();
            this.showSuccess('Recording processed and saved!');
            this.resetRecordingUI();
            this.currentFile = null;
            if (window.app?.recordManager) window.app.recordManager.refreshRecordsList();
        } catch (error) {
            console.error('Error sending to AI:', error);
            this.hideLoading();
            const msg = (error && error.message) ? error.message : 'Failed to process recording. Please try again.';
            this.showError(msg);
        }
    }

    // UI helpers
    updateRecordingUI() {
        if (this.isRecording) {
            this.elements.recordBtn.classList.add('recording');
            this.elements.recordBtn.innerHTML = '<span class="record-icon">⏹️</span>';
            this.updateStatus('Recording... Click to stop');
            if (this.elements.recordingSection) this.elements.recordingSection.classList.add('recording');
            if (this.elements.recordingTimer) this.elements.recordingTimer.style.display = 'block';
            if (this.elements.recordingStatus) this.elements.recordingStatus.style.display = 'block';
            if (this.elements.recordActions) this.elements.recordActions.style.display = 'flex';
            if (this.elements.sendBtn) this.elements.sendBtn.disabled = true;
        } else {
            this.elements.recordBtn.classList.remove('recording');
            this.elements.recordBtn.innerHTML = '<span class="record-icon">🎙️</span>';
            if (this.elements.recordingSection) this.elements.recordingSection.classList.remove('recording');
            if (this.elements.recordingTimer) { this.elements.recordingTimer.style.display = 'none'; this.elements.recordingTimer.textContent = ''; }
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
            if (minutes >= 60) { this.stopRecording(); this.showError('Recording stopped automatically after 60 minutes.'); }
        }, 1000);
    }

    stopTimer() { if (this.recordingTimer) { clearInterval(this.recordingTimer); this.recordingTimer = null; } }

    updateStatus(message) { if (this.elements.recordingStatus) { this.elements.recordingStatus.textContent = message || ''; this.elements.recordingStatus.style.display = message ? 'block' : 'none'; } }

    updateTimer(timeString) { if (this.elements.recordingTimer) { this.elements.recordingTimer.textContent = timeString || ''; this.elements.recordingTimer.style.display = this.isRecording ? 'block' : 'none'; } }

    showLoading(message) { const overlay = document.getElementById('loadingOverlay'); if (overlay) { const t = overlay.querySelector('.loading-text'); if (t) t.textContent = message; overlay.classList.add('show'); } }
    hideLoading() { const overlay = document.getElementById('loadingOverlay'); if (overlay) overlay.classList.remove('show'); }
    showError(message) { alert('Error: ' + message); console.error('[AudioManager] Error:', message); }
    showSuccess(message) { if (window.app?.showToast) { window.app.showToast(message, 'success', 3000); } else { console.log('[AudioManager] Success:', message); } }
    cleanup() { try { if (this.isRecording) this.stopRecording(); } catch (_) {} if (this.recordingTimer) clearInterval(this.recordingTimer); }
}

window.AudioManager = AudioManager;