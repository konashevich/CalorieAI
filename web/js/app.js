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
            this.showMessage('Settings saved! Gemini AI is now active.');
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
            return;
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
        const duration = record.duration ? `${record.duration}s` : 'Unknown';
        const statusIcon = this.getStatusIcon(record);
        const hasTranscription = record.transcribed && record.transcriptionData;
        
        return `
            <div class="record-item" data-record-id="${record.id}" oncontextmenu="window.app.recordManager.showContextMenu(event, '${record.id}')">
                <div class="record-time">${record.recordedTime}</div>
                <div class="record-status-container">
                    <div class="record-status ${record.transcribed ? 'processed' : 'pending'}">${statusIcon}</div>
                    ${hasTranscription ? `<div class="record-preview">"${this.getTranscriptionPreview(record)}"</div>` : ''}
                </div>
                <div class="record-actions">
                    <button class="btn-icon" onclick="window.app.recordManager.showRecordDetails('${record.id}')" title="View Details">👁️</button>
                    <button class="btn-icon" onclick="window.app.recordManager.playRecord('${record.id}')" title="Play">▶️</button>
                </div>
            </div>
        `;
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
        
        const time = new Date(`${record.recordedDate} ${record.recordedTime}`).toLocaleString();
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
}

/**
 * Cook Manager
 * Handles the Cook page functionality
 */
class CookManager {
    constructor(storage) {
        this.storage = storage;
        this.mealsList = document.getElementById('mealsList');
        this.setupModals();
    }

    setupModals() {
        // Meal details modal
        const mealModal = document.getElementById('mealDetailsModal');
        const mealCloseBtn = mealModal?.querySelector('.close-btn');
        mealCloseBtn?.addEventListener('click', () => this.closeModal('mealDetailsModal'));

        // Click outside to close
        mealModal?.addEventListener('click', (e) => {
            if (e.target === mealModal) {
                this.closeModal('mealDetailsModal');
            }
        });
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
                    <span class="item-time">${meal.cookedTime}</span>
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
                    <button class="add-serving-btn" onclick="window.app.cookManager.addServing('${meal.id}')">Add to Eat</button>
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
        const content = modal.querySelector('.meal-detail-content');
        
        const cookedTime = new Date(`${meal.cookedDate} ${meal.cookedTime}`).toLocaleString();
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
                        <button class="btn-primary" onclick="window.app.cookManager.addServingFromModal('${mealId}')">Add to Eat</button>
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
        
        alert(`Added ${servingWeight}g of ${meal.mealName} (${servingCalories} cal) to today's eaten food!`);
    }

    deleteMeal(mealId) {
        if (confirm('Delete this meal? This action cannot be undone.')) {
            this.storage.deleteCookingRecord(mealId);
            this.refreshMealsList();
        }
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
    }

    setupModals() {
        // Food details modal
        const foodModal = document.getElementById('foodDetailsModal');
        const foodCloseBtn = foodModal?.querySelector('.close-btn');
        const foodSaveBtn = foodModal?.querySelector('#food-save');
        
        foodCloseBtn?.addEventListener('click', () => this.closeModal('foodDetailsModal'));
        foodSaveBtn?.addEventListener('click', () => this.saveFoodEdit());

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

        // Group foods by meal type or time
        const groupedFoods = this.groupFoodsByTime(foods);
        
        let html = '';
        for (let [timeGroup, groupFoods] of Object.entries(groupedFoods)) {
            html += `
                <div class="time-group">
                    <h4 class="time-header">${timeGroup}</h4>
                    ${groupFoods.map(food => this.renderFoodItem(food)).join('')}
                </div>
            `;
        }
        
        this.foodList.innerHTML = html;
        this.bindFoodEvents();
    }

    groupFoodsByTime(foods) {
        const grouped = {};
        
        foods.forEach(food => {
            const hour = parseInt(food.eatenTime.split(':')[0]);
            let timeGroup;
            
            if (hour < 11) {
                timeGroup = 'Breakfast (Before 11 AM)';
            } else if (hour < 15) {
                timeGroup = 'Lunch (11 AM - 3 PM)';
            } else if (hour < 19) {
                timeGroup = 'Afternoon (3 PM - 7 PM)';
            } else {
                timeGroup = 'Dinner (After 7 PM)';
            }
            
            if (!grouped[timeGroup]) {
                grouped[timeGroup] = [];
            }
            grouped[timeGroup].push(food);
        });
        
        // Sort foods within each group by time
        Object.keys(grouped).forEach(key => {
            grouped[key].sort((a, b) => a.eatenTime.localeCompare(b.eatenTime));
        });
        
        return grouped;
    }

    renderFoodItem(food) {
        const status = food.status === 'complete' ? '' : ' (incomplete)';
        const caloriesPerGram = food.weight > 0 ? (food.calories / food.weight) : 0;
        
        return `
            <div class="food-item" data-food-id="${food.id}" 
                 ontouchstart="window.app.eatManager.handleTouchStart(event, '${food.id}')"
                 ontouchend="window.app.eatManager.handleTouchEnd(event, '${food.id}')"
                 ontouchmove="window.app.eatManager.handleTouchMove(event)">
                <div class="item-header">
                    <span class="item-time">${food.eatenTime}</span>
                    <div class="food-actions">
                        <span class="food-source" title="${this.getSourceText(food.source)}">${this.getSourceIcon(food.source)}</span>
                        <button class="btn-icon" onclick="window.app.eatManager.editFood('${food.id}')" title="Edit">✏️</button>
                        <button class="btn-icon" onclick="window.app.eatManager.deleteFood('${food.id}')" title="Delete">🗑️</button>
                    </div>
                </div>
                <div class="item-title">${food.foodName}${status}</div>
                <div class="item-details">
                    <span class="weight-calories">${food.weight}g - ${food.calories} cal</span>
                    ${caloriesPerGram > 0 ? `<span class="calories-per-gram">(${Math.round(caloriesPerGram)} cal/g)</span>` : ''}
                </div>
                ${food.originalMealId ? `<div class="meal-reference">From cooked meal</div>` : ''}
            </div>
        `;
    }

    bindFoodEvents() {
        // Touch events for swipe actions are handled via ontouchstart/end/move attributes
        // This ensures proper event binding even after dynamic content updates
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
        
        // Populate form
        form.querySelector('#food-name').value = food.foodName;
        form.querySelector('#food-weight').value = food.weight;
        form.querySelector('#food-calories').value = food.calories;
        form.querySelector('#food-date').value = food.eatenDate;
        form.querySelector('#food-time').value = food.eatenTime;
        
        // Calculate and show calories per gram
        this.updateCaloriesPerGram();
        
        // Bind calorie calculation
        const weightInput = form.querySelector('#food-weight');
        const caloriesInput = form.querySelector('#food-calories');
        
        weightInput.addEventListener('input', () => this.updateCaloriesPerGram());
        caloriesInput.addEventListener('input', () => this.updateCaloriesPerGram());
        
        this.showModal('foodDetailsModal');
    }

    updateCaloriesPerGram() {
        const form = document.querySelector('#foodDetailsModal form');
        const weight = parseFloat(form.querySelector('#food-weight').value) || 0;
        const calories = parseFloat(form.querySelector('#food-calories').value) || 0;
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
            foodName: form.querySelector('#food-name').value,
            weight: parseFloat(form.querySelector('#food-weight').value) || 0,
            calories: parseFloat(form.querySelector('#food-calories').value) || 0,
            eatenDate: form.querySelector('#food-date').value,
            eatenTime: form.querySelector('#food-time').value
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
        
        // Update the food record
        this.storage.updateEatingRecord(foodId, updatedFood);
        
        // If date changed, refresh current view
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

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CalorieAIApp();
});

// Export classes for potential external use
window.CalorieAIApp = CalorieAIApp;
window.RecordManager = RecordManager;
window.CookManager = CookManager;
window.EatManager = EatManager;