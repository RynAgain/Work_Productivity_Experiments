(function () {
    'use strict';

    // Expose the function to the global scope for testing
    try {
        module.exports = {
            addPFDSInventoryConverterFunctionality
        };
    } catch (e) {
        // Handle the error if needed
    }

    function addPFDSInventoryConverterFunctionality() {
        console.log('PFDS Inventory Converter button clicked');
        try {
            // Create overlay
            var overlay = document.createElement('div');
            overlay.id = 'pfdsInventoryUploadOverlay';
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

            // Create form elements - simplified compared to meat converter (no date trackers)
            formContainer.innerHTML = `
                <h3>PFDS Inventory Converter</h3>
                <input type="file" id="pfdsInventoryFileInput" accept=".xlsx" style="width: 100%; margin-bottom: 10px;">
                
                <label>Andon Cord</label>
                <select id="andonCordSelect" style="width: 100%; margin-bottom: 10px;">
                    <option value="Enabled">Enabled</option>
                    <option value="Disabled">Disabled</option>
                </select>
                
                <button id="convertButton" style="width: 100%;">Convert & Download</button>
            `;

            formContainer.appendChild(closeButton);
            overlay.appendChild(formContainer);
            document.body.appendChild(overlay);

            // Add event listener to the "Convert & Download" button
            document.getElementById('convertButton').addEventListener('click', function() {
                const fileInput = document.getElementById('pfdsInventoryFileInput');
                if (fileInput.files.length === 0) {
                    alert('Please select an XLSX file to upload.');
                    return;
                }
                
                const file = fileInput.files[0];
                console.log('File selected:', file.name);
                
                // Toggle debug mode to automatically download the CSV output
                const debugMode = true;
                
                if (file.type.includes('sheet') || file.name.endsWith('.xlsx')) {
                    // Handle XLSX file using XLSX.js
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
                            console.log('CSV Content for sheet', sheetName, ':', csvContent);
                            processPFDSCSV(csvContent, function(groupData) {
                                unpivotedData = unpivotedData.concat(groupData);
                            });
                        });
                        
                        // Filter out rows with empty PLU/UPC or non-numeric inventory
                        unpivotedData = unpivotedData.filter(row => 
                            row['Item PLU/UPC'] !== '' && 
                            row['Item PLU/UPC'] !== null && 
                            !isNaN(row['Current Inventory'])
                        );
                        
                        if (debugMode) {
                            downloadCSV(unpivotedData, 'PFDS_Inventory_Upload.csv');
                        }
                    };
                    reader.readAsArrayBuffer(file);
                } else {
                    alert('Please select an XLSX file.');
                }
            }); // end of convertButton click

            // =========================
            // UTILITY FUNCTIONS
            // =========================

            // Process PFDS CSV data according to the specific requirements
            function processPFDSCSV(data, callback) {
                // Split CSV into lines and then into cells
                const lines = data.split('\n').filter(line => line.trim() !== '');
                const rows = lines.map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')));

                // Find the header row that starts with "Purchasable UPC" in column A
                let headerRowIndex = -1;
                for (let i = 0; i < rows.length; i++) {
                    if (rows[i][0] && rows[i][0].toLowerCase().includes('purchasable upc')) {
                        headerRowIndex = i;
                        break;
                    }
                }

                if (headerRowIndex === -1) {
                    console.warn('Could not find "Purchasable UPC" header row');
                    callback([]);
                    return;
                }

                console.log('Found header row at index:', headerRowIndex);
                const headerRow = rows[headerRowIndex].map(h => h.toLowerCase().trim());
                console.log('Header row:', headerRow);

                // Find key column indices
                const camUpcIndex = headerRow.findIndex(h => h.includes('cam upc'));
                const descriptionIndex = headerRow.findIndex(h => h.includes('description'));
                const trackedInCamIndex = headerRow.findIndex(h => h.includes('tracked in cam'));
                const casePackIndex = headerRow.findIndex(h => h.includes('case pack'));

                console.log('Column indices:', {
                    camUpcIndex,
                    descriptionIndex,
                    trackedInCamIndex,
                    casePackIndex
                });

                if (camUpcIndex === -1 || descriptionIndex === -1 || trackedInCamIndex === -1 || casePackIndex === -1) {
                    console.error('Missing required columns');
                    alert('Missing required columns in the spreadsheet. Please check the format.');
                    callback([]);
                    return;
                }

                // Find store code columns (everything after the main data columns)
                const storeCodeStartIndex = Math.max(camUpcIndex, descriptionIndex, trackedInCamIndex, casePackIndex) + 1;
                const storeCodes = [];
                for (let i = storeCodeStartIndex; i < headerRow.length; i++) {
                    const header = headerRow[i].trim();
                    if (header && header.length === 3 && /^[A-Z]{3}$/i.test(header)) {
                        storeCodes.push({ index: i, code: header.toUpperCase() });
                    }
                }

                console.log('Found store codes:', storeCodes);

                let allUnpivoted = [];

                // Process data rows (skip header and any rows above it)
                for (let rowIndex = headerRowIndex + 1; rowIndex < rows.length; rowIndex++) {
                    const row = rows[rowIndex];
                    
                    // Skip blank rows
                    if (row.every(cell => !cell || cell.trim() === '')) {
                        continue;
                    }

                    const trackedInCam = row[trackedInCamIndex] ? row[trackedInCamIndex].toUpperCase().trim() : '';
                    
                    // Only process rows where "Tracked in Cam" = "Y"
                    if (trackedInCam !== 'Y') {
                        continue;
                    }

                    const camUpc = row[camUpcIndex] || '';
                    const description = row[descriptionIndex] || '';
                    const casePackStr = row[casePackIndex] || '1';
                    const casePack = parseFloat(casePackStr.replace(/,/g, '')) || 1;

                    // Skip if no CAM UPC
                    if (!camUpc || camUpc.trim() === '') {
                        continue;
                    }

                    // Create output rows for each store
                    storeCodes.forEach(({ index, code }) => {
                        const storeValueStr = row[index] || '0';
                        const storeValue = parseFloat(storeValueStr.replace(/,/g, '')) || 0;
                        const currentInventory = Math.round((casePack * storeValue) * 100) / 100;

                        allUnpivoted.push({
                            'Store - 3 Letter Code': code,
                            'Item Name': description,
                            'Item PLU/UPC': camUpc,
                            'Availability': 'Limited',
                            'Current Inventory': currentInventory,
                            'Sales Floor Capacity': '',
                            'Andon Cord': document.getElementById('andonCordSelect').value || 'Enabled',
                            'Tracking Start Date': '',
                            'Tracking End Date': ''
                        });
                    });
                }

                console.log('Unpivoted PFDS data:', allUnpivoted);
                callback(allUnpivoted);
            }

            // Download CSV helper function
            function downloadCSV(data, filename) {
                // CSV headers (must match the output objects exactly)
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
                                return `"${(row[h] || '').toString().replace(/"/g, '""')}"`;
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
            console.error('[PFDS Inventory] PFDS Inventory Converter Failed', error);
        }
    }

    // Use MutationObserver to detect when the button is added to the DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                const pfdsInventoryButton = document.getElementById('prepFoodsInventoryButton');
                if (pfdsInventoryButton) {
                    pfdsInventoryButton.addEventListener('click', addPFDSInventoryConverterFunctionality);
                    observer.disconnect(); // Stop observing once the button is found
                }
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();