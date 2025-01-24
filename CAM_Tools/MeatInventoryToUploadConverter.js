(function () {
    'use strict';

// Functionality for the Meat Inventory to Upload Converter
function addMeatInventoryToUploadConverterFunctionality() {
    console.log('Meat Inventory to Upload Converter button clicked');
    // Create overlay
    try {
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
        const reader = new FileReader();
        reader.onload = function(event) {
            const csvData = event.target.result;
            const parsedData = parseCSV(csvData);
            const transformedData = transformData(parsedData);
            const debugMode = true; // Set this to true to download the intermediate dataset
            if (debugMode) {
                downloadCSV(parsedData, 'intermediate_dataset.csv');
            }
            downloadCSV(transformedData, 'converted_inventory.csv');
        };
        reader.readAsText(file);

        function parseCSV(data) {
            // Parse CSV data into an array of objects
            const lines = data.split('\n');
            const headers = lines[0].split(',');
            return lines.slice(1).map(line => {
                const values = line.split(',');
                return headers.reduce((obj, header, index) => {
                    obj[header.trim()] = values[index].trim();
                    return obj;
                }, {});
            });
        }

        function transformData(data) {
            // Remove rows with "WFM Fresh Breakout 2024"
            const filteredData = data.filter(item => !item['Unnamed: 0'].includes('WFM Fresh Breakout 2024'));

            // Simplify charts into one set of headers
            const unifiedData = [];
            filteredData.forEach(item => {
                const itemName = item['Unnamed: 0'];
                const itemPLU = item['UPC'];
                for (let i = 5; i < Object.keys(item).length; i++) {
                    const storeCode = Object.keys(item)[i];
                    const inventory = item[storeCode];
                    if (storeCode && inventory) {
                        unifiedData.push({
                            'Item Name': itemName,
                            'Item PLU/UPC': itemPLU,
                            'Store - 3 Letter Code': storeCode,
                            'Current Inventory': inventory,
                            'Tracking Start Date': document.getElementById('startDate').value || '',
                            'Tracking End Date': document.getElementById('endDate').value || ''
                        });
                    }
                }
            });

            // Return the cleaned long-form dataset
            return unifiedData;
        }

        function downloadCSV(data, filename) {
            // Convert data to CSV format and trigger download
            const csvContent = "data:text/csv;charset=utf-8,"
                + ['Store - 3 Letter Code,Item Name,Item PLU/UPC,Availability,Current Inventory,Sales Floor Capacity,Andon Cord,Tracking Start Date,Tracking End Date']
                .concat(data.map(item => Object.values(item).join(',')))
                .join('\n');

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "converted_inventory.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

    });
} catch (error) {
    console.error('[MeatInventory] Meat Inventory Failed', error)
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
