/**
 * AI Integration Manager
 * Handles communication with AI service for transcription and food analysis
 */

class AIManager {
    constructor() {
        this.apiEndpoint = null; // To be configured later
        this.apiKey = null; // To be configured later
        this.timeout = 30000; // 30 seconds timeout
    }

    /**
     * Send audio to AI service for processing
     * @param {Object} audioData - Audio data with blob, mimeType, etc.
     * @returns {Promise<Object>} - AI response with transcription and food analysis
     */
    async processAudio(audioData) {
        try {
            // TODO: Implement actual AI service integration
            // For now, return simulated response
            
            return await this.simulateAIResponse(audioData);
            
            // Real implementation would look like:
            /*
            const formData = new FormData();
            formData.append('audio', this.base64ToBlob(audioData.blob), 'recording.webm');
            formData.append('current_date', new Date().toISOString());
            formData.append('prompt', this.buildPrompt());

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    // Don't set Content-Type for FormData
                },
                body: formData,
                timeout: this.timeout
            });

            if (!response.ok) {
                throw new Error(`AI service error: ${response.status}`);
            }

            const result = await response.json();
            return this.validateAIResponse(result);
            */
            
        } catch (error) {
            console.error('AI processing error:', error);
            throw new Error(`Failed to process audio: ${error.message}`);
        }
    }

    /**
     * Simulate AI response for development/testing
     */
    async simulateAIResponse(audioData, clarificationData = null) {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // If we have clarification data, use it to improve the response
        if (clarificationData) {
            return this.generateClarifiedResponse(clarificationData);
        }

        // Simulate different scenarios randomly for testing
        const scenarios = [
            this.getCompleteResponse(),
            this.getIncompleteResponse(),
            this.getUnclearActivityResponse(),
            this.getMultipleFoodsResponse()
        ];

        const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
        return randomScenario;
    }

    getCompleteResponse() {
        return {
            raw_transcription: "I cooked chicken breast 200 grams today for lunch",
            cleaned_transcription: "chicken breast 200 grams",
            activity_type: "cooking",
            confidence_level: "high",
            requires_clarification: false,
            clarification_needed: null,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0],
            foods: [
                {
                    name: "chicken breast",
                    weight: 200,
                    unit: "grams",
                    calories_per_100g: 165,
                    total_calories: 330,
                    ingredients: [
                        {
                            name: "chicken breast",
                            weight: 200,
                            calories: 330
                        }
                    ]
                }
            ],
            meal_name: "Grilled Chicken Breast",
            total_weight: 200,
            total_calories: 330,
            missing_data: [],
            status: "complete"
        };
    }

    getIncompleteResponse() {
        return {
            raw_transcription: "I had some rice and chicken but I'm not sure how much",
            cleaned_transcription: "rice chicken",
            activity_type: "eating",
            confidence_level: "low",
            requires_clarification: true,
            clarification_needed: [
                "Please specify the weight or portion size of rice",
                "Please specify the weight or portion size of chicken"
            ],
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0],
            foods: [
                {
                    name: "rice",
                    weight: null,
                    unit: "grams",
                    calories_per_100g: 130,
                    total_calories: null
                },
                {
                    name: "chicken",
                    weight: null,
                    unit: "grams", 
                    calories_per_100g: 165,
                    total_calories: null
                }
            ],
            missing_data: ["weights", "portion_sizes"],
            status: "needs_clarification"
        };
    }

    getUnclearActivityResponse() {
        return {
            raw_transcription: "I prepared some salad ingredients",
            cleaned_transcription: "salad ingredients",
            activity_type: null,
            confidence_level: "low",
            requires_clarification: true,
            clarification_needed: [
                "Please clarify if you were cooking/preparing food or eating food",
                "Please specify which ingredients and their quantities"
            ],
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0],
            foods: [
                {
                    name: "salad ingredients",
                    weight: null,
                    unit: "grams",
                    calories_per_100g: null,
                    total_calories: null
                }
            ],
            missing_data: ["activity_type", "ingredient_details", "weights"],
            status: "needs_clarification"
        };
    }

    getMultipleFoodsResponse() {
        return {
            raw_transcription: "I ate 150g pasta with 100g tomato sauce and 50g cheese",
            cleaned_transcription: "pasta 150g tomato sauce 100g cheese 50g",
            activity_type: "eating",
            confidence_level: "high",
            requires_clarification: false,
            clarification_needed: null,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0],
            foods: [
                {
                    name: "pasta",
                    weight: 150,
                    unit: "grams",
                    calories_per_100g: 131,
                    total_calories: 197
                },
                {
                    name: "tomato sauce",
                    weight: 100,
                    unit: "grams",
                    calories_per_100g: 29,
                    total_calories: 29
                },
                {
                    name: "cheese",
                    weight: 50,
                    unit: "grams",
                    calories_per_100g: 113,
                    total_calories: 57
                }
            ],
            meal_name: "Pasta with Tomato Sauce and Cheese",
            total_weight: 300,
            total_calories: 283,
            missing_data: [],
            status: "complete"
        };
    }

    generateClarifiedResponse(clarificationData) {
        const { activityType, additionalDetails, originalTranscription } = clarificationData;
        
        // Generate a response based on clarification
        if (activityType === 'cooking') {
            return {
                raw_transcription: originalTranscription,
                cleaned_transcription: "clarified cooking activity",
                activity_type: "cooking",
                confidence_level: "high",
                requires_clarification: false,
                clarification_needed: null,
                date: new Date().toISOString().split('T')[0],
                time: new Date().toTimeString().split(' ')[0],
                foods: [
                    {
                        name: "meal from clarification",
                        weight: 300,
                        unit: "grams",
                        calories_per_100g: 150,
                        total_calories: 450,
                        ingredients: [
                            {
                                name: "main ingredient",
                                weight: 300,
                                calories: 450
                            }
                        ]
                    }
                ],
                meal_name: "Clarified Meal",
                total_weight: 300,
                total_calories: 450,
                missing_data: [],
                status: "complete"
            };
        } else {
            return {
                raw_transcription: originalTranscription,
                cleaned_transcription: "clarified eating activity",
                activity_type: "eating",
                confidence_level: "high",
                requires_clarification: false,
                clarification_needed: null,
                date: new Date().toISOString().split('T')[0],
                time: new Date().toTimeString().split(' ')[0],
                foods: [
                    {
                        name: "food from clarification",
                        weight: 150,
                        unit: "grams",
                        calories_per_100g: 200,
                        total_calories: 300
                    }
                ],
                missing_data: [],
                status: "complete"
            };
        }
    }

    /**
     * Build prompt for AI service
     */
    buildPrompt() {
        const currentDate = new Date().toISOString().split('T')[0];
        const currentTime = new Date().toTimeString().split(' ')[0];
        
        return `
Please transcribe this audio recording and analyze the food information. 
Current date: ${currentDate}
Current time: ${currentTime}

Requirements:
1. Provide exact transcription
2. Clean transcription (food-related words only)
3. Determine if this is "cooking" or "eating"
4. Extract food names, weights, and calculate calories
5. Parse any date/time references (today, yesterday, etc.)
6. Return structured JSON response as specified

If any information is missing or unclear, mark requires_clarification as true and specify what's needed.
        `.trim();
    }

    /**
     * Validate AI response format
     */
    validateAIResponse(response) {
        const required = [
            'raw_transcription',
            'activity_type',
            'foods',
            'date',
            'status'
        ];

        for (let field of required) {
            if (!(field in response)) {
                throw new Error(`AI response missing required field: ${field}`);
            }
        }

        // Validate activity_type
        if (!['cooking', 'eating'].includes(response.activity_type)) {
            throw new Error('Invalid activity_type in AI response');
        }

        // Validate foods array
        if (!Array.isArray(response.foods)) {
            throw new Error('Foods must be an array');
        }

        return response;
    }

    /**
     * Convert base64 to Blob for FormData
     */
    base64ToBlob(base64Data) {
        const [header, data] = base64Data.split(',');
        const mimeType = header.match(/:(.*?);/)[1];
        const byteCharacters = atob(data);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }

    /**
     * Process AI response and save to appropriate storage
     */
    async handleAIResponse(response, audioRecordId) {
        try {
            if (response.activity_type === 'cooking') {
                return await this.processCookingResponse(response, audioRecordId);
            } else if (response.activity_type === 'eating') {
                return await this.processEatingResponse(response, audioRecordId);
            }
        } catch (error) {
            console.error('Error handling AI response:', error);
            throw error;
        }
    }

    async processCookingResponse(response, audioRecordId) {
        const storage = window.app.storage;
        
        // Create cooking record
        const cookingData = {
            mealName: response.meal_name || response.foods[0]?.name || 'Unknown Meal',
            totalWeight: response.total_weight || 0,
            totalCalories: response.total_calories || 0,
            cookedDate: response.date,
            cookedTime: response.time,
            audioRecordId: audioRecordId
        };

        const cookingRecord = storage.addCookingRecord(cookingData);

        // Add ingredients
        if (response.foods && response.foods.length > 0) {
            for (let food of response.foods) {
                if (food.ingredients && food.ingredients.length > 0) {
                    for (let ingredient of food.ingredients) {
                        storage.addIngredient({
                            cookingRecordId: cookingRecord.id,
                            name: ingredient.name,
                            weight: ingredient.weight,
                            caloriesPer100g: food.calories_per_100g || 0,
                            totalCalories: ingredient.calories
                        });
                    }
                }
            }
        }

        return { type: 'cooking', record: cookingRecord };
    }

    async processEatingResponse(response, audioRecordId) {
        const storage = window.app.storage;
        
        // Create eating records for each food
        const eatingRecords = [];
        
        if (response.foods && response.foods.length > 0) {
            for (let food of response.foods) {
                const eatingData = {
                    foodName: food.name,
                    weight: food.weight,
                    calories: food.total_calories,
                    eatenDate: response.date,
                    eatenTime: response.time,
                    source: 'audio',
                    audioRecordId: audioRecordId,
                    status: response.status,
                    missingData: response.missing_data
                };

                const eatingRecord = storage.addEatingRecord(eatingData);
                eatingRecords.push(eatingRecord);
            }
        }

        return { type: 'eating', records: eatingRecords };
    }

    /**
     * Configuration methods
     */
    setApiEndpoint(endpoint) {
        this.apiEndpoint = endpoint;
    }

    setApiKey(key) {
        this.apiKey = key;
    }

    setTimeout(timeout) {
        this.timeout = timeout;
    }
}

// Export for use in other modules
window.AIManager = AIManager;