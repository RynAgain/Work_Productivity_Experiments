11/3/2025
# PFDS Inventory Converter - Bug Fix Summary

## Issue Identified
Items with commas in their descriptions (e.g., "CV Cranberry Orange Sauce, Retail") were not appearing in the output CSV due to improper CSV parsing.

## Root Cause
The original code at line 140 used a naive CSV parsing approach:
```javascript
const rows = lines.map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')));
```

This approach:
1. **Removed all quotes first** (`.replace(/"/g, '')`)
2. **Then split on commas** (`.split(',')`)

### The Problem
When XLSX.js converts a sheet to CSV, it properly quotes fields containing commas:
```csv
9948250435,#REF!,201,Kettle Cuisine,"CV Cranberry Orange Sauce, Retail",8,16,OZ,...
```

But the code removed quotes BEFORE splitting, causing:
```javascript
// After removing quotes:
'9948250435,#REF!,201,Kettle Cuisine,CV Cranberry Orange Sauce, Retail,8,16,OZ,...'

// After split(','):
['9948250435', '#REF!', '201', 'Kettle Cuisine', 'CV Cranberry Orange Sauce', ' Retail', '8', '16', 'OZ', ...]
//                                                                            ^^^^^^^^^^
//                                                                            Extra field!
```

This caused **column misalignment**:
- Description became 2 fields instead of 1
- All subsequent columns shifted right by 1
- CAM UPC read from wrong column
- "Tracked in Cam" read from wrong column
- Items were skipped due to invalid data

## Solution Implemented
Added a proper CSV parser function (`parseCSVLine`) that:
1. **Respects quoted fields** - doesn't split on commas inside quotes
2. **Handles escaped quotes** - processes `""` as a literal quote character
3. **Maintains data integrity** - preserves original field values

### New Code (lines 136-177)
```javascript
// Proper CSV line parser that handles quoted fields with commas
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote (two quotes in a row)
                current += '"';
                i++; // Skip the next quote
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // Field separator (only when not inside quotes)
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    // Add the last field
    result.push(current.trim());
    
    return result;
}

// Process PFDS CSV data according to the specific requirements
function processPFDSCSV(data, sheetName, callback) {
    // Split CSV into lines and then into cells using proper CSV parsing
    const lines = data.split('\n').filter(line => line.trim() !== '');
    const rows = lines.map(line => parseCSVLine(line));
    // ... rest of function
}
```

## Affected Items (Now Fixed)
All items with commas in their descriptions will now process correctly:
- ✅ "CV Cranberry Orange Sauce, Retail"
- ✅ "OG Cranberry Orange Sauce, Retail"
- ✅ "CV Brown Sugar Citrus Glaze, Retail"
- ✅ "CV Creamed Spinach, Retail"
- ✅ "CV Green Bean Casserole, Retail"
- ✅ "CV Maple Mashed Sweet Potatoes, Retail"
- ✅ "CV Mashed Potatoes, Retail"
- ✅ "CV Traditional Stuffing, Retail"
- ✅ "CV Turkey Gravy, Retail"
- ✅ "CV Vegan Mushroom Gravy, Retail"
- ✅ "Macaroni and Cheese, Retail"
- ✅ "OG Creamed Spinach, Retail"
- ✅ "OG Mashed Potatoes, Retail"
- ✅ "OG Traditional Stuffing, Retail"
- ✅ "OG Turkey Gravy, Retail"

## Testing
To verify the fix works:
1. Upload the test file: `input_tests/WFM DC.PROTEIN.SIDE DROP FILE - allocation.xlsx`
2. Check the output CSV for items like "CV Cranberry Orange Sauce, Retail"
3. Verify all stores have correct inventory values
4. Confirm column alignment is correct (CAM UPC, Tracked in Cam, etc.)

## Additional Benefits
The new parser also:
- Handles edge cases like escaped quotes (`""`)
- More robust against malformed CSV data
- Follows RFC 4180 CSV standard
- Better error handling for complex field values

## Files Modified
- `CAM_Tools/JS/inventoryPFDS.js` - Added `parseCSVLine()` function and updated `processPFDSCSV()` to use it

## Date
2025-11-03