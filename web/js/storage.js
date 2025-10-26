/**
 * Storage Manager
 * Handles localStorage operations for CalorieAI data
 */

class StorageManager {
    constructor() {
        this.storageKeys = {
            AUDIO_RECORDS: 'calorieai_audio_records',
            COOKING_RECORDS: 'calorieai_cooking_records',
            EATING_RECORDS: 'calorieai_eating_records',
            INGREDIENTS: 'calorieai_ingredients',
            APP_SETTINGS: 'calorieai_settings'
        };
        this.init();
    }

    init() {
        // Initialize storage with empty arrays if not exists
        this.initializeStorage();
    }

    initializeStorage() {
        Object.values(this.storageKeys).forEach(key => {
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, JSON.stringify([]));
            }
        });

        // Initialize app settings
        if (!localStorage.getItem(this.storageKeys.APP_SETTINGS)) {
            const defaultSettings = {
                theme: 'auto',
                lastUsed: new Date().toISOString(),
                version: '1.0.0'
            };
            localStorage.setItem(this.storageKeys.APP_SETTINGS, JSON.stringify(defaultSettings));
        }
    }

    // Generic storage operations
    getData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return [];
        }
    }

    setData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error writing to localStorage:', error);
            return false;
        }
    }

    // Audio Records operations
    getAudioRecords() {
        return this.getData(this.storageKeys.AUDIO_RECORDS);
    }

    getAudioRecord(id) {
        const records = this.getAudioRecords();
        return records.find(record => record.id === id);
    }

    addAudioRecord(recordData) {
        const records = this.getAudioRecords();
        const newRecord = {
            id: this.generateId(),
            filename: recordData.filename,
            blob: recordData.blob, // base64 or blob reference
            recordedDate: recordData.recordedDate || new Date().toISOString().split('T')[0],
            recordedTime: recordData.recordedTime || new Date().toTimeString().split(' ')[0],
            transcribed: false,
            transcriptionData: null,
            createdAt: new Date().toISOString(),
            ...recordData
        };
        
        records.unshift(newRecord); // Add to beginning
        this.setData(this.storageKeys.AUDIO_RECORDS, records);
        return newRecord;
    }

    updateAudioRecord(id, updateData) {
        const records = this.getAudioRecords();
        const index = records.findIndex(record => record.id === id);
        
        if (index !== -1) {
            records[index] = { ...records[index], ...updateData };
            this.setData(this.storageKeys.AUDIO_RECORDS, records);
            return records[index];
        }
        return null;
    }

    deleteAudioRecord(id) {
        const records = this.getAudioRecords();
        const filteredRecords = records.filter(record => record.id !== id);
        this.setData(this.storageKeys.AUDIO_RECORDS, filteredRecords);
        return filteredRecords.length < records.length;
    }

    // Cooking Records operations
    getCookingRecords() {
        return this.getData(this.storageKeys.COOKING_RECORDS);
    }

    addCookingRecord(mealData) {
        const meals = this.getCookingRecords();
        const newMeal = {
            id: this.generateId(),
            mealName: mealData.mealName,
            totalWeight: mealData.totalWeight || 0,
            totalCalories: mealData.totalCalories || 0,
            remainingWeight: mealData.remainingWeight || mealData.totalWeight || 0,
            cookedDate: mealData.cookedDate || new Date().toISOString().split('T')[0],
            cookedTime: mealData.cookedTime || new Date().toTimeString().split(' ')[0],
            audioRecordId: mealData.audioRecordId || null,
            servings: mealData.servings || null,
            ingredients: mealData.ingredients || [],
            source: mealData.source || 'audio',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...mealData
        };

        meals.unshift(newMeal);
        this.setData(this.storageKeys.COOKING_RECORDS, meals);
        return newMeal;
    }

    updateCookingRecord(id, updateData) {
        const meals = this.getCookingRecords();
        const index = meals.findIndex(meal => meal.id === id);
        
        if (index !== -1) {
            meals[index] = { 
                ...meals[index], 
                ...updateData, 
                updatedAt: new Date().toISOString() 
            };
            this.setData(this.storageKeys.COOKING_RECORDS, meals);
            return meals[index];
        }
        return null;
    }

    deleteCookingRecord(id) {
        const meals = this.getCookingRecords();
        const filteredMeals = meals.filter(meal => meal.id !== id);
        this.setData(this.storageKeys.COOKING_RECORDS, filteredMeals);
        
        // Also delete related ingredients
        this.deleteIngredientsByMealId(id);
        
        return filteredMeals.length < meals.length;
    }

    // Ingredients operations
    getIngredients() {
        return this.getData(this.storageKeys.INGREDIENTS);
    }

    addIngredient(ingredientData) {
        const ingredients = this.getIngredients();
        const newIngredient = {
            id: this.generateId(),
            cookingRecordId: ingredientData.cookingRecordId,
            name: ingredientData.name,
            weight: ingredientData.weight,
            caloriesPer100g: ingredientData.caloriesPer100g,
            totalCalories: (ingredientData.weight * ingredientData.caloriesPer100g) / 100,
            ...ingredientData
        };

        ingredients.push(newIngredient);
        this.setData(this.storageKeys.INGREDIENTS, ingredients);
        return newIngredient;
    }

    getIngredientsByMealId(mealId) {
        const ingredients = this.getIngredients();
        return ingredients.filter(ingredient => ingredient.cookingRecordId === mealId);
    }

    deleteIngredientsByMealId(mealId) {
        const ingredients = this.getIngredients();
        const filteredIngredients = ingredients.filter(ingredient => ingredient.cookingRecordId !== mealId);
        this.setData(this.storageKeys.INGREDIENTS, filteredIngredients);
    }

    // Eating Records operations
    getEatingRecords() {
        return this.getData(this.storageKeys.EATING_RECORDS);
    }

    addEatingRecord(foodData) {
        const foods = this.getEatingRecords();
        const newFood = {
            id: this.generateId(),
            foodName: foodData.foodName,
            weight: foodData.weight,
            calories: foodData.calories,
            eatenDate: foodData.eatenDate || new Date().toISOString().split('T')[0],
            eatenTime: foodData.eatenTime || new Date().toTimeString().split(' ')[0],
            source: foodData.source || 'manual', // 'audio', 'manual', 'cooking'
            originalMealId: foodData.originalMealId || null,
            cookingRecordId: foodData.cookingRecordId || null,
            audioRecordId: foodData.audioRecordId || null,
            status: foodData.status || 'complete',
            missingData: foodData.missingData || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...foodData
        };

        foods.unshift(newFood);
        this.setData(this.storageKeys.EATING_RECORDS, foods);
        return newFood;
    }

    updateEatingRecord(id, updateData) {
        const foods = this.getEatingRecords();
        const index = foods.findIndex(food => food.id === id);
        
        if (index !== -1) {
            foods[index] = { 
                ...foods[index], 
                ...updateData, 
                updatedAt: new Date().toISOString() 
            };
            this.setData(this.storageKeys.EATING_RECORDS, foods);
            return foods[index];
        }
        return null;
    }

    deleteEatingRecord(id) {
        const foods = this.getEatingRecords();
        const filteredFoods = foods.filter(food => food.id !== id);
        this.setData(this.storageKeys.EATING_RECORDS, filteredFoods);
        return filteredFoods.length < foods.length;
    }

    getEatingRecordsByDate(date) {
        const foods = this.getEatingRecords();
        return foods.filter(food => food.eatenDate === date);
    }

    // Utility functions
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    formatDate(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        return date.toISOString().split('T')[0];
    }

    formatTime(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        return date.toTimeString().split(' ')[0];
    }

    // Sample data generation for demo
    generateSampleData() {
        // Clear existing data
        this.initializeStorage();
        
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const yesterday = new Date(now - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        // Sample audio records
        const audioRecords = [
            {
                id: 'audio_1',
                filename: 'cooking_lasagna.webm',
                recordedDate: yesterday,
                recordedTime: '18:30',
                duration: 15,
                transcribed: true,
                transcriptionData: JSON.stringify({
                    raw_transcription: "I cooked a large lasagna today, about 2 kilograms total with ground beef, pasta, and cheese",
                    activity_type: "cooking",
                    status: "complete",
                    processed_data: {
                        activity: "cooking",
                        items: [{ name: "Beef Lasagna", ingredients: ["ground beef", "pasta", "cheese"], servings: 8 }]
                    }
                }),
                createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'audio_2',
                filename: 'eating_breakfast.webm',
                recordedDate: today,
                recordedTime: '08:15',
                duration: 8,
                transcribed: true,
                transcriptionData: JSON.stringify({
                    raw_transcription: "I had scrambled eggs and toast for breakfast but I'm not sure how much",
                    activity_type: "eating",
                    status: "needs_clarification",
                    clarification_needed: ["Please specify the quantity of eggs and toast"]
                }),
                createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'audio_3',
                filename: 'lunch_salad.webm',
                recordedDate: today,
                recordedTime: '12:45',
                duration: 12,
                transcribed: true,
                transcriptionData: JSON.stringify({
                    raw_transcription: "I ate a large Caesar salad with grilled chicken, about 300 grams total",
                    activity_type: "eating",
                    status: "complete",
                    processed_data: {
                        activity: "eating",
                        items: [{ name: "Caesar Salad with Chicken", calories: 450, quantity: "300g" }]
                    }
                }),
                createdAt: new Date(now - 60 * 60 * 1000).toISOString()
            }
        ];
        
        // Sample cooking records
        const cookingRecords = [
            {
                id: 'cook_1',
                mealName: 'Beef Lasagna',
                totalWeight: 2000,
                remainingWeight: 1200,
                totalCalories: 3200,
                cookedDate: yesterday,
                cookedTime: '18:30',
                servings: 8,
                ingredients: ['ground beef', 'pasta sheets', 'mozzarella cheese', 'tomato sauce', 'onions'],
                source: 'audio',
                audioRecordId: 'audio_1',
                createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'cook_2',
                mealName: 'Chicken Stir Fry',
                totalWeight: 800,
                remainingWeight: 400,
                totalCalories: 1200,
                cookedDate: twoDaysAgo,
                cookedTime: '19:15',
                servings: 4,
                ingredients: ['chicken breast', 'bell peppers', 'broccoli', 'soy sauce', 'garlic'],
                source: 'manual',
                createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(now - 24 * 60 * 60 * 1000).toISOString()
            }
        ];
        
        // Sample eating records
        const eatingRecords = [
            {
                id: 'eat_1',
                foodName: 'Beef Lasagna',
                weight: 250,
                calories: 400,
                eatenDate: yesterday,
                eatenTime: '19:00',
                source: 'cooking',
                originalMealId: 'cook_1',
                status: 'complete',
                createdAt: new Date(now - 23 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'eat_2',
                foodName: 'Caesar Salad with Chicken',
                weight: 300,
                calories: 450,
                eatenDate: today,
                eatenTime: '12:45',
                source: 'audio',
                audioRecordId: 'audio_3',
                status: 'complete',
                createdAt: new Date(now - 60 * 60 * 1000).toISOString()
            },
            {
                id: 'eat_3',
                foodName: 'Beef Lasagna',
                weight: 200,
                calories: 320,
                eatenDate: today,
                eatenTime: '13:15',
                source: 'cooking',
                originalMealId: 'cook_1',
                status: 'complete',
                createdAt: new Date(now - 30 * 60 * 1000).toISOString()
            },
            {
                id: 'eat_4',
                foodName: 'Greek Yogurt',
                weight: 150,
                calories: 100,
                eatenDate: today,
                eatenTime: '07:30',
                source: 'manual',
                status: 'complete',
                createdAt: new Date(now - 4 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'eat_5',
                foodName: 'Chicken Stir Fry',
                weight: 200,
                calories: 300,
                eatenDate: twoDaysAgo,
                eatenTime: '19:30',
                source: 'cooking',
                originalMealId: 'cook_2',
                status: 'complete',
                createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString()
            }
        ];
        
        // Save all sample data
        localStorage.setItem(this.storageKeys.AUDIO_RECORDS, JSON.stringify(audioRecords));
        localStorage.setItem(this.storageKeys.COOKING_RECORDS, JSON.stringify(cookingRecords));
        localStorage.setItem(this.storageKeys.EATING_RECORDS, JSON.stringify(eatingRecords));
        
        console.log('Sample data generated successfully!');
        return true;
    }

    // Data export/import for backup
    exportData() {
        const data = {
            audioRecords: this.getAudioRecords(),
            cookingRecords: this.getCookingRecords(),
            ingredients: this.getIngredients(),
            eatingRecords: this.getEatingRecords(),
            settings: this.getData(this.storageKeys.APP_SETTINGS),
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };
        return JSON.stringify(data, null, 2);
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.audioRecords) {
                this.setData(this.storageKeys.AUDIO_RECORDS, data.audioRecords);
            }
            if (data.cookingRecords) {
                this.setData(this.storageKeys.COOKING_RECORDS, data.cookingRecords);
            }
            if (data.ingredients) {
                this.setData(this.storageKeys.INGREDIENTS, data.ingredients);
            }
            if (data.eatingRecords) {
                this.setData(this.storageKeys.EATING_RECORDS, data.eatingRecords);
            }
            if (data.settings) {
                this.setData(this.storageKeys.APP_SETTINGS, data.settings);
            }
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    // Clear all data (for testing or reset)
    clearAllData() {
        Object.values(this.storageKeys).forEach(key => {
            localStorage.removeItem(key);
        });
        this.initializeStorage();
    }
}

// Export for use in other modules
window.StorageManager = StorageManager;