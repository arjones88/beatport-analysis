# Frontend Documentation

## Overview
The frontend is a React TypeScript application built with Vite that displays Beatport Top 100 charts with interactive features for analyzing music trends.

## Technology Stack
- **React 18** with TypeScript
- **Vite** for build tooling and development server
- **Bootstrap 5** for UI components and styling
- **React Testing Library** + **Vitest** for testing

## Key Features

### 1. Genre Selection
- Dropdown menu with 35+ electronic music genres
- Dynamically filters displayed tracks by selected genre
- Genres include House, Techno, Drum & Bass, Dubstep, etc.

### 2. Interactive Data Table
- Displays track rankings with sortable columns:
  - **Rank**: Current position (sortable)
  - **Trend**: Movement indicator (↑ rising, ↓ falling, → stable)
  - **Title**: Track name (sortable)
  - **Artist(s)**: Artist names with appearance count (sortable)
  - **First Appeared**: Date track first entered charts (sortable)

### 3. Sorting Functionality
- Click any column header to sort ascending/descending
- Visual indicators show current sort column and direction
- Maintains sort state across data reloads

### 4. Trend Analysis
- Calculates rank changes between chart periods
- Visual indicators: green arrows for rising, red for falling, gray for stable
- Positive numbers show improvement, negative show decline

### 5. Dark/Light Mode Toggle
- Persistent theme preference stored in localStorage
- Automatic Bootstrap theme switching
- Accessible toggle button with emoji indicators

### 6. Data Loading & Error Handling
- Loading states with spinner and disabled buttons
- Error messages for API failures or empty data
- Manual reload functionality
- Displays latest data date from database
- Shows only current day's chart data while using historical data for trend calculation

### 7. Responsive Design
- Mobile-friendly table with horizontal scrolling
- Bootstrap grid system for layout
- Adaptive button and form sizing

## Component Architecture

### Main App Component (`App.tsx`)
- State management for tracks, loading, errors, and UI preferences
- API integration with backend
- Sorting and filtering logic
- Theme management

### Key Functions

#### `loadTracks()`
- Fetches track data from `/api/tracks` endpoint
- Processes raw data through `computeTrends()` function
- Updates component state with processed data

#### `computeTrends(tracks: Track[])`
- Groups tracks by genre+title+artist combination
- Calculates trend values (rank changes over time)
- Determines first appearance dates
- Returns enriched track data

#### `handleSort(column: string)`
- Toggles sort direction or changes sort column
- Updates sorting state for table display

#### `formatDate(dateStr: string)`
- Converts ISO date strings to MM/DD/YYYY format
- Handles various date input formats

### Data Flow
1. App loads → `loadTracks()` called
2. API request to backend → receives raw track data
3. `computeTrends()` processes data → adds trend and firstAppeared fields
4. Data filtered by selected genre → sorted by current criteria
5. Table renders with interactive features

## State Management
- **allTracks**: Complete dataset from API
- **tracks**: Filtered tracks for current genre
- **loading**: Boolean for loading states
- **error**: Error message string
- **loadedDate**: Latest date from database
- **selectedIndex**: Current genre selection (0-34)
- **sortColumn**: Current sort field
- **sortDirection**: 'asc' or 'desc'
- **isDarkMode**: Theme preference

## API Integration
- Single endpoint: `GET /api/tracks`
- Returns array of track objects with fields: artist, title, rank, date, genre
- CORS enabled for cross-origin requests
- Error handling for network failures

## Styling
- Bootstrap 5 classes for responsive layout
- Custom CSS in `App.css` for additional styling
- Theme-aware styling with data-bs-theme attribute
- Table hover effects and striped rows

## Testing
- Comprehensive test suite with Vitest
- React Testing Library for component testing
- Mocked fetch API for isolated testing
- Tests cover sorting, filtering, loading states, and error handling

## Performance Considerations
- Efficient sorting with cached sorted results
- Lazy loading of track data
- Optimized re-renders with proper dependency arrays
- Minimal DOM updates for sorting changes