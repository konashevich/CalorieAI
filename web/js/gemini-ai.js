/**
 * Real Gemini AI Integration Manager
 * Handles communication with Google's Gemini API for transcription and food analysis
 * NO SIMULATION - Real API only
 */

class GeminiAIManager {
    constructor() {
        this.apiKey = null;
        this.timeout = 30000; // 30 seconds timeout
        this.modelName = 'gemini-flash-latest'; // Latest flash model
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    }

    /**
     * Initialize Gemini AI with API key
     * @param {string} apiKey - Your Gemini API key from Google AI Studio
     */
    initialize(apiKey) {
        if (!apiKey) {
            throw new Error('Gemini API key is required');
        }

        this.apiKey = apiKey;
        console.log('Gemini AI initialized successfully');
    }

    /**
     * Check if Gemini AI is properly initialized
     */
    isInitialized() {
        return this.apiKey !== null;
    }

    /**
     * Send audio to Gemini API for processing
     * @param {Object} audioData - Audio data with blob, mimeType, etc.
     * @returns {Promise<Object>} - AI response with transcription and food analysis
     */
    async processAudio(audioData) {
        if (!this.isInitialized()) {
            throw new Error('Gemini AI not initialized. Please configure your API key in Settings.');
        }

        try {
            console.log('Processing with Gemini AI...');
            
            // Convert audio blob to base64 for inline data
            const base64Audio = await this.blobToBase64(audioData.blob);
            // Remove data URL prefix (e.g., "data:audio/webm;base64,")
            const base64Data = base64Audio.split(',')[1];
            
            // Build the analysis prompt
            const prompt = this.buildFoodAnalysisPrompt();

            // Make API call to Gemini with inline audio data
            const response = await fetch(`${this.baseUrl}/models/${this.modelName}:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            {
                                text: prompt
                            },
                            {
                                inlineData: {
                                    mimeType: audioData.mimeType,
                                    data: base64Data
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.3,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }

            const result = await response.json();
            
            if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
                throw new Error('Invalid response from Gemini API');
            }

            const text = result.candidates[0].content.parts[0].text;
            
            // Parse the response
            const aiResponse = this.parseGeminiResponse(text);
            
            return aiResponse;

        } catch (error) {
            console.error('Gemini AI processing error:', error);
            throw error;
        }
    }

    /**
     * Convert blob to base64 string
     * @param {Blob} blob - The blob to convert
     * @returns {Promise<string>} - Base64 encoded data URL
     */
    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Build comprehensive prompt for food analysis
     */
    buildFoodAnalysisPrompt() {
        const currentDate = new Date().toISOString().split('T')[0];
        const currentTime = new Date().toTimeString().split(' ')[0];
        
        return `
Please analyze this audio recording for food-related information and return a JSON response.

Current date: ${currentDate}
Current time: ${currentTime}

Requirements:
1. Provide exact transcription
2. Determine if this is "cooking" (preparing/making food) or "eating" (consuming food)
3. Extract all food items mentioned with weights/quantities
4. Calculate calories for each food item
5. Parse any date/time references (today, yesterday, lunch, etc.)
6. If information is missing or unclear, mark requires_clarification as true

Return ONLY valid JSON in this exact format:
{
    "raw_transcription": "exact transcription here",
    "cleaned_transcription": "food-related words only",
    "activity_type": "cooking" or "eating" or null,
    "confidence_level": "high" or "medium" or "low",
    "requires_clarification": true or false,
    "clarification_needed": ["specific questions if needed"],
    "date": "${currentDate}",
    "time": "${currentTime}",
    "foods": [
        {
            "name": "food name",
            "weight": 100,
            "unit": "grams",
            "calories_per_100g": 165,
            "total_calories": 165,
            "ingredients": [
                {
                    "name": "ingredient name",
                    "weight": 100,
                    "calories": 165
                }
            ]
        }
    ],
    "meal_name": "descriptive meal name",
    "total_weight": 100,
    "total_calories": 165,
    "missing_data": ["list any missing information"],
    "status": "complete" or "needs_clarification"
}

Important:
- Use realistic calorie values from nutrition databases
- If weights are unclear, ask for clarification
- If activity type is unclear, ask for clarification
- Include all ingredients if cooking
- Be precise with measurements and calories
        `.trim();
    }

    /**
     * Parse Gemini's response and validate format
     */
    parseGeminiResponse(responseText) {
        try {
            // Extract JSON from response (in case there's extra text)
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            const response = JSON.parse(jsonMatch[0]);
            
            // Validate required fields
            this.validateAIResponse(response);
            
            return response;

        } catch (error) {
            console.error('Error parsing Gemini response:', error);
            console.log('Raw response:', responseText);
            throw new Error('Failed to parse AI response: ' + error.message);
        }
    }

    /**
     * Process AI response with clarification data
     */
    async processClarification(originalResponse, clarificationData) {
        if (!this.isInitialized()) {
            throw new Error('Gemini AI not initialized. Please configure your API key in Settings.');
        }

        try {
            const prompt = `
Based on the original transcription: "${originalResponse.raw_transcription}"
And this clarification from the user:
- Activity Type: ${clarificationData.activityType}
- Additional Details: ${clarificationData.additionalDetails}

Please generate a complete food analysis JSON response with the same format as before, incorporating the clarification information to fill in missing details.

Return ONLY valid JSON with the same structure as specified previously.
            `.trim();

            const response = await fetch(`${this.baseUrl}/models/${this.modelName}:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 2048,
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status}`);
            }

            const result = await response.json();
            const text = result.candidates[0].content.parts[0].text;

            return this.parseGeminiResponse(text);

        } catch (error) {
            console.error('Error processing clarification:', error);
            throw error;
        }
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
        if (response.activity_type !== null && !['cooking', 'eating'].includes(response.activity_type)) {
            throw new Error('Invalid activity_type in AI response');
        }

        // Validate foods array
        if (!Array.isArray(response.foods)) {
            throw new Error('Foods must be an array');
        }

        return response;
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
}

// Export for use in other modules
window.GeminiAIManager = GeminiAIManager;
