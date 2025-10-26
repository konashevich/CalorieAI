# CalorieAI - Gemini API Integration Setup

## Getting Your Gemini API Key

To use real AI-powered food analysis in CalorieAI, you'll need a Gemini API key from Google:

### Step 1: Get Your API Key
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Choose "Create API key in new project" (recommended) or select an existing project
5. Copy the generated API key

### Step 2: Configure CalorieAI
1. Open CalorieAI in your browser
2. Click the "Settings" button (⚙️) in the bottom navigation
3. Paste your API key in the "Gemini API Key" field
4. Check "Use Real Gemini AI" checkbox
5. Click "Save Settings"

### Step 3: Test the Integration
1. Go to the Record tab
2. Click the microphone button to record
3. Say something like "I ate 100 grams of chicken breast for lunch"
4. Click Send - you should now get real AI analysis instead of simulated responses

## Features with Gemini AI

When Gemini AI is enabled, CalorieAI will:

- **Real Transcription**: Convert speech to text using advanced AI
- **Smart Food Recognition**: Identify foods, portions, and cooking methods
- **Accurate Calorie Calculation**: Calculate calories based on actual nutrition data
- **Context Understanding**: Understand meal timing, preparation methods, and ingredients
- **Clarification Handling**: Ask intelligent follow-up questions when information is unclear

## Privacy & Security

- Your API key is stored locally in your browser only
- Audio recordings are sent to Google's Gemini API for processing
- No data is stored on CalorieAI servers
- You can clear your API key anytime in Settings

## Troubleshooting

**"Failed to initialize Gemini AI"**
- Double-check your API key is correct
- Ensure you have internet connection
- Verify your Google AI Studio project has billing enabled (if required)

**"Falling back to simulated response"**
- Check that "Use Real Gemini AI" is enabled in Settings
- Verify your API key is saved
- Check browser console for detailed error messages

**Still getting simulated responses**
- Currently, the web implementation uses text-based Gemini processing
- Audio transcription will be added in future updates
- The system will demonstrate real AI integration with text-based analysis

## Cost Information

- Gemini API has free tier limits
- Check [Google AI Studio pricing](https://ai.google.dev/pricing) for current rates
- Monitor your usage in Google AI Studio dashboard

## Next Steps

Future versions will include:
- Direct audio-to-text transcription
- Advanced meal planning features
- Nutritional insights and recommendations
- Integration with fitness tracking apps

---

**Need Help?** Check the browser console (F12) for detailed error messages and troubleshooting information.