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

                // Determine file type and read accordingly
                if (file.type.includes('sheet') || file.name.endsWith('.xlsx')) {
                    // Handle XLSX file
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        const data = new Uint8Array(event.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        let unpivotedData = [];
                        workbook.SheetNames.forEach(sheetName => {
                            console.log('Raw Sheet Data:', workbook.Sheets[sheetName]);
                            // Remove all formatting from the sheet
                            const sheet = workbook.Sheets[sheetName];
                            Object.keys(sheet).forEach(cell => {
                                if (cell[0] !== '!') {
                                    delete sheet[cell].s; // Remove style property
                                }
                            });
                            const csvContent = XLSX.utils.sheet_to_csv(sheet, { raw: true });
                            console.log('CSV Content:', csvContent);
                            const parsedData = parseCSV(csvContent);
                            console.log('Parsed Data:', parsedData);
                            console.log('Headers:', parsedData[0]);
                            const charts = extractCharts(parsedData);
                            console.log('Data after unpivoting:', charts);
                            unpivotedData = unpivotedData.concat(charts.flatMap(chart => unpivotChart(chart)));
                            console.log('Unpivot:', unpivotedData);
                        });
                        // Remove rows where "Item PLU/UPC" is an empty string or "Current Inventory" is NaN
                        unpivotedData = unpivotedData.filter(row => row['Item PLU/UPC'] !== '' && !isNaN(row['Current Inventory']));
                        if (debugMode) {
                            downloadCSV(unpivotedData, 'Inventory_Upload.csv');
                        }
                    };
                    reader.readAsArrayBuffer(file);
                } else {
                    // Handle CSV file
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        const csvData = event.target.result;
                        
                        // STEP 1: Parse the CSV
                        const parsedData = parseCSV(csvData);
                        const charts = extractCharts(parsedData);
                        const unpivotedData = charts.flatMap(chart => unpivotChart(chart));
                        
                    // STEP 2: If debug mode, download the intermediate dataset with all columns 
                    // NOTE:  I some how ended up making the intermediate dataset the full data set.  so debug mode technically doesn't need to exist now but I am afraid/don't see a point to remove it.
                        if (debugMode) {
                            downloadCSV(unpivotedData, 'Inventory_Upload.csv');
                        }
                    };
                    reader.readAsText(file);
                }

                // ---------------------
                // Utility Functions
                // ---------------------

                function parseCSV(data) {
                    // Split the CSV data into lines and filter out any empty lines
                    const lines = data.split('\n').filter(line => line.trim() !== '');

                    // Use the second line as headers since the first line is not needed
                    const headers = lines[1].split(',');

                    // Map each line to an object using the headers as keys, filtering out lines with only the first cell filled
                    return lines.slice(1).filter(line => {
                        const values = line.split(',');
                        // Ignore lines where "Unnamed: X" appears in three or more cells within the row
                        if (values.filter(v => v.startsWith('Unnamed:')).length >= 10) {
                            return false;
                        }
                        return values.some((value, index) => index > 0 && value.trim() !== '');
                    }).map(line => {
                        const values = line.split(',');
                        // Reduce the values into an object with header-value pairs
                        return headers.reduce((obj, header, index) => {
                            // Trim each value and assign it to the corresponding header
                            obj[header.trim()] = values[index] ? values[index].trim() : '';
                            return obj;
                        }, {});
                    });
                }

                function extractCharts(data) {
                    const charts = [];
                    let currentChart = [];
                    data.forEach(row => {
                        if (row['ITEM#'] && row['PLU/UPC'] && row['VIN'] && row['Head/Case']) {
                            if (currentChart.length > 0) {
                                charts.push(currentChart);
                                currentChart = [];
                            }
                        } else {
                            currentChart.push(row);
                        }
                    });
                    if (currentChart.length > 0) {
                        charts.push(currentChart);
                    }
                    return charts;
                }

                function unpivotChart(chart) {
                    const headers = chart[0];
                    return chart.slice(1).flatMap(row => {
                        return Object.keys(row).slice(5).filter(storeCode => !['Grand Total', '2024 Order', 'To Allocate', 'Avg Case Weight', 'Cases/Pallet', 'Pallet Total', 'Weight Total', '2024 Order NDC', 'DC Inventory', 'New Allo Total', 'Reduce', 'pr store'].includes(storeCode)).map(storeCode => ({
                            'Item Name': row['Unnamed: 0'] || row[headers[0]],
                            'Item PLU/UPC': row['PLU/UPC'] !== 'PLU/UPC' ? row['PLU/UPC'] : '',
                            'Availability': 'Limited',
                            'Current Inventory': row[storeCode] !== undefined && row[storeCode] !== null && row[storeCode] !== '' ? Math.round(parseFloat(row[storeCode]) * 100) / 100 : 0,
                            'Sales Floor Capacity': '',
                            'Store - 3 Letter Code': storeCode,

                            'Andon Cord': document.getElementById('andonCordSelect').value || ''
                        }));
                    });
                }


                function downloadCSV(data, filename) {
                    // Decide on your CSV headers (keys must match your objects exactly)
                    //
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

                    // Build CSV lines
                    const csvRows = [
                        headers.join(','),
                        ...data.map(row => {
                            return headers.map(h => {
                                if (h === 'Current Inventory') {
                                    return row[h] !== undefined && row[h] !== null && row[h] !== '' ? row[h] : 0;
                                }
                                return row[h] || '';
                            }).join(',');
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
