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
Please analyze this audio recording and return ONLY valid JSON for food tracking.

Current date: ${currentDate}
Current time: ${currentTime}

General requirements:
- Provide the exact transcription (raw_transcription)
- Determine activity_type: "cooking" (preparing) or "eating" (consuming)
- Use 24-hour time
- ALWAYS normalize quantities to grams for weight (weight_g):
    - If user says tablespoons, teaspoons, cups, pieces, slices, etc., convert to grams using common nutrition approximations
    - Do not return ranges; choose the single best estimate in grams
    - Prefer providing calories_per_100g and compute total_calories
- If unclear/missing, set requires_clarification true and list clarification_needed

FOR COOKING, return this shape (ingredients MUST be separate and precise; do NOT include overall yield fields):
{
    "raw_transcription": string,
    "cleaned_transcription": string,
    "activity_type": "cooking",
    "confidence_level": "high"|"medium"|"low",
    "requires_clarification": boolean,
    "clarification_needed": string[],
    "date": "${currentDate}",
    "time": "${currentTime}",
    "meal_name": string,
        "ingredients": [
        {
            "name": string,
            "weight_g": number,              // grams
            "calories_per_100g": number,     // preferred; use realistic values
            "total_calories": number         // optional; if both provided, they must be consistent
        }
    ],
    "missing_data": string[],
    "status": "complete"|"needs_clarification"
}

FOR EATING, return this shape:
{
    "raw_transcription": string,
    "cleaned_transcription": string,
    "activity_type": "eating",
    "confidence_level": "high"|"medium"|"low",
    "requires_clarification": boolean,
    "clarification_needed": string[],
    "date": "${currentDate}",
    "time": "${currentTime}",
    "foods": [
        { "name": string, "weight": number, "unit": "grams", "total_calories": number }
    ],
    "missing_data": string[],
    "status": "complete"|"needs_clarification"
}

Rules:
- Use realistic calorie values. Prefer to provide calories_per_100g for ingredients and compute totals.
- If any weight/calories are ambiguous, set requires_clarification and add specific clarification_needed items.
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
        // Required for both
        const baseReq = ['raw_transcription', 'activity_type', 'date', 'status'];
        for (let field of baseReq) {
            if (!(field in response)) {
                throw new Error(`AI response missing required field: ${field}`);
            }
        }

        if (response.activity_type === 'cooking') {
            const hasTopIngredients = Array.isArray(response.ingredients);
            const hasFoodsIngredients = Array.isArray(response.foods) && response.foods.some(f => Array.isArray(f.ingredients));
            if (!hasTopIngredients && !hasFoodsIngredients) {
                throw new Error('Cooking response must include ingredients');
            }
        }

        if (response.activity_type === 'eating') {
            if (!Array.isArray(response.foods)) {
                throw new Error('Eating response must include foods array');
            }
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
        
        // Normalize ingredients from either top-level or foods[].ingredients
        let ingredients = [];
        if (Array.isArray(response.ingredients)) {
            ingredients = response.ingredients;
        } else if (Array.isArray(response.foods)) {
            response.foods.forEach(f => {
                if (Array.isArray(f.ingredients)) ingredients.push(...f.ingredients);
            });
        }

        // Map to unified shape and compute per-ingredient calories if needed
        const normIngredients = ingredients.map(ing => {
            const weight = ing.weight_g ?? ing.weight ?? 0;
            const cals100 = ing.calories_per_100g ?? ing.caloriesPer100g;
            let total = ing.total_calories ?? ing.totalCalories;
            let per100 = cals100;
            if ((total == null || isNaN(total)) && per100 != null) {
                total = Math.round((Number(weight) || 0) * Number(per100) / 100);
            } else if ((per100 == null || isNaN(per100)) && total != null && weight) {
                per100 = Math.round((Number(total) * 100) / Number(weight));
            }
            return {
                name: ing.name,
                weight: Number(weight) || 0,
                caloriesPer100g: Number(per100) || 0,
                totalCalories: Math.round(Number(total) || 0)
            };
        });

    // Compute totals EXCLUSIVELY from ingredients (ignore any provided yield/overall totals)
    const totalWeight = normIngredients.reduce((s, i) => s + (Number(i.weight) || 0), 0);
    const totalCalories = normIngredients.reduce((s, i) => s + (Number(i.totalCalories) || 0), 0);

        // Create cooking record
        const cookingData = {
            mealName: response.meal_name || response.foods?.[0]?.name || 'Cooked Meal',
            totalWeight: Math.round(totalWeight) || 0,
            totalCalories: Math.round(totalCalories) || 0,
            cookedDate: response.date,
            cookedTime: response.time,
            audioRecordId: audioRecordId,
            // Include ingredient names for preview convenience
            ingredients: normIngredients.map(i => i.name).slice(0, 6)
        };
        const cookingRecord = storage.addCookingRecord(cookingData);

        // Persist ingredients
        normIngredients.forEach(ing => {
            storage.addIngredient({
                cookingRecordId: cookingRecord.id,
                name: ing.name,
                weight: ing.weight,
                caloriesPer100g: ing.caloriesPer100g
            });
        });

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
