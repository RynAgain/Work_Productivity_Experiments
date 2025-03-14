(function() {
    'use strict';

    // Expose the function to the global scope for testing
    try {
        module.exports = {
            addComponentUploadBuilderFunctionality
        };
    } catch (e) {
        // Handle the error if needed
    }

    function addComponentUploadBuilderFunctionality() {
        console.log('Component Upload Builder button clicked');
        // Create overlay
        var overlay = document.createElement('div');
        overlay.id = 'componentUploadBuilderOverlay';
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
        formContainer.style.width = '400px';

        // Create form elements
        formContainer.innerHTML = `
            <h3>Component Builder & Propagator</h3>
            <label for="itemListInput">Item List (.xlsx, .csv) <a href="#" id="downloadItemListTemplate">Download Template</a></label>
            <input type="file" id="itemListInput" accept=".xlsx, .csv" style="width: 100%; margin-bottom: 10px;">
            <label for="storeMapInput">Store Map (.xlsx, .csv) <a href="#" id="downloadStoreMapTemplate">Download Template</a></label>
            <input type="file" id="storeMapInput" accept=".xlsx, .csv" style="width: 100%; margin-bottom: 10px;">
            <button id="processFilesButton" style="width: 100%; margin-bottom: 10px;">Process Files</button>
            <div id="statusMessage" style="text-align: center; font-size: 14px; color: #004E36;"></div>
        `;

        document.getElementById('downloadItemListTemplate').addEventListener('click', function(event) {
            event.preventDefault();
            const headers = ['sku', 'itemName', 'region'];
            const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "ItemListTemplate.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });

        document.getElementById('downloadStoreMapTemplate').addEventListener('click', function(event) {
            event.preventDefault();
            const headers = ['Store ID', 'Region', 'Merchant ID', 'WFMOA Merchant ID'];
            const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "StoreMapTemplate.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });

        formContainer.appendChild(closeButton);
        overlay.appendChild(formContainer);
        document.body.appendChild(overlay);

        document.getElementById('processFilesButton').addEventListener('click', function() {
            const itemListFile = document.getElementById('itemListInput').files[0];
            const storeMapFile = document.getElementById('storeMapInput').files[0];
            const statusMessage = document.getElementById('statusMessage');

            if (!itemListFile || !storeMapFile) {
                statusMessage.innerText = 'Please select both files.';
                return;
            }

            statusMessage.innerText = 'Processing...';

            // Read and process the item list file
            const reader = new FileReader();
            reader.onload = function(event) {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const itemListSheet = workbook.Sheets[workbook.SheetNames[0]];
                const itemList = XLSX.utils.sheet_to_json(itemListSheet);

                // Read and process the store map file
                const storeReader = new FileReader();
                storeReader.onload = function(event) {
                    const csvData = event.target.result;
                    const storeMap = Papa.parse(csvData, { header: true }).data;

                    // Propagate items across relevant Store IDs
                    const result = [];
                    itemList.forEach(item => {
                        const regions = item.region.split(',').map(r => r.trim());
                        storeMap.forEach(store => {
                            if (regions.includes(store.Region)) {
                                result.push({
                                    sku: item.sku,
                                    itemName: item.itemName,
                                    storeId: store['Store ID'],
                                    merchantId: store['Merchant ID'],
                                    wfmoaMerchantId: store['WFMOA Merchant ID']
                                });
                            }
                        });
                    });

                    // Create and download the result as an xlsx file
                    const resultSheet = XLSX.utils.json_to_sheet(result);
                    const resultWorkbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(resultWorkbook, resultSheet, 'Results');
                    XLSX.writeFile(resultWorkbook, 'Component_Propagation_Results.xlsx');

                    statusMessage.innerText = 'Processing complete. File downloaded.';
                };
                storeReader.readAsText(storeMapFile);
            };
            reader.readAsArrayBuffer(itemListFile);
        });
    }

    // Use MutationObserver to detect when the button is added to the DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                const componentUploadBuilderButton = document.getElementById('componentUploadBuilderButton');
                if (componentUploadBuilderButton) {
                    componentUploadBuilderButton.addEventListener('click', addComponentUploadBuilderFunctionality);
                    observer.disconnect(); // Stop observing once the button is found
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();