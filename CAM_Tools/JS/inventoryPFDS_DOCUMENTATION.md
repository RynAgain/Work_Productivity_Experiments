# PFDS Inventory Converter - Documentation

## Overview
The PFDS Inventory Converter is a browser-based tool that processes PFDS (Prepared Foods) inventory data from Excel files and converts it into a standardized CSV format for upload to CAM (Central Availability Management) system.

## Input Requirements

### File Format
- **File Type**: `.xlsx` (Excel workbook)
- **File Structure**: Multi-sheet workbook with region-specific sheets

### Sheet Requirements

#### Valid Sheets
- **Sheet Names**: Must be 2-letter region codes (e.g., `FL`, `MA`, `TX`)
- **Pattern**: `/^[A-Z]{2}$/i` (case-insensitive, exactly 2 uppercase letters)
- **Note**: Sheets with longer names or non-matching patterns are automatically skipped

#### Required Columns
Each valid region sheet must contain the following columns (case-insensitive matching):

1. **"Purchasing UPC"** - Header row identifier (must be in column A)
2. **"CAM UPC"** - The UPC code used in CAM system
3. **"Description"** - Item description/name
4. **"Tracked in Cam"** - Flag indicating if item should be processed (must be "Y")
5. **"CAM Order Convert"** - Case pack conversion factor
6. **"Select Sub-Team"** - Marks the end of metadata columns

#### Store Code Columns
- Located after the "Select Sub-Team" column
- **Format**: 2-4 letter uppercase codes (e.g., `ABC`, `XYZ`)
- **Pattern**: `/^[A-Z]{2,4}$/i`
- Each column represents a store's inventory count

### Data Row Requirements
- **"Tracked in Cam" column**: Must contain "Y" (case-insensitive) to be processed
- **CAM UPC**: Must not be empty
- **Store Values**: Numeric values (commas are automatically stripped)
- **Case Pack**: Numeric conversion factor (defaults to 1 if missing)

## User Interface

### Form Elements
1. **File Input**: Upload `.xlsx` file
2. **Andon Cord Dropdown**: 
   - Options: "Enabled" (default) or "Disabled"
   - Applied to all output rows

## Processing Logic

### Step 1: Sheet Filtering
```javascript
// Only process sheets matching 2-letter region codes
if (sheetName.length <= 2 && /^[A-Z]{2}$/i.test(sheetName.trim()))
```

### Step 2: Header Detection
- Scans rows to find the header row containing "Purchasing UPC" in column A
- Extracts column indices for required fields
- Identifies store code columns after "Select Sub-Team"

### Step 3: Data Processing
For each data row where "Tracked in Cam" = "Y":

1. **Extract Item Data**:
   - CAM UPC
   - Description
   - Case Pack (conversion factor)

2. **Calculate Inventory per Store**:
   ```javascript
   currentInventory = Math.round((casePack * storeValue) * 100) / 100
   ```
   - `casePack`: Conversion factor from "CAM Order Convert" column
   - `storeValue`: Raw inventory count from store column
   - Result rounded to 2 decimal places

3. **Create Output Row** (one per store):
   ```javascript
   {
     'Store - 3 Letter Code': storeCode,
     'Item Name': description,
     'Item PLU/UPC': camUpc,
     'Availability': 'Limited',
     'Current Inventory': calculatedInventory,
     'Sales Floor Capacity': '',
     'Andon Cord': userSelectedValue,
     'Tracking Start Date': '',
     'Tracking End Date': ''
   }
   ```

### Step 4: Data Filtering
Final output filters out rows where:
- `Item PLU/UPC` is empty or null
- `Current Inventory` is not a number (NaN)

## Output Format

### CSV Structure
**Filename**: `PFDS_Inventory_Upload.csv`

**Headers**:
1. Store - 3 Letter Code
2. Item Name
3. Item PLU/UPC
4. Availability
5. Current Inventory
6. Sales Floor Capacity
7. Andon Cord
8. Tracking Start Date
9. Tracking End Date

### Field Details
- **Store - 3 Letter Code**: Uppercase store code from column headers
- **Item Name**: Description from input file
- **Item PLU/UPC**: CAM UPC from input file
- **Availability**: Always set to "Limited"
- **Current Inventory**: Calculated value (casePack × storeValue), rounded to 2 decimals
- **Sales Floor Capacity**: Empty string
- **Andon Cord**: User-selected value ("Enabled" or "Disabled")
- **Tracking Start Date**: Empty string
- **Tracking End Date**: Empty string

## Example Data Flow

### Input Excel Sheet (Region: FL)
```
| Purchasing UPC | CAM UPC | Description | Tracked in Cam | CAM Order Convert | Select Sub-Team | ABC | XYZ |
|----------------|---------|-------------|----------------|-------------------|-----------------|-----|-----|
| 123456         | 789012  | Apple Pie   | Y              | 6                 |                 | 10  | 5   |
```

### Processing
- Item: Apple Pie (UPC: 789012)
- Case Pack: 6
- Store ABC: 6 × 10 = 60 units
- Store XYZ: 6 × 5 = 30 units

### Output CSV
```csv
Store - 3 Letter Code,Item Name,Item PLU/UPC,Availability,Current Inventory,Sales Floor Capacity,Andon Cord,Tracking Start Date,Tracking End Date
"ABC","Apple Pie","789012","Limited",60,"","Enabled","",""
"XYZ","Apple Pie","789012","Limited",30,"","Enabled","",""
```

## Error Handling

### Missing Columns
If required columns are not found, the tool will:
1. Log error to console
2. Display alert with missing column names
3. Show available headers for debugging
4. Skip processing that sheet

### Invalid Data
- Empty CAM UPC: Row skipped
- Non-numeric inventory: Row filtered from final output
- Missing case pack: Defaults to 1
- Non-"Y" tracked status: Row skipped

## Technical Dependencies

### External Libraries
- **XLSX.js**: Excel file parsing and CSV conversion
  - Used for reading `.xlsx` files
  - Converting sheets to CSV format
  - Handling binary data

### Browser APIs
- FileReader API for file upload
- DOM manipulation for UI overlay
- Event listeners for user interactions

## Debug Mode
```javascript
const debugMode = true; // Line 83
```
When enabled (default), automatically downloads the converted CSV file after processing.

## Module Export
The function is exported for testing purposes:
```javascript
module.exports = {
    addPFDSInventoryConverterFunctionality
};
```

## Initialization
Uses MutationObserver to detect when the trigger button (`#prepFoodsInventoryButton`) is added to the DOM, then attaches the click event listener.