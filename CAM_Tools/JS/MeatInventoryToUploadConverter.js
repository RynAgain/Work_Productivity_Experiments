(function () {
    'use strict';

    // Expose the function to the global scope for testing
    try {
        module.exports = {
            addMeatInventoryToUploadConverterFunctionality
        };
    } catch (e) {
        // Handle the error if needed
    }

    function addMeatInventoryToUploadConverterFunctionality() {  // Added function declaration
        console.log('Meat Inventory to Upload Converter button clicked');
        try {
            // Create overlay
            var overlay = document.createElement('div');
            overlay.id = 'meatInventoryUploadOverlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            overlay.style.zIndex = '1001';
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';

            // Create close button
            var closeButton = document.createElement('span');
            closeButton.innerHTML = '&times;';
            closeButton.style.position = 'absolute';
            closeButton.style.top = '10px';
            closeButton.style.right = '10px';
            closeButton.style.fontSize = '24px';
            closeButton.style.cursor = 'pointer';
            closeButton.style.color = '#fff';
            closeButton.style.backgroundColor = '#000';
            closeButton.style.padding = '5px';
            closeButton.style.borderRadius = '0';
            closeButton.addEventListener('click', function() {
                document.body.removeChild(overlay);
            });

            var formContainer = document.createElement('div');
            formContainer.style.position = 'relative';
            formContainer.style.backgroundColor = '#fff';
            formContainer.style.padding = '20px';
            formContainer.style.borderRadius = '5px';
            formContainer.style.width = '300px';

            // Create form elements
            formContainer.innerHTML = `
                <h3>Meat Inventory to Upload Converter</h3>
                <input type="file" id="meatInventoryFileInput" accept=".xlsx, .csv" style="width: 100%; margin-bottom: 10px;">
                
                <label>Andon Cord</label>
                <select id="andonCordSelect" style="width: 100%; margin-bottom: 10px;">
                    <option value="Enabled">Enabled</option>
                    <option value="Disabled">Disabled</option>
                </select>

                <label>Start Date</label>
                <input type="date" id="startDate" style="width: 100%; margin-bottom: 10px;">
                
                <label>End Date</label>
                <input type="date" id="endDate" style="width: 100%; margin-bottom: 10px;">
                
                <button id="convertButton" style="width: 100%;">Convert & Download</button>
            `;

            formContainer.appendChild(closeButton);
            overlay.appendChild(formContainer);
            document.body.appendChild(overlay);

            // Add event listener to the "Convert & Download" button
            document.getElementById('convertButton').addEventListener('click', function() {
                const fileInput = document.getElementById('meatInventoryFileInput');
                if (fileInput.files.length === 0) {
                    alert('Please select a file to upload.');
                    return;
                }
                
                const file = fileInput.files[0];
                console.log('File selected:', file.name);
                
                // Toggle debug mode to automatically download the CSV output
                const debugMode = true;
                
                if (file.type.includes('sheet') || file.name.endsWith('.xlsx')) {
                    // Handle XLSX file using XLSX.js (assumes XLSX is available)
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        const data = new Uint8Array(event.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        let unpivotedData = [];
                        workbook.SheetNames.forEach(sheetName => {
                            console.log('Processing sheet:', sheetName);
                            const sheet = workbook.Sheets[sheetName];
                            // Remove style properties
                            Object.keys(sheet).forEach(cell => {
                                if (cell[0] !== '!') {
                                    delete sheet[cell].s;
                                }
                            });
                            const csvContent = XLSX.utils.sheet_to_csv(sheet, { raw: true });
                            console.log('CSV Content:', csvContent);
                            processCSV(csvContent, function(groupData) {
                                unpivotedData = unpivotedData.concat(groupData);
                            });
                        });
                        // Filter out rows with empty PLU/UPC or non-numeric inventory
                        unpivotedData = unpivotedData.filter(row => row['Item PLU/UPC'] !== '' && !isNaN(row['Current Inventory']));
                        if (debugMode) {
                            downloadCSV(unpivotedData, 'Inventory_Upload.csv');
                        }
                    };
                    reader.readAsArrayBuffer(file);
                } else {
                    // Handle CSV file directly
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        const csvData = event.target.result;
                        let unpivotedData = [];
                        processCSV(csvData, function(groupData) {
                            unpivotedData = unpivotedData.concat(groupData);
                        });
                        unpivotedData = unpivotedData.filter(row => row['Item PLU/UPC'] !== '' && !isNaN(row['Current Inventory']));
                        if (debugMode) {
                            downloadCSV(unpivotedData, 'Inventory_Upload.csv');
                        }
                    };
                    reader.readAsText(file);
                }
            }); // end of convertButton click

            // =========================
            // UTILITY FUNCTIONS
            // =========================
            // Helper function to format date from YYYY-MM-DD to MM/DD/YYYY.
            function formatDate(dateString) {
                if (!dateString) {
                    return '';
                }
                const parts = dateString.split('-');
                if (parts.length !== 3) {
                    return dateString;
                }
                return parts[1] + '/' + parts[2] + '/' + parts[0];
            }

            // Process CSV data into groups and then unpivot each row.
            // This version works on raw rows (arrays) so we can handle multiple header rows.
            function processCSV(data, callback) {
                // Split CSV into lines and then into cells
                const lines = data.split('\n').filter(line => line.trim() !== '');
                const rows = lines.map(line => line.split(',').map(cell => cell.trim()));

                // Filter out title rows (those that have only one nonempty cell)
                const filteredRows = rows.filter(row => row.filter(cell => cell !== '').length > 1);

                // Group rows: whenever a row has a header signature in columns 2–5, start a new group.
                let groups = [];
                let currentGroup = null;
                filteredRows.forEach(row => {
                    if (
                        row.length >= 5 &&
                        row[1].toLowerCase() === 'item#' &&
                        row[2].toLowerCase() === 'plu/upc' &&
                        row[3].toLowerCase() === 'vin' &&
                        row[4].toLowerCase() === 'head/case'
                    ) {
                        if (currentGroup) {
                            groups.push(currentGroup);
                        }
                        // Use trimmed & lowercased header keys for consistency
                        currentGroup = { header: row.map(x => x.trim().toLowerCase()), data: [] };
                    } else {
                        if (currentGroup) {
                            currentGroup.data.push(row);
                        }
                    }
                });
                if (currentGroup) {
                    groups.push(currentGroup);
                }
                console.log('Detected groups:', groups);

                // Retrieve tracking dates from the form
                const trackingStartDate = document.getElementById('startDate').value || '';
                const trackingEndDate = document.getElementById('endDate').value || '';

                // For each group, convert data rows into objects using that group's header,
                // then "unpivot" each row (i.e. create one output row for each store code column).
                let allUnpivoted = [];
                groups.forEach(group => {
                    const keys = group.header; // already trimmed and lowercased
                    group.data.forEach(row => {
                        // Create an object mapping each header to its cell value.
                        let obj = {};
                        for (let i = 0; i < keys.length; i++) {
                            obj[keys[i]] = row[i] || '';
                        }
                        // Use the first column as the Item Name, ignoring any values from 'item#' or 'vin'
                        let itemName = obj[keys[0]];

                        // In many cases, the PLU/UPC column in a header row might be the literal text "plu/upc".
                        // If so, set it to empty.
                        let plu = (obj['plu/upc'] && obj['plu/upc'].toLowerCase() === 'plu/upc') ? '' : obj['plu/upc'];

                        // Unpivot: assume that store code columns are those starting at index 5.
                        // (Adjust the starting index if needed for your data.)
                        Object.keys(obj)
                            .slice(5)
                            .filter(storeCode => {
                                // Ensure the key is trimmed
                                const s = storeCode.trim().toLowerCase();
                                return ![
                                    'grand total', '2024 order', 'to allocate', 'avg case weight',
                                    'cases/pallet', 'pallet total', 'weight total', '2024 order ndc',
                                    'dc inventory', 'new allo total', 'reduce', 'pr store', '',
                                    'poet for the hawaii stores'
                                ].includes(s);
                            })
                            .forEach(storeCode => {
                                // Remove any commas from the cell value and convert to number.
                                let cellVal = obj[storeCode].replace(/,/g, '');
                                let numericVal = cellVal !== '' ? Math.round(parseFloat(cellVal) * 100) / 100 : 0;
                                allUnpivoted.push({
                                    'Item Name': itemName,
                                    'Item PLU/UPC': plu,
                                    'Availability': 'Limited',
                                    'Current Inventory': numericVal,
                                    'Sales Floor Capacity': '',
                                    'Store - 3 Letter Code': storeCode.toUpperCase(),
                                    'Andon Cord': document.getElementById('andonCordSelect').value || '',
                                    'Tracking Start Date': formatDate(trackingStartDate),
                                    'Tracking End Date': formatDate(trackingEndDate)
                                });
                            });
                    });
                });
                console.log('Unpivoted data:', allUnpivoted);
                callback(allUnpivoted);
            }

            // Download CSV helper function
            function downloadCSV(data, filename) {
                // CSV headers (keys must match the output objects exactly)
                const headers = [
                    'Store - 3 Letter Code',
                    'Item Name',
                    'Item PLU/UPC',
                    'Availability',
                    'Current Inventory',
                    'Sales Floor Capacity',
                    'Andon Cord',
                    'Tracking Start Date',
                    'Tracking End Date'
                ];

                // Build CSV rows
                const csvRows = [
                    headers.join(','),
                    ...data.map(row => {
                        return headers
                            .map(h => {
                                if (h === 'Current Inventory') {
                                    return row[h] !== undefined && row[h] !== null && row[h] !== '' ? row[h] : 0;
                                }
                                return row[h] || '';
                            })
                            .join(',');
                    })
                ];

                // Create CSV string
                const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
                const encodedUri = encodeURI(csvContent);

                // Create a hidden link and trigger download
                const link = document.createElement('a');
                link.setAttribute('href', encodedUri);
                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (error) {
            console.error('[MeatInventory] Meat Inventory Failed', error);
        }
    }

    // Use MutationObserver to detect when the button is added to the DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                const meatInventoryToUploadConverterButton = document.getElementById('meatInventoryToUploadConverterButton');
                if (meatInventoryToUploadConverterButton) {
                    meatInventoryToUploadConverterButton.addEventListener('click', addMeatInventoryToUploadConverterFunctionality);
                    observer.disconnect(); // Stop observing once the button is found
                }
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
