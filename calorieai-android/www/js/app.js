/**
 * CalorieAI Main Application
 * Coordinates all managers and handles app initialization
 */

class CalorieAIApp {
    constructor() {
        this.storage = null;
        this.navigation = null;
        this.audio = null;
        this.ai = null;
        this.recordManager = null;
        this.processedManager = null;
        this.cookManager = null;
        this.eatManager = null;
        
        this.init();
    }

    async init() {
        try {
            // Initialize PWA manager first
            this.pwa = new PWAManager();
            
            // Initialize managers
            this.storage = new StorageManager();
            this.geminiAI = new GeminiAIManager();
            this.navigation = new NavigationManager();
            this.audio = new AudioManager();
            
            // Initialize page managers
            this.recordManager = new RecordManager(this.storage, this.getActiveAIManager.bind(this));
            this.processedManager = new ProcessedManager(this.storage, this.getActiveAIManager.bind(this));
            this.cookManager = new CookManager(this.storage);
            this.eatManager = new EatManager(this.storage);
            
            // Date display removed from header
            
            // Initialize page content
            this.refreshAllPages();
            
            // Check storage usage
            await this.pwa.checkStorageUsage();
            
            // Setup settings
            this.setupSettings();
            
            console.log('CalorieAI app initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize CalorieAI app:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    // Date display removed from header — method intentionally removed

    refreshAllPages() {
        if (this.recordManager) this.recordManager.refreshRecordsList();
        if (this.processedManager) this.processedManager.refreshProcessedList();
        if (this.cookManager) this.cookManager.refreshMealsList();
        if (this.eatManager) {
            this.eatManager.refreshFoodList();
            this.eatManager.updateDateDisplay();
        }
    }

    showError(message) {
        alert('Error: ' + message);
        console.error('App Error:', message);
    }

    /**
     * Show an in-app toast notification
     * @param {string} message 
     * @param {'success'|'error'|'info'} [type='info']
     * @param {number} [durationMs=3000]
     */
    showToast(message, type = 'info', durationMs = 3000) {
        const container = document.getElementById('toastContainer');
        if (!container) return console.log('Toast:', message);
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.textContent = message;
        container.appendChild(el);
        const remove = () => {
            if (el.parentNode) el.parentNode.removeChild(el);
        };
        setTimeout(remove, durationMs);
    }

    /**
     * Setup settings functionality
     */
    setupSettings() {
        const headerMenuBtn = document.getElementById('headerMenuBtn');
        const headerMenu = document.getElementById('headerMenu');
        const headerSettingsBtn = document.getElementById('headerSettingsBtn');
        const headerExportBtn = document.getElementById('headerExportBtn');
        const headerImportBtn = document.getElementById('headerImportBtn');
        const settingsModal = document.getElementById('settingsModal');
        const closeSettingsModal = document.getElementById('closeSettingsModal');
        const settingsForm = document.getElementById('settingsForm');
        const clearApiKeyBtn = document.getElementById('clearApiKey');

        // Header menu toggle
        headerMenuBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = headerMenu.getAttribute('aria-hidden') === 'false';
            headerMenu.setAttribute('aria-hidden', String(!isOpen));
            headerMenu.classList.toggle('open', !isOpen);
        });

        // Open settings modal from header menu
        headerSettingsBtn?.addEventListener('click', () => {
            this.loadSettings();
            this.showModal('settingsModal');
            // hide header menu
            if (headerMenu) {
                headerMenu.setAttribute('aria-hidden', 'true');
                headerMenu.classList.remove('open');
            }
        });

        // Export data (JSON download, exclude audio recordings)
        headerExportBtn?.addEventListener('click', () => {
            try {
                const json = this.storage.exportData();
                const ts = new Date().toISOString().replace(/[:]/g, '-').split('.')[0];
                const filename = `calorieai-backup-${ts}.json`;
                this.downloadFile(filename, json);
                this.showToast('Export started (JSON file)', 'success');
            } catch (e) {
                console.error(e);
                this.showError('Failed to export data');
            }
            if (headerMenu) {
                headerMenu.setAttribute('aria-hidden', 'true');
                headerMenu.classList.remove('open');
            }
        });

        // Import data (JSON file picker, excludes audio blobs by design)
        headerImportBtn?.addEventListener('click', async () => {
            if (!confirm('Importing will replace current data (recordings metadata, meals, foods, ingredients, settings). Audio files are not included. Continue?')) {
                return;
            }
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/json,.json';
            input.addEventListener('change', async () => {
                const file = input.files && input.files[0];
                if (!file) return;
                try {
                    const text = await file.text();
                    const ok = this.storage.importData(text);
                    if (ok) {
                        this.refreshAllPages();
                        this.showToast('Import complete', 'success');
                    } else {
                        this.showError('Import failed: invalid file');
                    }
                } catch (e) {
                    console.error('Import error', e);
                    this.showError('Import error');
                }
            }, { once: true });
            input.click();
            if (headerMenu) {
                headerMenu.setAttribute('aria-hidden', 'true');
                headerMenu.classList.remove('open');
            }
        });

        // Close header menu when clicking outside
        document.addEventListener('click', (e) => {
            if (headerMenu && headerMenu.classList.contains('open')) {
                headerMenu.setAttribute('aria-hidden', 'true');
                headerMenu.classList.remove('open');
            }
        });

        // Close settings modal
        closeSettingsModal?.addEventListener('click', () => {
            this.closeModal('settingsModal');
        });

        // Handle settings form submission
        settingsForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });

        // Clear API key
        clearApiKeyBtn?.addEventListener('click', () => {
            document.getElementById('geminiApiKey').value = '';
        });

        // Click outside to close
        settingsModal?.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                this.closeModal('settingsModal');
            }
        });

        // Load settings on startup
        this.loadSettings();
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        const apiKey = localStorage.getItem('geminiApiKey') || '';

        document.getElementById('geminiApiKey').value = apiKey;

        // Initialize Gemini AI if we have an API key
        if (apiKey) {
            try {
                this.geminiAI.initialize(apiKey);
            } catch (error) {
                console.error('Failed to initialize Gemini AI:', error);
                this.showError('Failed to initialize Gemini AI. Please check your API key.');
            }
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        const apiKey = document.getElementById('geminiApiKey').value.trim();

        if (!apiKey) {
            this.showError('Please enter a valid API key');
            return;
        }

        localStorage.setItem('geminiApiKey', apiKey);

        // Initialize Gemini AI
        try {
            this.geminiAI.initialize(apiKey);
            
        } catch (error) {
            console.error('Failed to initialize Gemini AI:', error);
            this.showError('Invalid API key. Please check and try again.');
            return;
        }

        this.closeModal('settingsModal');
    }

    /**
     * Get the active AI manager
     */
    getActiveAIManager() {
        const apiKey = localStorage.getItem('geminiApiKey');
        
        if (!apiKey || !this.geminiAI.isInitialized()) {
            throw new Error('API key required. Please configure your Gemini API key in Settings.');
        }
        
        return this.geminiAI;
    }

    /**
     * Show modal
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    /**
     * Close modal
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Show success message
     */
    showMessage(message) {
        // For now, use console.log. In a real app, you'd show a toast/notification
        console.log('Success:', message);
        alert(message); // Simple alert for demo
    }

    /**
     * Show error message
     */
    showError(message) {
        console.error('Error:', message);
        alert('Error: ' + message); // Simple alert for demo
    }

    downloadFile(filename, textContent) {
        try {
            const blob = new Blob([textContent], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 0);
        } catch (e) {
            console.error('Download error', e);
            this.showError('Failed to start download');
        }
    }
}

/**
 * Record Manager
 * Handles the Records page functionality
 */
class RecordManager {
    constructor(storage, getAIManager) {
        this.storage = storage;
        this.getAIManager = getAIManager;
        this.recordsList = document.getElementById('recordsList');
        this.selectedRecords = new Set();
        this.selectionMode = false;
        this.setupModals();
    }

    setupModals() {
        // Record details modal
        const recordModal = document.getElementById('recordDetailsModal');
        const recordCloseBtn = recordModal?.querySelector('#closeRecordModal');
        recordCloseBtn?.addEventListener('click', () => this.closeModal('recordDetailsModal'));

        // Clarification modal - create if doesn't exist
        let clarifyModal = document.getElementById('clarificationModal');
        if (!clarifyModal) {
            // Create clarification modal dynamically
            this.createClarificationModal();
            clarifyModal = document.getElementById('clarificationModal');
        }
        
        const clarifyCloseBtn = clarifyModal?.querySelector('.modal-close');
        const clarifySubmitBtn = clarifyModal?.querySelector('#clarify-submit');
        clarifyCloseBtn?.addEventListener('click', () => this.closeModal('clarificationModal'));
        clarifySubmitBtn?.addEventListener('click', () => this.submitClarification());

        // Click outside to close
        [recordModal, clarifyModal].forEach(modal => {
            modal?.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }

    createClarificationModal() {
        const modalHtml = `
            <div id="clarificationModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>AI Clarification</h2>
                        <span class="modal-close">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div id="clarificationContent">
                            <p>Processing your recording...</p>
                        </div>
                        <div class="clarification-actions" style="display: none;">
                            <button id="clarify-submit" class="btn-primary">Submit Response</button>
                            <button class="btn-secondary modal-close">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    refreshRecordsList() {
        if (!this.recordsList) return;

        const records = this.storage.getAudioRecords();
        
        if (records.length === 0) {
            // No records: leave the list empty (no placeholder text)
            this.recordsList.innerHTML = '';
            this.hideSelectionBar();
            return;
        }

        // Show selection bar if in selection mode or has selected items
        if (this.selectionMode || this.selectedRecords.size > 0) {
            this.showSelectionBar();
        } else {
            this.hideSelectionBar();
        }

        // Group records by date
        const groupedRecords = this.groupRecordsByDate(records);
        
        let html = '';
        for (let [date, dateRecords] of Object.entries(groupedRecords)) {
            const isCollapsed = localStorage.getItem(`collapsed-${date}`) === 'true';
            html += `
                <div class="date-section">
                    <div class="date-header" onclick="window.app.recordManager.toggleDateSection('${date}')">
                        <span class="date-text">${this.formatDateHeader(date)}</span>
                        <span class="record-count">${dateRecords.length} recording${dateRecords.length > 1 ? 's' : ''}</span>
                        <span class="collapse-icon">${isCollapsed ? '▶' : '▼'}</span>
                    </div>
                    <div class="date-records ${isCollapsed ? 'collapsed' : ''}">
                        ${dateRecords.map(record => this.renderRecordItem(record)).join('')}
                    </div>
                </div>
            `;
        }
        
        this.recordsList.innerHTML = html;
        this.bindRecordEvents();
    }

    toggleDateSection(date) {
        const dateSection = this.recordsList.querySelector(`[onclick*="${date}"]`).parentElement;
        const recordsContainer = dateSection.querySelector('.date-records');
        const collapseIcon = dateSection.querySelector('.collapse-icon');
        
        const isCollapsed = recordsContainer.classList.toggle('collapsed');
        collapseIcon.textContent = isCollapsed ? '▶' : '▼';
        
        // Save state
        localStorage.setItem(`collapsed-${date}`, isCollapsed.toString());
    }

    groupRecordsByDate(records) {
        const grouped = {};
        
        records.forEach(record => {
            const date = record.recordedDate;
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(record);
        });
        
        // Sort dates descending
        const sortedGrouped = {};
        Object.keys(grouped)
            .sort((a, b) => new Date(b) - new Date(a))
            .forEach(key => {
                sortedGrouped[key] = grouped[key].sort((a, b) => 
                    new Date(`${b.recordedDate} ${b.recordedTime}`) - new Date(`${a.recordedDate} ${a.recordedTime}`)
                );
            });
        
        return sortedGrouped;
    }

    renderRecordItem(record) {
        const hasTranscription = record.transcribed && record.transcriptionData;
        const preview = hasTranscription ? this.getTranscriptionPreview(record) : '';
        const isComplete = this.isRecordComplete(record);
        const dateShort = this.formatShortDate(record.recordedDate);
        const isSelected = this.selectedRecords.has(record.id);
        const canSelect = !hasTranscription; // Only non-transcribed can be selected

        return `
            <div class="record-item ${isSelected ? 'selected' : ''}" data-record-id="${record.id}" 
                 onclick="${canSelect ? `window.app.recordManager.toggleRecordSelection('${record.id}')` : ''}"
                 oncontextmenu="window.app.recordManager.showContextMenu(event, '${record.id}')">
                ${canSelect ? `<span class="selection-checkbox">${isSelected ? '☑' : '☐'}</span>` : ''}
                <span class="record-date">${dateShort}</span>
                <span class="status-checkbox ${isComplete ? 'complete' : 'incomplete'}" title="${isComplete ? 'Complete' : 'Incomplete'}">${isComplete ? '☑' : '☐'}</span>
                <button class="btn-icon" onclick="event.stopPropagation(); window.app.recordManager.showRecordDetails('${record.id}')" title="Details" aria-label="Details">
                    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                        <path d="M9 0H3a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5L9 0zm0 1l4 4H9V1z"/>
                    </svg>
                </button>
                <button class="btn-icon" onclick="event.stopPropagation(); window.app.recordManager.playRecord('${record.id}')" title="Play" aria-label="Play">
                    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                        <path d="M4 2v12l9-6z"/>
                    </svg>
                </button>
                <span class="record-text" title="${preview.replace(/"/g, '&quot;')}">${preview || 'Not transcribed yet'}</span>
                <button class="btn-icon" onclick="event.stopPropagation(); if(confirm('Delete this recording? This action cannot be undone.')) window.app.recordManager.deleteRecord('${record.id}')" title="Delete" aria-label="Delete">
                    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
                        <path d="M5.5 5.5a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0v-6a.5.5 0 0 1 .5-.5zm5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0v-6a.5.5 0 0 1 .5-.5z"/>
                        <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 1 1 0-2H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4 4v9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4H4zM6 2a.5.5 0 0 0-.5.5V3h5v-.5A.5.5 0 0 0 10 2H6z"/>
                    </svg>
                </button>
            </div>
        `;
    }

    formatShortDate(dateString) {
        try {
            const d = new Date(dateString);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch (e) {
            return dateString;
        }
    }

    isRecordComplete(record) {
        if (!record.transcribed || !record.transcriptionData) return false;
        try {
            const data = JSON.parse(record.transcriptionData);
            return data.status === 'complete' || data.status === 'processed' || record.transcribed === true;
        } catch (e) {
            return !!record.transcribed;
        }
    }

    getStatusIcon(record) {
        if (!record.transcribed) return '⏳ Processing...';
        
        try {
            const data = JSON.parse(record.transcriptionData);
            if (data.status === 'needs_clarification') return '❓ Needs Info';
            if (data.status === 'complete') return '✅ Complete';
            if (data.status === 'error') return '❌ Error';
        } catch (e) {
            // Fallback for old format
        }
        
        return record.transcribed ? '✅ Complete' : '⏳ Processing...';
    }

    getTranscriptionPreview(record) {
        if (!record.transcriptionData) return '';
        
        try {
            const data = JSON.parse(record.transcriptionData);
            const text = data.raw_transcription || '';
            return text.length > 50 ? text.substring(0, 50) + '...' : text;
        } catch (e) {
            return '';
        }
    }

    showContextMenu(event, recordId) {
        event.preventDefault();
        if (confirm('Delete this recording? This action cannot be undone.')) {
            this.deleteRecord(recordId);
        }
    }

    deleteRecord(recordId) {
        this.storage.deleteAudioRecord(recordId);
        this.refreshRecordsList();
    }

    showRecordDetails(recordId) {
        const records = this.storage.getAudioRecords();
        const record = records.find(r => r.id === recordId);
        if (!record) return;
        
        const modal = document.getElementById('recordDetailsModal');
        if (!modal) {
            console.error('Record details modal not found');
            return;
        }
        const content = modal.querySelector('#recordDetailsBody');
        
    const time = new Date(`${record.recordedDate} ${record.recordedTime}`).toLocaleString('en-GB', { hour12: false });
        const duration = record.duration ? `${record.duration}s` : 'Unknown';
        
        let transcriptionHtml = '';
        let aiResponseHtml = '';
        let actionButtons = '';
        
        if (record.transcribed && record.transcriptionData) {
            try {
                const data = JSON.parse(record.transcriptionData);
                transcriptionHtml = `
                    <div class="detail-row full-width">
                        <span class="detail-label">Transcription:</span>
                        <div class="transcription-text">${data.raw_transcription}</div>
                    </div>
                `;
                
                if (data.processed_data) {
                    aiResponseHtml = `
                        <div class="detail-row full-width">
                            <span class="detail-label">AI Analysis:</span>
                            <div class="ai-response"><pre>${JSON.stringify(data.processed_data, null, 2)}</pre></div>
                        </div>
                    `;
                }
                
                if (data.status === 'needs_clarification') {
                    actionButtons = `
                        <div class="detail-actions">
                            <button class="btn-primary" onclick="window.app.recordManager.showClarification('${recordId}')">Provide More Info</button>
                        </div>
                    `;
                }
            } catch (e) {
                transcriptionHtml = `
                    <div class="detail-row full-width">
                        <span class="detail-label">Transcription:</span>
                        <div class="transcription-text">Error parsing transcription data</div>
                    </div>
                `;
            }
        }
        
        content.innerHTML = `
            <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${time}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Duration:</span>
                <span class="detail-value">${duration}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">${this.getStatusIcon(record)}</span>
            </div>
            ${transcriptionHtml}
            ${aiResponseHtml}
            ${actionButtons}
        `;
        
        this.showModal('recordDetailsModal');
    }

    showClarification(recordId) {
        const record = this.storage.getAudioRecords().find(r => r.id === recordId);
        if (!record) return;
        
        this.closeModal('recordDetailsModal');
        
        const modal = document.getElementById('clarificationModal');
        if (!modal) {
            console.error('Clarification modal not found');
            return;
        }
        modal.dataset.recordId = recordId;
        
        const questions = modal.querySelector('#clarification-questions');
        questions.innerHTML = `
            <div class="clarification-question">
                <label>What type of activity was this?</label>
                <select id="activity-type">
                    <option value="">Select...</option>
                    <option value="cooking">Cooking/Preparing Food</option>
                    <option value="eating">Eating Food</option>
                </select>
            </div>
            <div class="clarification-question">
                <label>Additional details:</label>
                <textarea id="additional-details" placeholder="Provide any additional context..."></textarea>
            </div>
        `;
        
        this.showModal('clarificationModal');
    }

    submitClarification() {
        const modal = document.getElementById('clarificationModal');
        const recordId = modal.dataset.recordId;
        const activityType = document.getElementById('activity-type').value;
        const additionalDetails = document.getElementById('additional-details').value;
        
        if (!activityType) {
            alert('Please select an activity type');
            return;
        }
        
        // Update record with clarification
        const records = this.storage.getAudioRecords();
        const record = records.find(r => r.id === recordId);
        if (record) {
            // Add clarification to existing data
            let transcriptionData;
            try {
                transcriptionData = JSON.parse(record.transcriptionData);
            } catch (e) {
                transcriptionData = {};
            }
            
            transcriptionData.clarification = {
                activityType,
                additionalDetails,
                timestamp: Date.now()
            };
            transcriptionData.status = 'processing';
            
            record.transcriptionData = JSON.stringify(transcriptionData);
            this.storage.updateAudioRecord(recordId, record);
            
            // Reprocess with AI
            this.reprocessWithClarification(recordId);
        }
        
        this.closeModal('clarificationModal');
        this.refreshRecordsList();
    }

    async reprocessWithClarification(recordId) {
        const records = this.storage.getAudioRecords();
        const record = records.find(r => r.id === recordId);
        if (!record) return;
        
        try {
            const transcriptionData = JSON.parse(record.transcriptionData);
            const clarification = transcriptionData.clarification;
            
            // Use the active AI manager for reprocessing
            const aiManager = window.app.getActiveAIManager();
            
            // Process clarification with AI
            const aiResponse = await aiManager.processClarification ? 
                await aiManager.processClarification(transcriptionData, clarification) :
                await aiManager.simulateAIResponse(null, clarification);
            
            // Update record with AI response
            transcriptionData.ai_response = aiResponse;
            transcriptionData.status = 'complete';
            record.transcriptionData = JSON.stringify(transcriptionData);
            this.storage.updateAudioRecord(recordId, record);
            
            // Handle AI response and save to appropriate storage
            if (aiResponse && aiManager.handleAIResponse) {
                await aiManager.handleAIResponse(aiResponse, recordId);
            }
            
            this.refreshRecordsList();
            
            // Refresh other pages
            if (window.app) {
                window.app.refreshAllPages();
            }
            
        } catch (error) {
            console.error('Error reprocessing with clarification:', error);
            
            // Update record status to error
            const transcriptionData = JSON.parse(record.transcriptionData);
            transcriptionData.status = 'error';
            transcriptionData.error_message = error.message;
            record.transcriptionData = JSON.stringify(transcriptionData);
            this.storage.updateAudioRecord(recordId, record);
            this.refreshRecordsList();
        }
    }

    bindRecordEvents() {
        // Events are now handled via onclick attributes and context menus
        // This ensures proper event binding even after dynamic content updates
    }

    showTranscription(recordId) {
        // This method is now replaced by showRecordDetails
        this.showRecordDetails(recordId);
    }

    playRecord(recordId) {
        // Placeholder for audio playback functionality
        console.log('Playing record:', recordId);
        alert('Audio playback feature coming soon!');
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal?.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal?.classList.remove('show');
        document.body.style.overflow = '';
    }

    formatDateHeader(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (dateString === today.toISOString().split('T')[0]) {
            return 'Today';
        } else if (dateString === yesterday.toISOString().split('T')[0]) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
            });
        }
    }

    toggleRecordSelection(recordId) {
        if (this.selectedRecords.has(recordId)) {
            this.selectedRecords.delete(recordId);
        } else {
            this.selectedRecords.add(recordId);
        }
        this.refreshRecordsList();
    }

    showSelectionBar() {
        let bar = document.getElementById('batchSelectionBar');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'batchSelectionBar';
            bar.className = 'batch-selection-bar';
            bar.innerHTML = `
                <span id="selectionCount">0 selected</span>
                <button id="sendAllBtn" class="action-btn primary">Send All to AI</button>
                <button id="clearSelectionBtn" class="action-btn secondary">Clear</button>
            `;
            const recordsSection = document.querySelector('.records-section');
            if (recordsSection) {
                recordsSection.insertBefore(bar, this.recordsList);
            }
            
            document.getElementById('sendAllBtn')?.addEventListener('click', () => this.batchSendToAI());
            document.getElementById('clearSelectionBtn')?.addEventListener('click', () => this.clearSelection());
        }
        
        const count = this.selectedRecords.size;
        const countEl = document.getElementById('selectionCount');
        if (countEl) countEl.textContent = `${count} selected`;
        
        const sendBtn = document.getElementById('sendAllBtn');
        if (sendBtn) sendBtn.disabled = count === 0;
        
        bar.style.display = 'flex';
    }

    hideSelectionBar() {
        const bar = document.getElementById('batchSelectionBar');
        if (bar) bar.style.display = 'none';
    }

    clearSelection() {
        this.selectedRecords.clear();
        this.selectionMode = false;
        this.refreshRecordsList();
    }

    async batchSendToAI() {
        if (this.selectedRecords.size === 0) return;

        const recordIds = Array.from(this.selectedRecords);
        const records = this.storage.getAudioRecords().filter(r => recordIds.includes(r.id));

        if (!confirm(`Send ${records.length} recording(s) to AI for processing?`)) {
            return;
        }

        try {
            // Show loading overlay
            const overlay = document.getElementById('loadingOverlay');
            const loadingText = document.querySelector('.loading-text');
            if (overlay) overlay.classList.add('show');
            if (loadingText) loadingText.textContent = `Processing 0 of ${records.length}...`;

            const aiManager = this.getAIManager();
            const audioDataArray = records.map(record => ({
                blob: record.blob,
                mimeType: record.mimeType || 'audio/webm',
                recordId: record.id
            }));

            const batchResult = await aiManager.processBatchAudio(audioDataArray);

            // Update records with results
            let successCount = 0;
            for (let i = 0; i < batchResult.results.length; i++) {
                const result = batchResult.results[i];
                const record = records[i];

                if (loadingText) loadingText.textContent = `Processing ${i + 1} of ${records.length}...`;

                if (result.success) {
                    // Update record with transcription
                    this.storage.updateAudioRecord(record.id, {
                        transcribed: true,
                        transcriptionData: JSON.stringify(result.data)
                    });

                    // Handle AI response and save to appropriate storage
                    if (aiManager.handleAIResponse) {
                        await aiManager.handleAIResponse(result.data, record.id);
                    }

                    successCount++;
                }
            }

            // Hide loading overlay
            if (overlay) overlay.classList.remove('show');

            // Clear selection and refresh
            this.clearSelection();
            this.refreshRecordsList();

            // Refresh other pages
            if (window.app) {
                window.app.refreshAllPages();
            }

            // Show result toast
            const errorCount = records.length - successCount;
            let message = `Processed ${successCount} of ${records.length} recordings`;
            if (errorCount > 0) {
                message += ` (${errorCount} failed)`;
            }
            window.app?.showToast(message, errorCount > 0 ? 'error' : 'success', 5000);

        } catch (error) {
            console.error('Batch processing error:', error);
            const overlay = document.getElementById('loadingOverlay');
            if (overlay) overlay.classList.remove('show');
            window.app?.showToast('Batch processing failed: ' + error.message, 'error');
        }
    }
}

/**
 * Cook Manager
 * Handles the Cook page functionality
 */
class CookManager {
    constructor(storage) {
        this.storage = storage;
        this.mealsList = document.getElementById('mealsList');
        this.editIngredients = [];
        this.setupModals();

        // Manual add buttons (header and floating)
        const addBtn = document.getElementById('addMealBtn');
        addBtn?.addEventListener('click', () => this.openCreateMeal());
        const fabAdd = document.getElementById('fabAddMeal');
        fabAdd?.addEventListener('click', () => this.openCreateMeal());
    }

    // Convert ANY time format to 24-hour format (HH:MM)
    formatTime24(timeString) {
        if (!timeString) return '';
        
        // If already in 24-hour format (HH:MM or HH:MM:SS), just return first 5 chars
        if (timeString.match(/^\d{2}:\d{2}/)) {
            return timeString.substring(0, 5);
        }
        
        // If in 12-hour format with AM/PM, convert it
        const match = timeString.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)/i);
        if (match) {
            let hours = parseInt(match[1]);
            const minutes = match[2];
            const period = match[4].toUpperCase();
            
            if (period === 'PM' && hours !== 12) {
                hours += 12;
            } else if (period === 'AM' && hours === 12) {
                hours = 0;
            }
            
            return `${hours.toString().padStart(2, '0')}:${minutes}`;
        }
        
        return timeString;
    }

    setupModals() {
        // Meal details modal
        const mealModal = document.getElementById('mealDetailsModal');
        const mealCloseBtn = document.getElementById('closeMealModal');
        mealCloseBtn?.addEventListener('click', () => this.closeModal('mealDetailsModal'));

        // Edit/Delete in details header
        const editMealBtn = document.getElementById('editMealBtn');
        const deleteMealBtn = document.getElementById('deleteMealBtn');
        editMealBtn?.addEventListener('click', () => {
            const currentId = document.getElementById('mealDetailsModal')?.dataset.mealId;
            if (currentId) {
                this.closeModal('mealDetailsModal');
                this.openEditMeal(currentId);
            }
        });
        deleteMealBtn?.addEventListener('click', () => {
            const currentId = document.getElementById('mealDetailsModal')?.dataset.mealId;
            if (currentId && confirm('Delete this meal? This action cannot be undone.')) {
                this.closeModal('mealDetailsModal');
                this.deleteMeal(currentId);
            }
        });

        // Click outside to close
        mealModal?.addEventListener('click', (e) => {
            if (e.target === mealModal) {
                this.closeModal('mealDetailsModal');
            }
        });

        // Create cooked meal modal
    const createModal = document.getElementById('mealCreateModal');
        const closeCreateBtn = document.getElementById('closeMealCreate');
        const cancelCreateBtn = document.getElementById('cancelMealCreate');
        const createForm = document.getElementById('mealCreateForm');
        const hourSelect = document.getElementById('mealTimeHour');
        const minuteSelect = document.getElementById('mealTimeMinute');
        const hiddenTime = document.getElementById('mealTime');
        const addIngBtn = document.getElementById('addIngredientBtn');
        const ingList = document.getElementById('ingredientsList');
        const ingName = document.getElementById('ingName');
        const ingWeight = document.getElementById('ingWeight');
        const ingCals100 = document.getElementById('ingCals100');

        closeCreateBtn?.addEventListener('click', () => this.closeModal('mealCreateModal'));
        cancelCreateBtn?.addEventListener('click', () => this.closeModal('mealCreateModal'));
        createForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCreateMeal();
        });

        // Ingredients: add button
        addIngBtn?.addEventListener('click', () => {
            const name = (ingName?.value || '').trim();
            const weight = parseFloat(ingWeight?.value || '0');
            const cals100 = parseFloat(ingCals100?.value || '0');
            if (!name || weight <= 0 || cals100 < 0) {
                window.app?.showToast?.('Enter name, positive weight, and cal/100g', 'error');
                return;
            }
            const totalCalories = Math.round((weight * cals100) / 100);
            this.editIngredients.push({ name, weight, caloriesPer100g: cals100, totalCalories });
            if (ingName) ingName.value = '';
            if (ingWeight) ingWeight.value = '';
            if (ingCals100) ingCals100.value = '';
            this.renderIngredientsEditor();
        });

        // Ingredients: delegate input and delete
        ingList?.addEventListener('input', (e) => {
            const row = e.target.closest('[data-index]');
            if (!row) return;
            const idx = parseInt(row.dataset.index, 10);
            const field = e.target.getAttribute('data-field');
            if (Number.isNaN(idx) || !field) return;
            if (field === 'name') {
                this.editIngredients[idx].name = e.target.value;
            } else if (field === 'weight') {
                const w = parseFloat(e.target.value || '0');
                this.editIngredients[idx].weight = w;
            } else if (field === 'cals100') {
                const c = parseFloat(e.target.value || '0');
                this.editIngredients[idx].caloriesPer100g = c;
            }
            // Recompute per-row calories and totals
            const ing = this.editIngredients[idx];
            ing.totalCalories = Math.round((ing.weight || 0) * (ing.caloriesPer100g || 0) / 100);
            this.updateIngredientRow(row, ing);
            this.updateIngredientsTotals();
        });
        ingList?.addEventListener('click', (e) => {
            const delBtn = e.target.closest('[data-action="delete-ing"]');
            if (!delBtn) return;
            const row = delBtn.closest('[data-index]');
            if (!row) return;
            const idx = parseInt(row.dataset.index, 10);
            this.editIngredients.splice(idx, 1);
            this.renderIngredientsEditor();
        });

        // Populate 24h selects
        if (hourSelect && minuteSelect) {
            if (hourSelect.options.length === 0) {
                for (let h = 0; h < 24; h++) {
                    const opt = document.createElement('option');
                    opt.value = h.toString().padStart(2, '0');
                    opt.textContent = h.toString().padStart(2, '0');
                    hourSelect.appendChild(opt);
                }
            }
            if (minuteSelect.options.length === 0) {
                for (let m = 0; m < 60; m += 5) {
                    const opt = document.createElement('option');
                    opt.value = m.toString().padStart(2, '0');
                    opt.textContent = m.toString().padStart(2, '0');
                    minuteSelect.appendChild(opt);
                }
            }

            const syncHidden = () => {
                if (hiddenTime) hiddenTime.value = `${hourSelect.value}:${minuteSelect.value}`;
            };
            hourSelect.addEventListener('change', syncHidden);
            minuteSelect.addEventListener('change', syncHidden);
        }
    }

    refreshMealsList() {
        if (!this.mealsList) return;

        const meals = this.storage.getCookingRecords();
        
        if (meals.length === 0) {
            this.mealsList.innerHTML = `
                <div class="empty-state">
                    <p>No cooked meals yet. Record cooking activities to get started!</p>
                </div>
            `;
            return;
        }

        // Group meals by date
        const groupedMeals = this.groupMealsByDate(meals);
        
        let html = '';
        for (let [date, dateMeals] of Object.entries(groupedMeals)) {
            html += `
                <div class="date-group">
                    <h4 class="date-header">${this.formatDateHeader(date)}</h4>
                    ${dateMeals.map(meal => this.renderMealItem(meal)).join('')}
                </div>
            `;
        }
        
        this.mealsList.innerHTML = html;
        this.bindMealEvents();
    }

    groupMealsByDate(meals) {
        const grouped = {};
        
        meals.forEach(meal => {
            const date = meal.cookedDate;
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(meal);
        });
        
        // Sort dates descending
        const sortedGrouped = {};
        Object.keys(grouped)
            .sort((a, b) => new Date(b) - new Date(a))
            .forEach(key => {
                sortedGrouped[key] = grouped[key].sort((a, b) => 
                    new Date(`${b.cookedDate} ${b.cookedTime}`) - new Date(`${a.cookedDate} ${a.cookedTime}`)
                );
            });
        
        return sortedGrouped;
    }

    renderMealItem(meal) {
        const progressPercent = ((meal.totalWeight - meal.remainingWeight) / meal.totalWeight) * 100;
        const caloriesPerGram = meal.totalCalories / meal.totalWeight;
        const remainingCalories = Math.round(meal.remainingWeight * caloriesPerGram);
        
        return `
            <div class="meal-item" data-meal-id="${meal.id}">
                <div class="item-header">
                    <span class="item-time">${this.formatTime24(meal.cookedTime)}</span>
                    <div class="meal-actions-header">
                        <button class="btn-icon" onclick="window.app.cookManager.showMealDetails('${meal.id}')" title="View Details">👁️</button>
                        <button class="btn-icon" onclick="window.app.cookManager.deleteMeal('${meal.id}')" title="Delete">🗑️</button>
                    </div>
                </div>
                <div class="item-title">${meal.mealName}</div>
                <div class="meal-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                    <div class="progress-text">${meal.remainingWeight}g remaining of ${meal.totalWeight}g</div>
                </div>
                <div class="item-details">
                    <span class="calories-info">${remainingCalories} cal remaining (${meal.totalCalories} total)</span>
                    ${meal.ingredients && meal.ingredients.length > 0 ? 
                        `<span class="ingredients-preview">${meal.ingredients.slice(0, 3).join(', ')}${meal.ingredients.length > 3 ? '...' : ''}</span>` : 
                        ''
                    }
                </div>
                <div class="meal-actions">
                    <input type="number" class="serving-input" data-meal-id="${meal.id}" placeholder="Serving (g)" min="1" max="${meal.remainingWeight}" value="100">
                    <button class="add-serving-btn" onclick="window.app.cookManager.addServing('${meal.id}')">Add to Eaten</button>
                </div>
            </div>
        `;
    }

    bindMealEvents() {
        // Most events are now handled via onclick attributes for better reliability
        // Handle input validation
        const servingInputs = this.mealsList.querySelectorAll('.serving-input');
        servingInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const max = parseInt(e.target.getAttribute('max'));
                const value = parseInt(e.target.value);
                if (value > max) {
                    e.target.value = max;
                }
                if (value < 1) {
                    e.target.value = 1;
                }
            });
        });
    }

    showMealDetails(mealId) {
        const meals = this.storage.getCookingRecords();
        const meal = meals.find(m => m.id === mealId);
        if (!meal) return;
        
        const modal = document.getElementById('mealDetailsModal');
        const content = document.getElementById('mealDetailsBody');
        if (modal) modal.dataset.mealId = mealId;
        const titleEl = document.getElementById('mealDetailsTitle');
        if (titleEl) titleEl.textContent = meal.mealName || 'Meal Details';
        
    const cookedTime = new Date(`${meal.cookedDate} ${meal.cookedTime}`).toLocaleString('en-GB', { hour12: false });
        const progressPercent = ((meal.totalWeight - meal.remainingWeight) / meal.totalWeight) * 100;
        const caloriesPerGram = meal.totalCalories / meal.totalWeight;
        const remainingCalories = Math.round(meal.remainingWeight * caloriesPerGram);
        const consumedCalories = meal.totalCalories - remainingCalories;
        
        content.innerHTML = `
            <div class="detail-row">
                <span class="detail-label">Cooked:</span>
                <span class="detail-value">${cookedTime}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Total Weight:</span>
                <span class="detail-value">${meal.totalWeight}g</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Remaining:</span>
                <span class="detail-value">${meal.remainingWeight}g (${remainingCalories} cal)</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Consumed:</span>
                <span class="detail-value">${meal.totalWeight - meal.remainingWeight}g (${consumedCalories} cal)</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Progress:</span>
                <div class="detail-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                    <span class="progress-percent">${Math.round(progressPercent)}%</span>
                </div>
            </div>
            ${meal.servings ? `
                <div class="detail-row">
                    <span class="detail-label">Servings:</span>
                    <span class="detail-value">${meal.servings}</span>
                </div>
            ` : ''}
            ${meal.ingredients && meal.ingredients.length > 0 ? `
                <div class="detail-row full-width">
                    <span class="detail-label">Ingredients:</span>
                    <div class="ingredients-list">
                        ${meal.ingredients.map(ingredient => `<span class="ingredient-tag">${ingredient}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
            <div class="detail-actions">
                <div class="serving-calculator">
                    <label>Add serving to Eat page:</label>
                    <div class="serving-input-group">
                        <input type="number" id="modal-serving-weight" value="100" min="1" max="${meal.remainingWeight}">
                        <span>g (${Math.round(100 * caloriesPerGram)} cal)</span>
                        <button class="btn-primary" onclick="window.app.cookManager.addServingFromModal('${mealId}')">Add to Eaten</button>
                    </div>
                </div>
            </div>
        `;
        
        // Update calories dynamically
        const servingInput = content.querySelector('#modal-serving-weight');
        const caloriesSpan = content.querySelector('.serving-input-group span');
        servingInput?.addEventListener('input', (e) => {
            const weight = parseInt(e.target.value) || 0;
            const calories = Math.round(weight * caloriesPerGram);
            caloriesSpan.textContent = `g (${calories} cal)`;
            
            // Validation
            if (weight > meal.remainingWeight) {
                e.target.value = meal.remainingWeight;
                caloriesSpan.textContent = `g (${Math.round(meal.remainingWeight * caloriesPerGram)} cal)`;
            }
            if (weight < 1) {
                e.target.value = 1;
                caloriesSpan.textContent = `g (${Math.round(caloriesPerGram)} cal)`;
            }
        });
        
        this.showModal('mealDetailsModal');
    }

    openEditMeal(mealId) {
        const meal = this.storage.getCookingRecords().find(m => m.id === mealId);
        if (!meal) return;

        const createModal = document.getElementById('mealCreateModal');
        const title = document.getElementById('mealCreateTitle');
        const nameInput = document.getElementById('mealName');
        const weightInput = document.getElementById('mealTotalWeight');
        const caloriesInput = document.getElementById('mealTotalCalories');
        const dateInput = document.getElementById('mealDate');
        const hourSelect = document.getElementById('mealTimeHour');
        const minuteSelect = document.getElementById('mealTimeMinute');
        const hiddenTime = document.getElementById('mealTime');

        if (title) title.textContent = 'Edit Cooked Meal';
        if (createModal) createModal.dataset.editMealId = mealId;

        if (nameInput) nameInput.value = meal.mealName || '';
        if (weightInput) weightInput.value = meal.totalWeight || '';
        if (caloriesInput) caloriesInput.value = meal.totalCalories || 0;
        if (dateInput) dateInput.value = meal.cookedDate || new Date().toISOString().split('T')[0];

        const hhmm = this.formatTime24(meal.cookedTime || '00:00');
        const [hh, mm] = hhmm.split(':');
        if (hourSelect) hourSelect.value = hh;
        if (minuteSelect) minuteSelect.value = mm;
        if (hiddenTime) hiddenTime.value = `${hh}:${mm}`;

        // Load ingredients
        this.editIngredients = (this.storage.getIngredientsByMealId(mealId) || []).map(ing => ({
            name: ing.name,
            weight: ing.weight,
            caloriesPer100g: ing.caloriesPer100g,
            totalCalories: Math.round((ing.weight || 0) * (ing.caloriesPer100g || 0) / 100)
        }));
        this.renderIngredientsEditor();

        this.showModal('mealCreateModal');
    }

    addServing(mealId) {
        const input = this.mealsList.querySelector(`input[data-meal-id="${mealId}"]`);
        const servingWeight = parseInt(input?.value) || 100;
        this.addServingToEat(mealId, servingWeight);
    }

    addServingFromModal(mealId) {
        const input = document.getElementById('modal-serving-weight');
        const servingWeight = parseInt(input?.value) || 100;
        this.addServingToEat(mealId, servingWeight);
        this.closeModal('mealDetailsModal');
    }

    addServingToEat(mealId, servingWeight) {
        const meals = this.storage.getCookingRecords();
        const meal = meals.find(m => m.id === mealId);
        if (!meal || servingWeight > meal.remainingWeight) {
            alert('Invalid serving size or not enough remaining!');
            return;
        }
        
        // Calculate calories for this serving
        const caloriesPerGram = meal.totalCalories / meal.totalWeight;
        const servingCalories = Math.round(servingWeight * caloriesPerGram);
        
        // Add to eating records
        const now = new Date();
        const eatingRecord = {
            id: `eat_${Date.now()}`,
            foodName: meal.mealName,
            calories: servingCalories,
            weight: servingWeight,
            eatenDate: now.toISOString().split('T')[0],
            eatenTime: now.toTimeString().split(' ')[0].substring(0, 5),
            source: 'cooking',
            status: 'complete',
            originalMealId: mealId
        };
        
        this.storage.addEatingRecord(eatingRecord);
        
        // Update meal remaining weight
        meal.remainingWeight -= servingWeight;
        this.storage.updateCookingRecord(mealId, meal);
        
        // Refresh displays
        this.refreshMealsList();
        if (window.app && window.app.eatManager) {
            window.app.eatManager.refreshFoodList();
        }
        
        if (window.app?.showToast) {
            window.app.showToast(`Added ${servingWeight}g of ${meal.mealName} (${servingCalories} cal) to today's eaten food`, 'success');
        } else {
            console.log(`Added ${servingWeight}g of ${meal.mealName} (${servingCalories} cal) to today's eaten food`);
        }
    }

    deleteMeal(mealId) {
        if (confirm('Delete this meal? This action cannot be undone.')) {
            this.storage.deleteCookingRecord(mealId);
            this.refreshMealsList();
        }
    }

    openCreateMeal() {
        // Defaults
        const nameInput = document.getElementById('mealName');
        const weightInput = document.getElementById('mealTotalWeight');
        const caloriesInput = document.getElementById('mealTotalCalories');
        const dateInput = document.getElementById('mealDate');
        const hourSelect = document.getElementById('mealTimeHour');
        const minuteSelect = document.getElementById('mealTimeMinute');
        const hiddenTime = document.getElementById('mealTime');
        const title = document.getElementById('mealCreateTitle');
        const createModal = document.getElementById('mealCreateModal');

        if (title) title.textContent = 'Add Cooked Meal';
        if (createModal) delete createModal.dataset.editMealId;

        const now = new Date();
        const rounded = new Date(Math.round(now.getTime() / (5*60*1000)) * (5*60*1000));
        dateInput.value = now.toISOString().split('T')[0];
        const hh = rounded.getHours().toString().padStart(2, '0');
        const mm = rounded.getMinutes().toString().padStart(2, '0');
        if (hourSelect) hourSelect.value = hh;
        if (minuteSelect) minuteSelect.value = mm;
        if (hiddenTime) hiddenTime.value = `${hh}:${mm}`;

        // Clear fields
        if (nameInput) nameInput.value = '';
        if (weightInput) weightInput.value = '';
        if (caloriesInput) caloriesInput.value = '';

        // Reset ingredients editor
        this.editIngredients = [];
        this.renderIngredientsEditor();

        this.showModal('mealCreateModal');
    }

    saveCreateMeal() {
        const name = document.getElementById('mealName')?.value?.trim();
        const totalWeight = parseInt(document.getElementById('mealTotalWeight')?.value || '0', 10);
        const totalCalories = parseInt(document.getElementById('mealTotalCalories')?.value || '0', 10);
        const cookedDate = document.getElementById('mealDate')?.value;
        const cookedTime = document.getElementById('mealTime')?.value;
        const createModal = document.getElementById('mealCreateModal');
        const editingMealId = createModal?.dataset?.editMealId;

        if (!name || !cookedDate || !cookedTime || !totalWeight || totalWeight < 1) {
            if (window.app?.showToast) {
                window.app.showToast('Please fill in name, date, time, and a valid total weight.', 'error');
            } else {
                alert('Please fill in name, date, time, and a valid total weight.');
            }
            return;
        }

        // If ingredients exist, recompute totals from ingredients
        let computedWeight = 0;
        let computedCalories = 0;
        if (this.editIngredients && this.editIngredients.length > 0) {
            this.editIngredients.forEach(ing => {
                computedWeight += Number(ing.weight) || 0;
                // prefer recompute from cals/100g
                const tcal = Math.round(((Number(ing.weight) || 0) * (Number(ing.caloriesPer100g) || 0)) / 100);
                computedCalories += tcal;
            });
        }

        const hasIngredients = this.editIngredients && this.editIngredients.length > 0;
        const finalTotalWeight = hasIngredients ? computedWeight : totalWeight;
        const finalTotalCalories = hasIngredients ? computedCalories : (isNaN(totalCalories) ? 0 : totalCalories);

        if (editingMealId) {
            const existing = this.storage.getCookingRecords().find(m => m.id === editingMealId);
            if (!existing) return;
            const consumed = Math.max((existing.totalWeight || 0) - (existing.remainingWeight || 0), 0);
            const newRemaining = Math.max(finalTotalWeight - consumed, 0);
            const updated = this.storage.updateCookingRecord(editingMealId, {
                mealName: name,
                totalWeight: finalTotalWeight,
                totalCalories: finalTotalCalories,
                remainingWeight: newRemaining,
                cookedDate,
                cookedTime
            });

            // Update ingredients set
            if (hasIngredients) {
                this.storage.deleteIngredientsByMealId(editingMealId);
                this.editIngredients.forEach(ing => {
                    this.storage.addIngredient({
                        cookingRecordId: editingMealId,
                        name: ing.name,
                        weight: Number(ing.weight) || 0,
                        caloriesPer100g: Number(ing.caloriesPer100g) || 0
                    });
                });
            }
            this.closeModal('mealCreateModal');
            this.refreshMealsList();
            if (window.app?.showToast) {
                window.app.showToast(`Updated cooked meal: ${updated.mealName}`, 'success');
            }
        } else {
            const newMeal = this.storage.addCookingRecord({
                mealName: name,
                totalWeight: finalTotalWeight,
                totalCalories: finalTotalCalories,
                remainingWeight: finalTotalWeight,
                cookedDate,
                cookedTime,
                source: 'manual'
            });

            // Add ingredients if provided
            if (hasIngredients) {
                this.editIngredients.forEach(ing => {
                    this.storage.addIngredient({
                        cookingRecordId: newMeal.id,
                        name: ing.name,
                        weight: Number(ing.weight) || 0,
                        caloriesPer100g: Number(ing.caloriesPer100g) || 0
                    });
                });
            }

            this.closeModal('mealCreateModal');
            this.refreshMealsList();
            if (window.app?.showToast) {
                window.app.showToast(`Added cooked meal: ${newMeal.mealName}`, 'success');
            }
        }
    }

    // -------- Ingredients editor helpers --------
    renderIngredientsEditor() {
        const list = document.getElementById('ingredientsList');
        if (!list) return;
        if (!this.editIngredients) this.editIngredients = [];
        list.innerHTML = this.editIngredients.map((ing, i) => `
            <div class="ingredient-item" data-index="${i}">
                <div class="ingredient-info" style="flex:2; display:flex; gap:8px; align-items:center;">
                    <input class="form-input" data-field="name" value="${ing.name || ''}" placeholder="Name" />
                    <input class="form-input" data-field="weight" type="number" min="0" value="${ing.weight || 0}" placeholder="Weight (g)" style="max-width:120px;" />
                    <input class="form-input" data-field="cals100" type="number" min="0" value="${ing.caloriesPer100g || 0}" placeholder="Cal/100g" style="max-width:120px;" />
                    <span class="ingredient-details">= ${Math.round((Number(ing.weight)||0)*(Number(ing.caloriesPer100g)||0)/100)} cal</span>
                </div>
                <div class="ingredient-actions">
                    <button type="button" class="btn-icon" data-action="delete-ing" title="Remove">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                </div>
            </div>
        `).join('');
        this.updateIngredientsTotals();
    }

    updateIngredientRow(rowEl, ing) {
        const details = rowEl.querySelector('.ingredient-details');
        if (details) {
            const cal = Math.round(((Number(ing.weight)||0) * (Number(ing.caloriesPer100g)||0))/100);
            details.textContent = `= ${cal} cal`;
        }
    }

    updateIngredientsTotals() {
        const totalsEl = document.getElementById('ingredientsTotals');
        if (!totalsEl) return;
        const totalG = (this.editIngredients || []).reduce((s, ing) => s + (Number(ing.weight)||0), 0);
        const totalCal = (this.editIngredients || []).reduce((s, ing) => s + Math.round(((Number(ing.weight)||0) * (Number(ing.caloriesPer100g)||0))/100), 0);
        totalsEl.textContent = `Totals: ${Math.round(totalG)} g, ${Math.round(totalCal)} cal`;
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal?.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal?.classList.remove('show');
        document.body.style.overflow = '';
    }

    formatDateHeader(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (dateString === today.toISOString().split('T')[0]) {
            return 'Today';
        } else if (dateString === yesterday.toISOString().split('T')[0]) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
            });
        }
    }
}

/**
 * Eat Manager
 * Handles the Eat page functionality
 */
class EatManager {
    constructor(storage) {
        this.storage = storage;
        this.currentDate = new Date().toISOString().split('T')[0];
        this.foodList = document.getElementById('foodList');
        this.selectedDateElement = document.getElementById('selectedDate');
        this.dailyCaloriesElement = document.getElementById('dailyCalories');
        this.calorieProgressElement = document.getElementById('calorieProgress');
        
        this.bindDateNavigation();
        this.setupModals();

        // Manual add button
    const addBtn = document.getElementById('addFoodBtn');
    addBtn?.addEventListener('click', () => this.addFood());
    const fabAdd = document.getElementById('fabAddFood');
    fabAdd?.addEventListener('click', () => this.addFood());
    }

    // Convert ANY time format to 24-hour format (HH:MM)
    formatTime24(timeString) {
        if (!timeString) return '';
        
        // If already in 24-hour format (HH:MM or HH:MM:SS), just return first 5 chars
        if (timeString.match(/^\d{2}:\d{2}/)) {
            return timeString.substring(0, 5);
        }
        
        // If in 12-hour format with AM/PM, convert it
        const match = timeString.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)/i);
        if (match) {
            let hours = parseInt(match[1]);
            const minutes = match[2];
            const period = match[4].toUpperCase();
            
            if (period === 'PM' && hours !== 12) {
                hours += 12;
            } else if (period === 'AM' && hours === 12) {
                hours = 0;
            }
            
            return `${hours.toString().padStart(2, '0')}:${minutes}`;
        }
        
        return timeString;
    }

    setupModals() {
        // Food details modal
        const foodModal = document.getElementById('foodDetailsModal');
        const foodCloseBtn = document.getElementById('closeFoodModal');
        const foodCancelBtn = document.getElementById('cancelFoodEdit');
        const foodForm = document.getElementById('foodDetailsForm');
        const hourSelect = document.getElementById('foodTimeHour');
        const minuteSelect = document.getElementById('foodTimeMinute');
        const hiddenTime = document.getElementById('foodTime');
        
        foodCloseBtn?.addEventListener('click', () => this.closeModal('foodDetailsModal'));
        foodCancelBtn?.addEventListener('click', () => this.closeModal('foodDetailsModal'));
        
        // Handle form submission
        foodForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveFoodEdit();
        });

        // Build 24h picker options (00-23 and 00-59 step 5)
        if (hourSelect && hourSelect.options.length === 0) {
            for (let h = 0; h <= 23; h++) {
                const opt = document.createElement('option');
                opt.value = opt.textContent = h.toString().padStart(2, '0');
                hourSelect.appendChild(opt);
            }
        }
        if (minuteSelect && minuteSelect.options.length === 0) {
            for (let m = 0; m <= 59; m += 5) {
                const opt = document.createElement('option');
                opt.value = opt.textContent = m.toString().padStart(2, '0');
                minuteSelect.appendChild(opt);
            }
        }

        // Keep hidden HH:MM in sync
        const syncHidden = () => {
            if (!hourSelect || !minuteSelect || !hiddenTime) return;
            const hh = (hourSelect.value || '00').padStart(2, '0');
            const mm = (minuteSelect.value || '00').padStart(2, '0');
            hiddenTime.value = `${hh}:${mm}`;
        };
        hourSelect?.addEventListener('change', syncHidden);
        minuteSelect?.addEventListener('change', syncHidden);

        // Click outside to close
        foodModal?.addEventListener('click', (e) => {
            if (e.target === foodModal) {
                this.closeModal('foodDetailsModal');
            }
        });
    }

    bindDateNavigation() {
        const prevBtn = document.getElementById('prevDay');
        const nextBtn = document.getElementById('nextDay');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const date = new Date(this.currentDate);
                date.setDate(date.getDate() - 1);
                this.currentDate = date.toISOString().split('T')[0];
                this.updateDateDisplay();
                this.refreshFoodList();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const date = new Date(this.currentDate);
                date.setDate(date.getDate() + 1);
                this.currentDate = date.toISOString().split('T')[0];
                this.updateDateDisplay();
                this.refreshFoodList();
            });
        }
    }

    updateDateDisplay() {
        if (!this.selectedDateElement) return;
        
        const date = new Date(this.currentDate);
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().split('T')[0];
        
        let displayText;
        if (this.currentDate === today) {
            displayText = 'Today';
        } else if (this.currentDate === yesterdayString) {
            displayText = 'Yesterday';
        } else {
            displayText = date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
            });
        }
        
        this.selectedDateElement.textContent = displayText;
    }

    refreshFoodList() {
        if (!this.foodList) return;

        const foods = this.storage.getEatingRecordsByDate(this.currentDate);
        
        // Update daily calories
        const totalCalories = foods.reduce((sum, food) => sum + (food.calories || 0), 0);
        if (this.dailyCaloriesElement) {
            this.dailyCaloriesElement.textContent = totalCalories;
        }
        
        // Update progress bar (assuming 2000 cal daily goal)
        if (this.calorieProgressElement) {
            const percentage = Math.min((totalCalories / 2000) * 100, 100);
            this.calorieProgressElement.style.width = `${percentage}%`;
        }
        
        if (foods.length === 0) {
            this.foodList.innerHTML = `
                <div class="empty-state">
                    <p>No food logged for this day. Start recording or add from cooked meals!</p>
                </div>
            `;
            return;
        }

        // Sort foods by time
        foods.sort((a, b) => a.eatenTime.localeCompare(b.eatenTime));
        
        // Render all foods in a simple list
        const html = foods.map(food => this.renderFoodItem(food)).join('');
        
        this.foodList.innerHTML = html;
        this.bindFoodEvents();
    }

    renderFoodItem(food) {
        const status = food.status === 'complete' ? '' : ' (incomplete)';
        const caloriesPerGram = food.weight > 0 ? (food.calories / food.weight) : 0;
        const perGramText = caloriesPerGram > 0 ? ` · ${Math.round(caloriesPerGram)} cal/g` : '';
        const fromMeal = food.originalMealId ? '' : '';

        return `
            <div class="food-item compact" data-food-id="${food.id}"
                 ontouchstart="window.app.eatManager.handleTouchStart(event, '${food.id}')"
                 ontouchend="window.app.eatManager.handleTouchEnd(event, '${food.id}')"
                 ontouchmove="window.app.eatManager.handleTouchMove(event)">
                <span class="food-time">${this.formatTime24(food.eatenTime)}</span>
                <span class="food-source" title="${this.getSourceText(food.source)}">${this.getSourceIcon(food.source)}</span>
                <span class="food-text" title="${food.foodName} · ${food.weight}g · ${food.calories} cal${perGramText}">${food.foodName}${status} — ${food.weight}g · ${food.calories} cal${perGramText}</span>
                <div class="food-actions">
                    <button class="btn-icon" onclick="window.app.eatManager.editFood('${food.id}')" title="Edit">✏️</button>
                    <button class="btn-icon" onclick="window.app.eatManager.deleteFood('${food.id}')" title="Delete">🗑️</button>
                </div>
            </div>
        `;
    }

    bindFoodEvents() {
        // Touch events for swipe actions are handled via ontouchstart/end/move attributes
        // This ensures proper event binding even after dynamic content updates
    }

    // Open modal in create mode for manual entry
    addFood() {
        const modal = document.getElementById('foodDetailsModal');
        const form = modal.querySelector('form');
        delete modal.dataset.foodId; // ensure save treats this as new

        // Clear form
        form.reset?.();

        // Defaults
        const now = new Date();
        const hh = now.getHours().toString().padStart(2, '0');
        const mmRounded = Math.floor(now.getMinutes() / 5) * 5;
        const mm = mmRounded.toString().padStart(2, '0');

        form.querySelector('#foodName').value = '';
        form.querySelector('#foodWeight').value = '';
        form.querySelector('#foodCalories').value = '';
        form.querySelector('#foodDate').value = this.currentDate;

        const hourSelect = form.querySelector('#foodTimeHour');
        const minuteSelect = form.querySelector('#foodTimeMinute');
        const hiddenTime = form.querySelector('#foodTime');
        if (hourSelect) hourSelect.value = hh;
        if (minuteSelect) minuteSelect.value = mm;
        if (hiddenTime) hiddenTime.value = `${hh}:${mm}`;

        // Source shown as manual (read-only)
        const sourceSel = form.querySelector('#foodSource');
        if (sourceSel) sourceSel.value = 'manual';

        // Reset calories per gram display
        const cpg = form.querySelector('#calories-per-gram');
        if (cpg) cpg.textContent = '-- cal/g';

        // Bind live calc
        const weightInput = form.querySelector('#foodWeight');
        const caloriesInput = form.querySelector('#foodCalories');
        weightInput.addEventListener('input', () => this.updateCaloriesPerGram());
        caloriesInput.addEventListener('input', () => this.updateCaloriesPerGram());

        this.showModal('foodDetailsModal');
    }

    // Touch handling for swipe actions
    handleTouchStart(event, foodId) {
        this.touchStartX = event.touches[0].clientX;
        this.touchStartTime = Date.now();
        this.currentFoodId = foodId;
        this.longPressTimer = setTimeout(() => {
            this.showFoodContextMenu(foodId);
        }, 800);
    }

    handleTouchMove(event) {
        clearTimeout(this.longPressTimer);
        const touchCurrentX = event.touches[0].clientX;
        const deltaX = this.touchStartX - touchCurrentX;
        
        // Simple swipe detection - could be enhanced with visual feedback
        if (Math.abs(deltaX) > 10) {
            // Prevent default to avoid scrolling during swipe
            event.preventDefault();
        }
    }

    handleTouchEnd(event, foodId) {
        clearTimeout(this.longPressTimer);
        
        if (!this.touchStartX || Date.now() - this.touchStartTime > 800) {
            return; // Long press handled or no start position
        }
        
        const touchEndX = event.changedTouches[0].clientX;
        const deltaX = this.touchStartX - touchEndX;
        const deltaTime = Date.now() - this.touchStartTime;
        
        // Swipe thresholds
        if (Math.abs(deltaX) > 100 && deltaTime < 300) {
            if (deltaX > 0) {
                // Swipe left - delete
                this.deleteFood(foodId);
            } else {
                // Swipe right - edit
                this.editFood(foodId);
            }
        }
        
        this.touchStartX = null;
        this.touchStartTime = null;
    }

    showFoodContextMenu(foodId) {
        const options = ['Edit', 'Delete', 'Move to Different Date', 'Cancel'];
        
        // Simple implementation - could be enhanced with custom modal
        const choice = prompt(`Options for this food item:\n1. Edit\n2. Delete\n3. Move to Different Date\n4. Cancel\n\nEnter number (1-4):`);
        
        switch(choice) {
            case '1':
                this.editFood(foodId);
                break;
            case '2':
                this.deleteFood(foodId);
                break;
            case '3':
                this.moveFoodToDate(foodId);
                break;
        }
    }

    editFood(foodId) {
        const foods = this.storage.getEatingRecords();
        const food = foods.find(f => f.id === foodId);
        if (!food) return;
        
        const modal = document.getElementById('foodDetailsModal');
        const form = modal.querySelector('form');
        modal.dataset.foodId = foodId;
        const hourSelect = form.querySelector('#foodTimeHour');
        const minuteSelect = form.querySelector('#foodTimeMinute');
        const hiddenTime = form.querySelector('#foodTime');
        
        // Populate form - ensure time is in HH:MM format (24-hour)
        form.querySelector('#foodName').value = food.foodName;
        form.querySelector('#foodWeight').value = food.weight;
        form.querySelector('#foodCalories').value = food.calories;
        form.querySelector('#foodDate').value = food.eatenDate;
        // Convert any time format to 24-hour HH:MM and split into selects
        const hhmm = this.formatTime24(food.eatenTime);
        const [hh, mmRaw] = hhmm.split(':');
        const mm = (parseInt(mmRaw, 10) - (parseInt(mmRaw, 10) % 5)).toString().padStart(2, '0');
        if (hourSelect) hourSelect.value = hh;
        if (minuteSelect) minuteSelect.value = mm;
        if (hiddenTime) hiddenTime.value = `${hh}:${mm}`;

        
        // Calculate and show calories per gram
        this.updateCaloriesPerGram();
        
        // Bind calorie calculation
        const weightInput = form.querySelector('#foodWeight');
        const caloriesInput = form.querySelector('#foodCalories');
        
        weightInput.addEventListener('input', () => this.updateCaloriesPerGram());
        caloriesInput.addEventListener('input', () => this.updateCaloriesPerGram());
        
        this.showModal('foodDetailsModal');
    }

    updateCaloriesPerGram() {
        const form = document.querySelector('#foodDetailsModal form');
        const weight = parseFloat(form.querySelector('#foodWeight').value) || 0;
        const calories = parseFloat(form.querySelector('#foodCalories').value) || 0;
        const caloriesPerGramSpan = form.querySelector('#calories-per-gram');
        
        if (weight > 0 && calories > 0) {
            const perGram = (calories / weight).toFixed(1);
            caloriesPerGramSpan.textContent = `${perGram} cal/g`;
        } else {
            caloriesPerGramSpan.textContent = '-- cal/g';
        }
    }

    saveFoodEdit() {
        const modal = document.getElementById('foodDetailsModal');
        const form = modal.querySelector('form');
        const foodId = modal.dataset.foodId;
        
        const updatedFood = {
            foodName: form.querySelector('#foodName').value,
            weight: parseFloat(form.querySelector('#foodWeight').value) || 0,
            calories: parseFloat(form.querySelector('#foodCalories').value) || 0,
            eatenDate: form.querySelector('#foodDate').value,
            eatenTime: (() => {
                const hh = form.querySelector('#foodTimeHour')?.value || '00';
                const mm = form.querySelector('#foodTimeMinute')?.value || '00';
                return `${hh.padStart(2,'0')}:${mm.padStart(2,'0')}`;
            })()
        };
        
        // Validation
        if (!updatedFood.foodName.trim()) {
            alert('Food name is required');
            return;
        }
        
        if (updatedFood.weight <= 0 || updatedFood.calories <= 0) {
            alert('Weight and calories must be greater than 0');
            return;
        }
        
        if (foodId) {
            // Update existing
            this.storage.updateEatingRecord(foodId, updatedFood);
        } else {
            // Create new manual food record
            this.storage.addEatingRecord({
                ...updatedFood,
                source: 'manual'
            });
        }
        
        // If date changed relative to current view, inform and refresh
        if (updatedFood.eatenDate !== this.currentDate) {
            alert(`Food moved to ${new Date(updatedFood.eatenDate).toLocaleDateString()}`);
        }
        
        this.closeModal('foodDetailsModal');
        this.refreshFoodList();
        
        // Refresh other pages if needed
        if (window.app) {
            window.app.refreshAllPages();
        }
    }

    deleteFood(foodId) {
        if (confirm('Delete this food item? This action cannot be undone.')) {
            const food = this.storage.getEatingRecords().find(f => f.id === foodId);
            
            // If this came from a cooked meal, add the weight back
            if (food && food.originalMealId) {
                const meals = this.storage.getCookingRecords();
                const meal = meals.find(m => m.id === food.originalMealId);
                if (meal) {
                    meal.remainingWeight += food.weight;
                    this.storage.updateCookingRecord(meal.id, meal);
                }
            }
            
            this.storage.deleteEatingRecord(foodId);
            this.refreshFoodList();
            
            // Refresh cook page if needed
            if (window.app && window.app.cookManager) {
                window.app.cookManager.refreshMealsList();
            }
        }
    }

    moveFoodToDate(foodId) {
        const newDate = prompt('Enter new date (YYYY-MM-DD):');
        if (!newDate) return;
        
        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
            alert('Invalid date format. Use YYYY-MM-DD');
            return;
        }
        
        const updatedFood = { eatenDate: newDate };
        this.storage.updateEatingRecord(foodId, updatedFood);
        
        alert(`Food moved to ${new Date(newDate).toLocaleDateString()}`);
        this.refreshFoodList();
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal?.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal?.classList.remove('show');
        document.body.style.overflow = '';
    }

    getSourceIcon(source) {
        switch(source) {
            case 'audio': return '🎙️';
            case 'cooking': return '👨‍🍳';
            case 'manual': return '✏️';
            default: return '📝';
        }
    }

    getSourceText(source) {
        switch(source) {
            case 'audio': return 'Added from voice recording';
            case 'cooking': return 'Added from cooked meal';
            case 'manual': return 'Added manually';
            default: return 'Unknown source';
        }
    }
}

// Wait for the deviceready event to ensure Cordova is initialized
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    console.log('Cordova is ready. Initializing the app.');
    
    // Now that the device is ready, initialize your app
    window.app = new CalorieAIApp();
    
    // Request permissions
    requestPermissions();
}

function requestPermissions() {
    const permissions = cordova.plugins.permissions;
    const requiredPermissions = [
        permissions.CAMERA,
        permissions.RECORD_AUDIO
    ];

    permissions.checkPermission(requiredPermissions[0], (status) => {
        if (!status.hasPermission) {
            permissions.requestPermissions(requiredPermissions, (status) => {
                if (!status.hasPermission) {
                    console.warn('Permissions not granted');
                    alert('Camera and microphone permissions are required for the app to function fully.');
                }
            }, (error) => {
                console.error('Error requesting permissions:', error);
            });
        }
    }, (error) => {
        console.error('Error checking permissions:', error);
    });
}

// Fallback for when not running in Cordova
if (typeof window.cordova === 'undefined') {
    console.log('Cordova not found. Running in a standard browser environment.');
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new CalorieAIApp();
    });
}


// Export classes for potential external use
window.CalorieAIApp = CalorieAIApp;
window.RecordManager = RecordManager;
window.CookManager = CookManager;
window.EatManager = EatManager;
