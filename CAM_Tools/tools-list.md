# CAM Tools - Main Tools Overview

This document provides a comprehensive list of the main tools built into the CAM Tools project, with brief descriptions of their functionality.

## Core Tools

### 1. Download Button
Downloads item data as CSV files based on selected filters including PLUs, stores, and regions. Provides flexible filtering options with "Everything, Everywhere" mode for comprehensive data exports and supports both specific item selection and bulk data retrieval. Provides more detialed data than what CaM provides in its standard export.

### 2. Mass Upload & Chunker
Automatically splits large CSV files into manageable chunks (default 1000 rows) and uploads them sequentially with intelligent error handling and progress tracking.

### 3. Add New Item(s)
Generates CSV upload files for adding new items to selected stores with configurable inventory, availability, andon cord settings, and tracking dates. Supports both individual store selection and "All Stores" mode for system-wide item additions.

### 4. Redrive Tool
Provides two methods for generating redrive files: API-based generation that fetches current item states and flips andon cord values, and file upload conversion that processes existing CSV files. Creates both redrive and restore files packaged in ZIP format for easy deployment.

### 5. Existing Item Editor
Comprehensive spreadsheet-like editor for modifying existing item data with advanced features including undo/redo functionality, auto-save, bulk operations, filtering, mass inventory incrementing, and real-time validation. Supports multi-store and multi-PLU editing with team-based filtering capabilities.

### 6. Activate/Deactivate Items
Generates upload files for activating or deactivating items by setting andon cord states (Enabled/Disabled) across selected stores and regions. Fetches current item data and applies the specified andon cord state to create ready-to-upload CSV files.

### 7. General Help Tools
Provides a centralized modal interface with access to 12+ utility tools including PLU deduplication, scan code conversion, ASIN lookup, store information retrieval, inventory converters , file processing tools, audit history functions, and desync detection. Features both standard tools and password-protected restricted functions, plus quick access to daily inventory reports and system credits.

## Additional Features

Each tool includes:
- **Environment Detection**: Automatically detects prod vs gamma environments
- **Progress Tracking**: Real-time progress indicators during data processing
- **Error Handling**: Robust error handling with retry mechanisms
- **Batch Processing**: Efficient API calls using batching to prevent system overload
- **Data Validation**: Built-in validation for data integrity
- **User-Friendly Interface**: Modern modal dialogs with helpful information tooltips

## Usage Notes

- All tools generate CSV files compatible with the CAM system upload format
- Tools support both individual store codes and region-based filtering
- Most tools include "All Stores" options for system-wide operations
- Files are automatically downloaded to the user's default download directory
- Progress indicators show real-time status during data processing operations