# Manual Add Feature for Processed Foods

## Overview
Added the ability to manually add processed food items without scanning a label, providing flexibility for users who want to enter nutritional information from memory or other sources.

## Changes Made

### 1. UI Updates (index.html)
- **Added "Add" icon button** next to the camera button in the Processed page header
- Button uses the same plus icon (+) style as Cook and Eat pages
- **Updated modal** to support both "Add" and "Edit" modes:
  - Added brand field
  - Title changes based on mode ("Add Processed Food" vs "Edit Processed Food")
  - Delete button only shows in edit mode
  - Submit button text is just "Save" for both modes

### 2. JavaScript Updates (processed.js)

#### New Method: `openManualAdd()`
- Opens the modal in create mode
- Sets title to "Add Processed Food"
- Hides the delete button
- Clears the form for new entry
- Sets `currentEditId` to null

#### Updated Method: `editProcessedFood(foodId)`
- Opens the modal in edit mode
- Sets title to "Edit Processed Food"
- Shows the delete button
- Populates form with existing data
- Sets `currentEditId` to the food ID
- Now includes brand field

#### Updated Method: `saveProcessedFood()`
- Checks if `currentEditId` is set
- If editing: Updates existing food
- If creating: Adds new food
- Validates that name is required
- Handles brand field (optional)
- Shows appropriate toast message

### 3. CSS Updates (styles.css)
- **Added `page-header-actions`** class for grouping header buttons
- Buttons have 0.5rem gap between them
- Flex display for proper alignment

## User Interface

### Processed Page Header
```
[Processed Foods]  [+] [📷]
```
- **[+]** = Add manually button (new)
- **[📷]** = Scan label button (existing)

### Modal Behavior

#### When Adding Manually:
- Title: "Add Processed Food"
- All fields empty
- Delete button hidden
- Submit button: "Save"

#### When Editing:
- Title: "Edit Processed Food"
- Fields populated with existing data
- Delete button visible
- Submit button: "Save"

## Form Fields

1. **Food Name** (required) - Text input
2. **Brand** (optional) - Text input (new field)
3. **Calories per 100g** - Number input
4. **Serving Size (g)** - Number input (optional)
5. **Calories per Serving** - Number input (optional)

## User Workflow

### Manual Add Flow:
1. Click the **+** button in Processed page header
2. Modal opens with empty form
3. Enter food name (required)
4. Optionally enter brand name
5. Enter calories per 100g
6. Optionally enter serving size and serving calories
7. Click "Save"
8. Food added to list
9. Success toast shown

### Edit Flow (unchanged behavior):
1. Click edit (✏️) on any food item
2. Modal opens with populated form
3. Make changes
4. Click "Save" or click delete button to remove
5. Changes saved
6. Success toast shown

## Benefits

✅ **No camera required** - Can add foods without scanning  
✅ **From memory** - Enter nutritional info you already know  
✅ **From other sources** - Copy from website, package you don't have, etc.  
✅ **Flexibility** - Choose scanning or manual entry as needed  
✅ **Brand tracking** - Optional brand field for better organization  
✅ **Consistent UX** - Follows same pattern as Cook and Eat pages  

## Technical Details

### Modal State Management
- `currentEditId` determines mode:
  - `null` = Create mode
  - `<id>` = Edit mode
- Modal title and delete button visibility change accordingly
- Form validation same for both modes

### Data Validation
- Name is required (both modes)
- Brand is optional
- All numeric fields accept 0 or positive numbers
- Null values allowed for optional fields

### Integration
- Works seamlessly with existing scan functionality
- Same storage methods used
- Same "Add to Eat" functionality
- Included in data export/import

## Files Modified

1. **web/index.html**
   - Added manual add button
   - Added brand field to modal
   - Updated modal title element
   - Added inline style to hide delete button initially

2. **web/js/processed.js**
   - Added `openManualAdd()` method
   - Updated `editProcessedFood()` to handle brand
   - Updated `saveProcessedFood()` for dual mode
   - Added event listener for manual add button

3. **web/css/styles.css**
   - Added `page-header-actions` styling
   - Gap between header buttons

## Usage Example

**Manual Entry:**
```
Name: Oreo Cookies
Brand: Nabisco
Calories per 100g: 480
Serving Size: 34
Calories per Serving: 160
```

**From Scanning:**
All fields auto-populated by AI, then editable.

Both methods result in the same stored data structure and can be used to add to Eat page.
