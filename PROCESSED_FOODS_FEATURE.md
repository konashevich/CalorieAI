# Processed Foods Feature - Implementation Summary

## Overview
A new "Processed" page has been added to CalorieAI that allows users to scan food labels using their device camera, extract nutritional information via AI, and easily add these items to their daily calorie tracking.

## Features Implemented

### 1. **New "Processed" Navigation Tab**
- Added between "Records" and "Cook" in the bottom navigation
- Icon: 📦 (Package emoji)
- Accessible via click/tap like other pages

### 2. **Camera Food Label Scanning**
- Camera button in page header (camera icon)
- Triggers device camera on mobile devices
- Allows selecting existing photos on desktop
- Images are **not stored** - deleted immediately after AI processing

### 3. **AI-Powered Food Label Recognition**
- New `processFoodLabel()` method in `GeminiAIManager`
- Extracts:
  - Product name
  - Brand (if visible)
  - Calories per 100g
  - Serving size (in grams)
  - Calories per serving
  - Confidence level (high/medium/low)
- Returns structured JSON data

### 4. **Processed Foods Storage**
- New storage methods in `StorageManager`:
  - `getProcessedFoods()` - Get all processed foods
  - `getProcessedFood(id)` - Get single food by ID
  - `addProcessedFood(data)` - Add new processed food
  - `updateProcessedFood(id, data)` - Update existing food
  - `deleteProcessedFood(id)` - Delete processed food
- Included in data export/import functionality

### 5. **Processed Foods List**
- Displays all scanned foods with:
  - Food name and brand (if available)
  - Calories per 100g
  - Serving size and calories (if available)
  - Edit and delete buttons
  - Quick add input and buttons

### 6. **Editable Food Items**
- Click edit button to open details modal
- Edit:
  - Food name
  - Calories per 100g
  - Serving size (g)
  - Calories per serving
- Delete option available in edit modal

### 7. **Add to Eat Functionality**

#### Quick Add (Simple)
- Input weight in grams (default: 100g)
- Click "Add to Eat (Today)" button
- Automatically calculates calories
- Adds to current day's food log

#### Detailed Add (More Options)
- Click "More Options..." button
- Specify:
  - Amount (number input)
  - Unit: grams or serving(s)
  - Date: Today, Yesterday, or Custom Date
- Real-time calorie calculation display
- Adds to selected date's food log

### 8. **Calorie Calculations**
- **By Weight (grams)**: `calories = (weight × caloriesPer100g) / 100`
- **By Serving**: `calories = servings × servingCalories`
- Automatic conversion and rounding

## File Changes

### New Files
1. **`web/js/processed.js`** - ProcessedManager class (485 lines)
   - Camera capture handling
   - AI integration
   - List rendering
   - Modal management
   - Add to Eat logic

### Modified Files
1. **`web/index.html`**
   - Added Processed page section
   - Added Processed navigation button
   - Added camera input element
   - Added two modals (edit and add to eat)
   - Added script reference to processed.js

2. **`web/js/navigation.js`**
   - Added 'processed' to pages array
   - Added case for processed page refresh

3. **`web/js/storage.js`**
   - Added PROCESSED_FOODS storage key
   - Added 6 new methods for processed foods
   - Updated export/import to include processed foods

4. **`web/js/gemini-ai.js`**
   - Added `processFoodLabel()` method
   - Added `buildFoodLabelPrompt()` method
   - Added `parseFoodLabelResponse()` method

5. **`web/js/app.js`**
   - Added processedManager property
   - Initialized ProcessedManager
   - Added to refreshAllPages()

6. **`web/css/styles.css`**
   - Added processed-section styles
   - Added processed-item styles
   - Added processed-actions styles
   - Added btn-camera styles
   - Added quick-add-input styles
   - Added responsive adjustments

## User Workflow

### Scanning a Food Label
1. Navigate to "Processed" page
2. Click camera button in header
3. Take photo of food label (or select from gallery)
4. AI processes the image (loading indicator shown)
5. Food item automatically added to list
6. Edit modal opens for review/adjustment
7. Image is deleted after processing

### Adding to Daily Log
#### Quick Method:
1. Enter weight in grams (e.g., 150)
2. Click "Add to Eat (Today)"
3. Item added to today's food log with calculated calories

#### Detailed Method:
1. Click "More Options..."
2. Choose amount and unit (grams or servings)
3. Select date (Today/Yesterday/Custom)
4. Review calculated calories
5. Click "Add to Eat"
6. Item added to selected date's food log

### Editing Processed Foods
1. Click edit (✏️) button on any food item
2. Modify name, calories, serving info
3. Click "Save Changes"
4. List updates automatically

### Deleting Processed Foods
- Option 1: Click delete (🗑️) button in list
- Option 2: Click delete button in edit modal
- Confirmation required for both

## Technical Details

### AI Prompt Design
- Temperature: 0.2 (more deterministic)
- Max tokens: 1024
- Extracts structured nutritional data
- Handles various label formats
- Provides confidence levels

### Data Structure
```javascript
{
  id: "generated_id",
  name: "Product Name",
  brand: "Brand Name",
  caloriesPer100g: 250,
  servingSize: 30,
  servingCalories: 75,
  confidence: "high",
  notes: "Additional info",
  createdAt: "ISO timestamp",
  updatedAt: "ISO timestamp"
}
```

### Storage Key
- localStorage key: `calorieai_processed_foods`
- Stored as JSON array
- Newest items first (unshift)

### Image Handling
- Converted to base64 for API transmission
- Sent inline with API request
- **Not stored locally** - deleted after processing
- File input reset after each capture

## Integration with Existing Features

### Eat Page
- Processed foods can be added to any date
- Shows source as 'processed' in food items
- Links back to original processed food via `processedFoodId`
- Refreshes automatically when items added

### Storage/Export
- Processed foods included in data export
- Properly imported on data restore
- Compatible with existing backup format

### UI Consistency
- Matches design patterns from Cook page
- Similar modal styles
- Consistent button styling
- Responsive design maintained

## Browser Compatibility
- Camera input works on all modern mobile browsers
- Falls back to file picker on desktop
- iOS Safari: Uses photo library
- Android Chrome: Opens camera directly
- Desktop: File picker dialog

## Future Enhancements (Potential)
- [ ] Barcode scanning support
- [ ] OCR improvements for better accuracy
- [ ] Nutritional facts beyond calories (protein, carbs, fat)
- [ ] Favorites/frequently used items
- [ ] Search functionality for processed foods
- [ ] Share processed foods between devices
- [ ] Batch scanning multiple items
- [ ] Nutrition database lookup for verification

## Testing Checklist
- [x] Camera button triggers file input
- [x] Image processing with AI works
- [x] Processed food saved to storage
- [x] List displays correctly
- [x] Edit modal opens and saves changes
- [x] Delete functionality works
- [x] Quick add to Eat (today) works
- [x] Detailed add to Eat works
- [x] Calorie calculations correct
- [x] Custom date selection works
- [x] Images not stored after processing
- [x] Data export includes processed foods
- [x] Data import restores processed foods
- [x] Responsive design on mobile
- [x] Navigation between pages works

## Notes
- The `capture="environment"` attribute on the file input is not widely supported but provides a hint to use the rear camera on mobile devices when available
- All inline styles have been moved to CSS classes for better maintainability
- Toast notifications provide feedback for all user actions
- Loading overlay shown during AI processing
- Error handling implemented for camera and AI failures
