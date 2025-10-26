# CalorieAI - Complete Application Specification

## 1. Project Overview

### 1.1 Application Name
**CalorieAI** - AI-Powered Calorie Tracking App

### 1.2 Platform
Web Application (HTML/CSS/JavaScript) → Android APK

### 1.3 Core Purpose
A voice-controlled calorie tracking application that uses AI to transcribe audio recordings of food intake, automatically calculate calories, and manage cooking vs. eating activities through structured data processing.

### 1.4 Key Features
- Voice recording for food intake logging
- AI-powered transcription and calorie calculation
- Cooking vs. eating activity distinction
- Daily calorie tracking and meal management
- Portion control and serving size management

## 2. Technology Stack & Development Approach

### 2.1 Technology Choice
- **HTML5** - Structure and markup
- **CSS3** - Styling and theming (no frameworks)
- **Vanilla JavaScript** - All functionality (no frameworks/libraries)
- **Web APIs** - MediaRecorder, localStorage, Fetch API
- **Progressive Web App (PWA)** - For native-like experience

### 2.2 Development Strategy
**Phase A: Web Development**
1. Build fully functional web application
2. Test all features in modern browsers
3. Implement PWA capabilities
4. Optimize for mobile browsers

**Phase B: Android Conversion**
1. **Primary Option**: Apache Cordova/PhoneGap wrapper
2. **Alternative**: Capacitor (Ionic's solution)
3. **Fallback**: WebView-based native wrapper
4. **Modern Option**: PWA to APK conversion

### 2.3 Core Components
1. **Audio Recording Module** - MediaRecorder API
2. **AI Integration Module** - Fetch API for HTTP requests
3. **Data Management Module** - localStorage/IndexedDB for local storage
4. **UI Navigation Module** - Three main screens with vanilla JS routing
5. **Calculation Engine** - Pure JavaScript calculations

### 2.4 Data Flow
```
Audio Recording → AI Processing → JSON Response → Data Parsing → Database Storage → UI Display
```

## 3. AI Integration Specifications

### 3.1 AI Service Requirements
- **Primary Function**: Speech-to-text transcription
- **Secondary Function**: Food analysis and calorie calculation
- **Tertiary Function**: Date/time interpretation

### 3.2 AI Prompt Structure
The AI system should receive:
- Audio transcription request
- Current date/time context
- Request for structured JSON response
- Food analysis and calorie calculation instructions

### 3.3 Expected JSON Response Format
```json
{
  "raw_transcription": "string - exact transcribed text",
  "cleaned_transcription": "string - processed text with irrelevant words removed",
  "activity_type": "cooking|eating",
  "confidence_level": "high|medium|low",
  "requires_clarification": boolean,
  "clarification_needed": "string - what needs clarification",
  "date": "YYYY-MM-DD",
  "time": "HH:MM:SS",
  "foods": [
    {
      "name": "string",
      "weight": number,
      "unit": "grams|kg|oz|lbs",
      "calories_per_100g": number,
      "total_calories": number,
      "ingredients": [
        {
          "name": "string",
          "weight": number,
          "calories": number
        }
      ]
    }
  ],
  "meal_name": "string - if cooking",
  "total_weight": number,
  "total_calories": number,
  "missing_data": ["weight", "serving_size", "food_type"],
  "status": "complete|incomplete"
}
```

## 4. Data Storage Strategy

### 4.1 Web Storage Options

**Phase A (Web Development):**
- **Primary**: localStorage for structured data
- **Secondary**: IndexedDB for large audio files
- **Format**: JSON objects for all data structures

**Phase B (Android APK):**
- **Cordova**: SQLite plugin for database
- **Web Storage**: Maintained compatibility with localStorage
- **File System**: Cordova File plugin for audio storage

### 4.2 Data Structure (JSON Objects)

#### 4.2.1 Audio Records Object
```javascript
const audioRecord = {
    id: "unique_id_string",
    filename: "recording_name.wav",
    blob: "base64_audio_data", // or IndexedDB reference
    recordedDate: "2025-10-25",
    recordedTime: "14:30:00",
    transcribed: false,
    transcriptionData: null, // JSON response from AI
    createdAt: "2025-10-25T14:30:00.000Z"
};
```

#### 4.1.2 Cooking Table
```sql
CREATE TABLE cooking_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meal_name TEXT NOT NULL,
    total_weight REAL NOT NULL,
    total_calories REAL NOT NULL,
    remaining_weight REAL NOT NULL,
    cooked_date DATE NOT NULL,
    cooked_time TIME NOT NULL,
    audio_record_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (audio_record_id) REFERENCES audio_records(id)
);
```

#### 4.1.3 Ingredients Table
```sql
CREATE TABLE ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cooking_record_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    weight REAL NOT NULL,
    calories_per_100g REAL NOT NULL,
    total_calories REAL NOT NULL,
    FOREIGN KEY (cooking_record_id) REFERENCES cooking_records(id) ON DELETE CASCADE
);
```

#### 4.1.4 Eating Records Table
```sql
CREATE TABLE eating_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    food_name TEXT NOT NULL,
    weight REAL NOT NULL,
    calories REAL NOT NULL,
    eaten_date DATE NOT NULL,
    eaten_time TIME NOT NULL,
    source TEXT NOT NULL, -- 'audio' or 'manual' or 'cooking'
    cooking_record_id INTEGER NULL,
    audio_record_id INTEGER NULL,
    status TEXT DEFAULT 'complete', -- 'complete' or 'incomplete'
    missing_data TEXT, -- JSON array of missing fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cooking_record_id) REFERENCES cooking_records(id),
    FOREIGN KEY (audio_record_id) REFERENCES audio_records(id)
);
```

## 5. User Interface Specifications

### 5.1 Navigation Structure
- **Bottom Navigation Bar** with 3 tabs:
  - Record (microphone icon)
  - Cook (chef hat icon)
  - Eat (fork/knife icon)

### 5.2 Screen 1: Record Page

#### 5.2.1 Layout Components
- **Header**: "Voice Records" + current date
- **Recording Section**: 
  - Large record button (red circle when inactive, pulsing when recording)
  - Recording timer display
  - Stop/Send button (appears during recording)
- **Records List**:
  - Grouped by date (collapsible sections)
  - Each record shows: timestamp, duration, transcribe icon
  - Latest records at top

#### 5.2.2 Record Item Components
- **Audio waveform visualization** (optional)
- **Transcribe button** (icon only) - shows loading spinner when processing
- **Transcription status indicator** (pending/complete/error)
- **Expand button** to view transcribed text

#### 5.2.3 Interactions
- **Tap record button**: Start recording
- **Tap stop**: Stop recording and show send option
- **Tap send**: Send to AI for processing
- **Tap transcribe icon**: View transcription results
- **Long press record item**: Delete option

### 5.3 Screen 2: Cook Page

#### 5.3.1 Layout Components
- **Header**: "Cooked Meals" + date filter
- **Meals List**:
  - Grouped by date (collapsible sections)
  - Latest meals at top
  - Each meal card shows: name, total weight, remaining weight, total calories

#### 5.3.2 Meal Card Components
- **Meal name** (editable on tap)
- **Weight info**: "150g remaining of 300g total"
- **Calorie info**: "450 cal total"
- **Serving input field** with gram unit
- **Add to Eat button** (plus icon)
- **Details button** (info icon)

#### 5.3.3 Meal Details View
- **Header**: Meal name with edit/delete icons
- **Summary**: Total weight, remaining weight, total calories
- **Ingredients list**:
  - Each ingredient: name, weight, calories
  - Add ingredient button (plus icon)
  - Edit/delete icons per ingredient
- **Add to Eat section**:
  - Serving size input
  - Date selector (Today/Yesterday/Custom)
  - Add button

#### 5.3.4 Interactions
- **Tap meal card**: Open details view
- **Enter serving weight + tap add**: Calculate calories and add to eat records
- **Tap details**: Open full meal management view
- **Tap edit ingredient**: Modify ingredient details
- **Tap add ingredient**: Add new ingredient to meal

### 5.4 Screen 3: Eat Page

#### 5.4.1 Layout Components
- **Header**: "Daily Calories" + date navigation
- **Date Navigation**: Previous/Next day arrows, date display
- **Daily Summary**:
  - Total calories consumed
  - Progress bar (if daily goal is set)
- **Food Items List**:
  - Chronological order (latest first)
  - Each item shows: food name, weight, calories, time

#### 5.4.2 Food Item Components
- **Food name** and source indicator (microphone/chef hat icon)
- **Weight and calorie info**: "50g - 120 cal"
- **Time stamp**
- **Status indicator** (complete/incomplete)
- **Action buttons**: Edit, Delete, Move (up/down arrows)

#### 5.4.3 Food Item Details View
- **Food name** (editable)
- **Weight input** with unit selector
- **Calories** (auto-calculated or manual)
- **Date/time picker**
- **Source information**
- **Save/Cancel buttons**

#### 5.4.4 Interactions
- **Tap food item**: Open details view
- **Tap edit**: Modify food item details
- **Tap delete**: Remove food item with confirmation
- **Tap move arrows**: Reorder items within the day
- **Change date**: Move item to different day
- **Swipe item**: Quick delete action

## 6. Core Functionality Specifications

### 6.1 Audio Recording (Web APIs)

**Phase A - Web Implementation:**
- **API**: MediaRecorder API (navigator.mediaDevices.getUserMedia)
- **Format**: WebM/Opus or MP4/AAC (browser dependent)
- **Quality**: 16kHz, 16-bit minimum
- **Duration**: Maximum 60 MINUTES (Note: MINUTES not seconds!) per recording
- **Storage**: IndexedDB for audio blobs, localStorage for metadata
- **Permissions**: Microphone access via browser permissions

**Phase B - Android Implementation:**
- **Cordova Plugin**: cordova-plugin-media-capture
- **Format**: WAV or MP3
- **Storage**: Device file system via Cordova File plugin
- **Permissions**: Android microphone permission in config.xml

### 6.2 AI Processing Workflow
1. **Upload audio** to AI service
2. **Send prompt** with current date/time context
3. **Receive JSON response** with structured data
4. **Validate response** format and completeness
5. **Handle missing data** by prompting user
6. **Store results** in appropriate database tables

### 6.3 Calorie Calculations
- **Base data**: Calories per 100g for each food type
- **Scaling**: Proportional calculation based on actual weight
- **Accuracy**: Round to nearest whole calorie
- **Validation**: Check for reasonable calorie ranges

### 6.4 Date/Time Handling
- **Current date**: Auto-supply to AI for context
- **Relative dates**: "yesterday", "3 days ago", "last Friday"
- **Absolute dates**: Specific date mentions
- **Time zones**: Use device local time
- **Format**: ISO 8601 format for database storage

## 7. Data Management

### 7.1 Local Storage
- **SQLite database** for all persistent data
- **Audio files** in app-specific storage
- **Backup/Export** capability to JSON format
- **Data cleanup** for old audio files

### 7.2 Data Validation
- **Weight ranges**: 1g to 5000g reasonable limits
- **Calorie ranges**: 0 to 2000 cal per 100g reasonable limits
- **Date validation**: Within reasonable past/future range
- **Required fields**: Enforce non-null constraints

### 7.3 Data Relationships
- **Audio records** link to both cooking and eating records
- **Cooking records** can generate multiple eating records
- **Ingredient changes** update parent meal totals
- **Cascading deletes** for related data

## 8. Error Handling

### 8.1 AI Service Errors
- **Network failures**: Show retry option with offline queue
- **Invalid responses**: Request user to manually input data
- **Service unavailable**: Graceful degradation to manual entry
- **Timeout handling**: 30-second timeout with retry logic

### 8.2 Data Validation Errors
- **Missing required fields**: Highlight and prompt for input
- **Invalid ranges**: Show acceptable value ranges
- **Duplicate entries**: Confirm or merge options
- **Calculation errors**: Fallback to manual entry

### 8.3 User Experience Errors
- **Recording failures**: Check permissions and storage space
- **Database errors**: Backup and recovery procedures
- **App crashes**: Crash reporting and recovery
- **Data loss prevention**: Auto-save and transaction rollback

## 9. Performance Requirements

### 9.1 Response Times
- **Audio recording**: Immediate start/stop response
- **AI processing**: Maximum 60 seconds with progress indicator
- **Database operations**: Maximum 500ms for queries
- **UI transitions**: Smooth 60fps animations

### 9.2 Storage Requirements
- **App size**: Maximum 5000MB
- **Database growth**: Efficient indexing and archiving
- **Audio storage**: Automatic cleanup after processing
- **Memory usage**: Maximum 100MB active usage

## 10. Security and Privacy

### 10.1 Data Privacy
- **Local storage**: All data stored locally on device
- **Audio processing**: Secure transmission to AI service
- **No cloud storage**: User data remains on device
- **Data export**: User-controlled backup options

### 10.2 Permissions
- **Microphone**: Required for audio recording
- **Storage**: Required for database and audio files
- **Network**: Required for AI service communication
- **No location**: Location data not required

## 11. Theme and Appearance

### 11.1 Theme System
- **Automatic theme detection**: Follow device system theme (light/dark)
- **Dynamic theme switching**: Automatically adapt when user changes OS theme
- **No manual override**: App theme always matches system preference
- **Consistent theming**: All UI components respect current theme

### 11.2 Light Theme Specifications
- **Background colors**: 
  - Primary background: #FFFFFF
  - Secondary background: #F5F5F5
  - Card backgrounds: #FFFFFF with subtle shadows
- **Text colors**:
  - Primary text: #212121
  - Secondary text: #757575
  - Disabled text: #BDBDBD
- **Accent colors**:
  - Primary accent: #2196F3 (blue)
  - Recording active: #F44336 (red)
  - Success actions: #4CAF50 (green)
- **Border colors**: #E0E0E0
- **Icon colors**: #616161

### 11.3 Dark Theme Specifications
- **Background colors**:
  - Primary background: #121212
  - Secondary background: #1E1E1E
  - Card backgrounds: #2C2C2C with subtle elevation
- **Text colors**:
  - Primary text: #FFFFFF
  - Secondary text: #B0B0B0
  - Disabled text: #606060
- **Accent colors**:
  - Primary accent: #64B5F6 (light blue)
  - Recording active: #EF5350 (light red)
  - Success actions: #81C784 (light green)
- **Border colors**: #404040
- **Icon colors**: #B0B0B0

### 11.4 Theme Implementation
- **Material Design 3**: Follow Material You design system
- **Color system**: Use semantic color tokens for consistency
- **Component theming**: All custom components support both themes
- **Status bar**: Match theme with appropriate contrast
- **Navigation bar**: Theme-aware styling

## 12. Future Enhancements

### 11.1 Potential Features
- **Daily calorie goals** and progress tracking
- **Nutritional information** beyond calories
- **Meal planning** and suggestions
- **Export to health apps** (Google Fit, etc.)
- **Voice commands** for navigation
- **Barcode scanning** for packaged foods
- **Recipe import** and scaling
- **Multi-language support**

### 11.2 Technical Improvements
- **Offline AI processing** with local models
- **Cloud sync** for multi-device usage
- **Advanced analytics** and reporting
- **Integration APIs** for third-party services
- **Widget support** for quick logging
- **Wear OS companion** app

## 12. Implementation Priority

### 12.1 Phase 1A - Web Application (MVP)
1. **HTML structure** - Three main pages with navigation
2. **CSS styling** - Light/dark theme system following OS preference
3. **JavaScript audio recording** - MediaRecorder API implementation
4. **Local storage** - localStorage for data persistence
5. **AI integration** - Fetch API for HTTP requests to AI service
6. **Core functionality** - Basic calorie calculations and data management
7. **Responsive design** - Mobile-first approach for all screens

### 12.1 Phase 1B - PWA Enhancement
1. **Service Worker** - Offline capability and caching
2. **Web App Manifest** - Install prompts and app-like behavior
3. **IndexedDB** - Large audio file storage
4. **Push notifications** - Meal reminders (optional)
5. **Testing** - Cross-browser compatibility

### 12.2 Phase 2A - Android Conversion
1. **Apache Cordova setup** - Project initialization and configuration
2. **Plugin integration** - File system, device permissions
3. **APK build** - Generate signed Android package
4. **Testing** - Android device testing and optimization
5. **Performance tuning** - WebView optimization

### 12.2 Phase 2B - Enhanced Features
1. **Advanced meal management** - Detailed ingredient editing
2. **Data validation** - Comprehensive error handling
3. **Export/backup** - JSON data export functionality
4. **UI improvements** - Animations and transitions
5. **Storage optimization** - Efficient data management

### 12.3 Phase 3 - Polish and Extensions
1. **Advanced analytics** - Calorie trends and reporting
2. **Voice commands** - Navigation and quick actions
3. **Barcode scanning** - Packaged food identification
4. **Recipe import** - Meal planning features
5. **Cloud sync** - Multi-device data synchronization (optional)

This specification provides a comprehensive blueprint for developing the CalorieAI application with all the features described in your concept, organized into manageable development phases.