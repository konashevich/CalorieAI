/**
 * Processed Foods Manager
 * Handles camera capture, AI processing, and management of processed foods
 */

class ProcessedManager {
    constructor(storage, getAIManager) {
        this.storage = storage;
        this.getAIManager = getAIManager;
        this.processedList = document.getElementById('processedList');
        this.cameraInput = document.getElementById('cameraInput');
        this.currentEditId = null;
        this.currentAddToEatFood = null;
        
        this.setupUI();
        this.setupModals();
    }

    setupUI() {
        // Camera button
        const captureBtn = document.getElementById('captureFoodBtn');
        captureBtn?.addEventListener('click', () => this.initiateCamera());
        
        // Manual add button
        const addManualBtn = document.getElementById('addProcessedManualBtn');
        addManualBtn?.addEventListener('click', () => this.openManualAdd());
        
        // Camera input change
        this.cameraInput?.addEventListener('change', (e) => this.handleImageCapture(e));
    }

    setupModals() {
        // Processed food details modal
        const detailsModal = document.getElementById('processedDetailsModal');
        const closeBtn = document.getElementById('closeProcessedModal');
        const cancelBtn = document.getElementById('cancelProcessedEdit');
        const deleteBtn = document.getElementById('deleteProcessedBtn');
        const detailsForm = document.getElementById('processedDetailsForm');
        
        closeBtn?.addEventListener('click', () => this.closeModal('processedDetailsModal'));
        cancelBtn?.addEventListener('click', () => this.closeModal('processedDetailsModal'));
        deleteBtn?.addEventListener('click', () => this.deleteCurrentFood());
        
        detailsForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProcessedFood();
        });
        
        // Click outside to close
        detailsModal?.addEventListener('click', (e) => {
            if (e.target === detailsModal) {
                this.closeModal('processedDetailsModal');
            }
        });

        // Add to Eat modal
        const addToEatModal = document.getElementById('addProcessedToEatModal');
        const closeAddBtn = document.getElementById('closeAddToEatModal');
        const cancelAddBtn = document.getElementById('cancelAddToEat');
        const addToEatForm = document.getElementById('addToEatForm');
        const dateSelect = document.getElementById('addToEatDate');
        const amountInput = document.getElementById('addToEatAmount');
        const unitSelect = document.getElementById('addToEatUnit');
        
        closeAddBtn?.addEventListener('click', () => this.closeModal('addProcessedToEatModal'));
        cancelAddBtn?.addEventListener('click', () => this.closeModal('addProcessedToEatModal'));
        
        addToEatForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitAddToEat();
        });
        
        // Show/hide custom date
        dateSelect?.addEventListener('change', (e) => {
            const customGroup = document.getElementById('customDateGroup');
            if (e.target.value === 'custom') {
                customGroup.style.display = 'block';
            } else {
                customGroup.style.display = 'none';
            }
        });
        
        // Update calculated calories
        const updateCalories = () => this.updateCalculatedCalories();
        amountInput?.addEventListener('input', updateCalories);
        unitSelect?.addEventListener('change', updateCalories);
        
        // Click outside to close
        addToEatModal?.addEventListener('click', (e) => {
            if (e.target === addToEatModal) {
                this.closeModal('addProcessedToEatModal');
            }
        });
    }

    initiateCamera() {
        // Trigger the file input which will open camera on mobile
        this.cameraInput.click();
    }

    async handleImageCapture(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            // Show loading
            this.showLoading('Analyzing food label...');
            
            // Get AI manager
            const aiManager = this.getAIManager();
            
            // Process the image
            const result = await aiManager.processFoodLabel(file);
            
            // Hide loading
            this.hideLoading();
            
            // Create processed food record
            const processedFood = this.storage.addProcessedFood({
                name: result.name,
                brand: result.brand || null,
                caloriesPer100g: result.calories_per_100g || 0,
                servingSize: result.serving_size || null,
                servingCalories: result.serving_calories || null,
                confidence: result.confidence || 'medium',
                notes: result.notes || null
            });
            
            // Clear the input so the same file can be selected again
            this.cameraInput.value = '';
            
            // Refresh the list
            this.refreshProcessedList();
            
            // Show success message
            if (window.app?.showToast) {
                window.app.showToast(`Added: ${processedFood.name}`, 'success');
            }
            
            // Open the details modal for review/editing
            this.editProcessedFood(processedFood.id);
            
        } catch (error) {
            console.error('Error processing food label:', error);
            this.hideLoading();
            
            // Clear the input
            this.cameraInput.value = '';
            
            if (window.app?.showToast) {
                window.app.showToast('Failed to process food label: ' + error.message, 'error', 5000);
            } else {
                alert('Failed to process food label: ' + error.message);
            }
        }
    }

    refreshProcessedList() {
        if (!this.processedList) return;
        
        const foods = this.storage.getProcessedFoods();
        
        if (foods.length === 0) {
            this.processedList.innerHTML = `
                <div class="empty-state">
                    <p>No processed foods yet. Scan a food label to get started!</p>
                </div>
            `;
            return;
        }
        
        // Render all processed foods
        const html = foods.map(food => this.renderProcessedItem(food)).join('');
        this.processedList.innerHTML = html;
    }

    renderProcessedItem(food) {
        const caloriesInfo = food.caloriesPer100g 
            ? `${food.caloriesPer100g} cal/100g` 
            : '';
        const servingInfo = food.servingSize && food.servingCalories
            ? `${food.servingCalories} cal per ${food.servingSize}g serving`
            : '';
        const brandInfo = food.brand ? `<span class="food-brand">${food.brand}</span>` : '';
        
        return `
            <div class="processed-item" data-food-id="${food.id}">
                <div class="item-header">
                    <div class="item-title-group">
                        <span class="item-title">${food.name}</span>
                        ${brandInfo}
                    </div>
                    <div class="item-actions">
                        <button class="btn-icon" onclick="window.app.processedManager.editProcessedFood('${food.id}')" title="Edit">✏️</button>
                        <button class="btn-icon" onclick="window.app.processedManager.deleteProcessedFood('${food.id}')" title="Delete">🗑️</button>
                    </div>
                </div>
                <div class="item-details">
                    ${caloriesInfo}
                    ${servingInfo ? `<br>${servingInfo}` : ''}
                </div>
                <div class="processed-actions">
                    <input type="number" class="quick-add-input" data-food-id="${food.id}" placeholder="Amount (g)" min="1" value="100">
                    <button class="add-to-eat-btn" onclick="window.app.processedManager.quickAddToEat('${food.id}')">Add to Eaten (Today)</button>
                    <button class="add-to-eat-detailed-btn" onclick="window.app.processedManager.openAddToEat('${food.id}')">More Options...</button>
                </div>
            </div>
        `;
    }

    editProcessedFood(foodId) {
        const food = this.storage.getProcessedFood(foodId);
        if (!food) return;
        
        this.currentEditId = foodId;
        
        const modal = document.getElementById('processedDetailsModal');
        const form = document.getElementById('processedDetailsForm');
        const title = document.getElementById('processedDetailsTitle');
        const deleteBtn = document.getElementById('deleteProcessedBtn');
        
        // Set title and show delete button for editing
        if (title) title.textContent = 'Edit Processed Food';
        if (deleteBtn) deleteBtn.style.display = 'block';
        
        // Populate form
        form.querySelector('#processedName').value = food.name || '';
        form.querySelector('#processedBrand').value = food.brand || '';
        form.querySelector('#processedCalsPer100g').value = food.caloriesPer100g || '';
        form.querySelector('#processedServingSize').value = food.servingSize || '';
        form.querySelector('#processedServingCals').value = food.servingCalories || '';
        
        this.showModal('processedDetailsModal');
    }

    openManualAdd() {
        this.currentEditId = null;
        
        const modal = document.getElementById('processedDetailsModal');
        const form = document.getElementById('processedDetailsForm');
        const title = document.getElementById('processedDetailsTitle');
        const deleteBtn = document.getElementById('deleteProcessedBtn');
        
        // Set title and hide delete button for new entry
        if (title) title.textContent = 'Add Processed Food';
        if (deleteBtn) deleteBtn.style.display = 'none';
        
        // Clear form
        form.reset();
        
        this.showModal('processedDetailsModal');
    }

    saveProcessedFood() {
        const form = document.getElementById('processedDetailsForm');
        const name = form.querySelector('#processedName').value.trim();
        const brand = form.querySelector('#processedBrand').value.trim();
        const calsPer100g = parseFloat(form.querySelector('#processedCalsPer100g').value) || 0;
        const servingSize = parseFloat(form.querySelector('#processedServingSize').value) || null;
        const servingCals = parseFloat(form.querySelector('#processedServingCals').value) || null;
        
        if (!name) {
            if (window.app?.showToast) {
                window.app.showToast('Food name is required', 'error');
            } else {
                alert('Food name is required');
            }
            return;
        }
        
        if (this.currentEditId) {
            // Update existing
            this.storage.updateProcessedFood(this.currentEditId, {
                name,
                brand: brand || null,
                caloriesPer100g: calsPer100g,
                servingSize: servingSize,
                servingCalories: servingCals
            });
            
            if (window.app?.showToast) {
                window.app.showToast('Processed food updated', 'success');
            }
        } else {
            // Create new
            this.storage.addProcessedFood({
                name,
                brand: brand || null,
                caloriesPer100g: calsPer100g,
                servingSize: servingSize,
                servingCalories: servingCals
            });
            
            if (window.app?.showToast) {
                window.app.showToast(`Added: ${name}`, 'success');
            }
        }
        
        this.closeModal('processedDetailsModal');
        this.refreshProcessedList();
    }

    deleteCurrentFood() {
        if (!this.currentEditId) return;
        
        if (confirm('Delete this processed food? This action cannot be undone.')) {
            this.storage.deleteProcessedFood(this.currentEditId);
            this.closeModal('processedDetailsModal');
            this.refreshProcessedList();
            
            if (window.app?.showToast) {
                window.app.showToast('Processed food deleted', 'success');
            }
        }
    }

    deleteProcessedFood(foodId) {
        if (confirm('Delete this processed food? This action cannot be undone.')) {
            this.storage.deleteProcessedFood(foodId);
            this.refreshProcessedList();
            
            if (window.app?.showToast) {
                window.app.showToast('Processed food deleted', 'success');
            }
        }
    }

    quickAddToEat(foodId) {
        const input = this.processedList.querySelector(`input[data-food-id="${foodId}"]`);
        const amount = parseFloat(input?.value) || 100;
        
        const food = this.storage.getProcessedFood(foodId);
        if (!food) return;
        
        // Calculate calories
        const calories = Math.round((amount * food.caloriesPer100g) / 100);
        
        // Add to today's eating records
        const now = new Date();
        this.storage.addEatingRecord({
            foodName: food.name,
            weight: amount,
            calories: calories,
            eatenDate: now.toISOString().split('T')[0],
            eatenTime: now.toTimeString().split(' ')[0].substring(0, 5),
            source: 'processed',
            processedFoodId: foodId
        });
        
        // Refresh Eat page if visible
        if (window.app?.eatManager) {
            window.app.eatManager.refreshFoodList();
        }
        
        if (window.app?.showToast) {
            window.app.showToast(`Added ${amount}g of ${food.name} (${calories} cal) to today`, 'success');
        }
    }

    openAddToEat(foodId) {
        const food = this.storage.getProcessedFood(foodId);
        if (!food) return;
        
        this.currentAddToEatFood = food;
        
        // Set up the modal
        document.getElementById('addToEatFoodName').textContent = food.name;
        document.getElementById('addToEatAmount').value = '100';
        document.getElementById('addToEatUnit').value = 'grams';
        document.getElementById('addToEatDate').value = 'today';
        document.getElementById('customDateGroup').style.display = 'none';
        
        // Update calculated calories
        this.updateCalculatedCalories();
        
        this.showModal('addProcessedToEatModal');
    }

    updateCalculatedCalories() {
        if (!this.currentAddToEatFood) return;
        
        const amount = parseFloat(document.getElementById('addToEatAmount').value) || 0;
        const unit = document.getElementById('addToEatUnit').value;
        
        let calories = 0;
        if (unit === 'grams') {
            calories = Math.round((amount * this.currentAddToEatFood.caloriesPer100g) / 100);
        } else if (unit === 'serving') {
            if (this.currentAddToEatFood.servingCalories) {
                calories = Math.round(amount * this.currentAddToEatFood.servingCalories);
            } else {
                calories = 0;
            }
        }
        
        document.getElementById('calculatedCalories').textContent = calories;
    }

    submitAddToEat() {
        if (!this.currentAddToEatFood) return;
        
        const amount = parseFloat(document.getElementById('addToEatAmount').value) || 0;
        const unit = document.getElementById('addToEatUnit').value;
        const dateOption = document.getElementById('addToEatDate').value;
        
        if (amount <= 0) {
            if (window.app?.showToast) {
                window.app.showToast('Amount must be greater than 0', 'error');
            }
            return;
        }
        
        // Calculate weight and calories
        let weight = 0;
        let calories = 0;
        
        if (unit === 'grams') {
            weight = amount;
            calories = Math.round((amount * this.currentAddToEatFood.caloriesPer100g) / 100);
        } else if (unit === 'serving') {
            if (this.currentAddToEatFood.servingSize) {
                weight = amount * this.currentAddToEatFood.servingSize;
                calories = amount * (this.currentAddToEatFood.servingCalories || 0);
            } else {
                if (window.app?.showToast) {
                    window.app.showToast('Serving size not available for this food', 'error');
                }
                return;
            }
        }
        
        // Determine date
        let eatenDate;
        const now = new Date();
        
        if (dateOption === 'today') {
            eatenDate = now.toISOString().split('T')[0];
        } else if (dateOption === 'yesterday') {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            eatenDate = yesterday.toISOString().split('T')[0];
        } else if (dateOption === 'custom') {
            eatenDate = document.getElementById('addToEatCustomDate').value;
            if (!eatenDate) {
                if (window.app?.showToast) {
                    window.app.showToast('Please select a custom date', 'error');
                }
                return;
            }
        }
        
        // Add to eating records
        this.storage.addEatingRecord({
            foodName: this.currentAddToEatFood.name,
            weight: Math.round(weight),
            calories: Math.round(calories),
            eatenDate: eatenDate,
            eatenTime: now.toTimeString().split(' ')[0].substring(0, 5),
            source: 'processed',
            processedFoodId: this.currentAddToEatFood.id
        });
        
        // Close modal
        this.closeModal('addProcessedToEatModal');
        
        // Refresh Eat page if visible
        if (window.app?.eatManager) {
            window.app.eatManager.refreshFoodList();
        }
        
        if (window.app?.showToast) {
            const dateText = dateOption === 'today' ? 'today' : dateOption === 'yesterday' ? 'yesterday' : eatenDate;
            window.app.showToast(`Added ${Math.round(weight)}g of ${this.currentAddToEatFood.name} (${Math.round(calories)} cal) to ${dateText}`, 'success');
        }
        
        this.currentAddToEatFood = null;
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    showLoading(message = 'Processing...') {
        const overlay = document.getElementById('loadingOverlay');
        const loadingText = document.querySelector('.loading-text');
        if (overlay) {
            overlay.classList.add('show');
        }
        if (loadingText) {
            loadingText.textContent = message;
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
    }
}

// Export for use in other modules
window.ProcessedManager = ProcessedManager;
