(function () {
    'use strict';

    // Functionality for the Meat Inventory to Upload Converter
    function addMeatInventoryToUploadConverterFunctionality() {
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
                
                // Toggle this true/false to enable/disable downloading the "intermediate" CSV
                const debugMode = true;

                // Read file as text
                const reader = new FileReader();
                reader.onload = function(event) {
                    const csvData = event.target.result;
                    
                    // STEP 1: Parse the CSV
                    const parsedData = parseCSV(csvData);

                    // STEP 2: If debug mode, download the intermediate dataset
                    if (debugMode) {
                        downloadCSV(parsedData, 'intermediate_dataset.csv');
                        setTimeout(() => {
                            downloadCSV(transformedData, 'converted_inventory.csv');
                        }, 10000); // 1 second delay
                    }

                    // STEP 3: Transform the data
                    const transformedData = transformData(parsedData);

                    // STEP 4: Download the final CSV
                    downloadCSV(transformedData, 'converted_inventory.csv');
                };
                reader.readAsText(file);

                // ---------------------
                // Utility Functions
                // ---------------------

                function parseCSV(data) {
                    // Parse CSV data into an array of objects
                    const lines = data.split('\n').map(line => line.trim());
                    const headers = lines[0].split(',');

                    return lines.slice(1).map(line => {
                        const values = line.split(',');
                        return headers.reduce((obj, header, index) => {
                            obj[header.trim()] = values[index] ? values[index].trim() : '';
                            return obj;
                        }, {});
                    });
                }

                function transformData(data) {
                    // Remove rows containing "WFM Fresh Breakout"
                    const filteredData = data.filter(
                        item => item['Unnamed: 0'] && !item['Unnamed: 0'].includes('WFM Fresh Breakout')
                    );

                    const startDate = document.getElementById('startDate').value || '';
                    const endDate = document.getElementById('endDate').value || '';
                    const andonCordValue = document.getElementById('andonCordSelect').value || '';

                    const unifiedData = [];
                    
                    filteredData.forEach(item => {
                        const itemName = item['Unnamed: 0'];
                        const itemPLU = item['UPC'];

                        // For each row, assume columns 5+ are store codes:
                        const keys = Object.keys(item);
                        for (let i = 5; i < keys.length; i++) {
                            const storeCode = keys[i];
                            const inventory = item[storeCode];
                            if (storeCode && inventory) {
                                unifiedData.push({
                                    'Store - 3 Letter Code': storeCode,
                                    'Item Name': itemName,
                                    'Item PLU/UPC': itemPLU,
                                    'Current Inventory': inventory,
                                    'Andon Cord': andonCordValue,
                                    'Tracking Start Date': startDate,
                                    'Tracking End Date': endDate
                                });
                            }
                        }
                    });

                    return unifiedData;
                }

                function downloadCSV(data, filename) {
                    // Decide on your CSV headers (keys must match your objects exactly)
                    const headers = [
                        'Store - 3 Letter Code',
                        'Item Name',
                        'Item PLU/UPC',
                        'Current Inventory',
                        'Andon Cord',
                        'Tracking Start Date',
                        'Tracking End Date'
                    ];

                    // Build CSV lines
                    const csvRows = [
                        headers.join(','),
                        ...data.map(row => {
                            return headers.map(h => row[h] || '').join(',');
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

            }); // end of convertButton click
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
