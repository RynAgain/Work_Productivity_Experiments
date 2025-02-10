(function() {
    'use strict';

    // Function to add the redrive button
    function addRedriveButton() {
        console.log('Attempting to add redrive button');

        // Check if the button already exists
        if (document.getElementById('redriveButton')) {
            console.log('Redrive button already exists');
            return;
        }

        // Create the redrive button
        var redriveButton = document.createElement('button');
        redriveButton.id = 'redriveButton';
        redriveButton.innerHTML = 'Redrive';
        redriveButton.style.position = 'fixed';
        redriveButton.style.bottom = '0';
        redriveButton.style.left = '60%';
        redriveButton.style.width = '20%';
        redriveButton.style.height = '40px';
        redriveButton.style.zIndex = '1000';
        redriveButton.style.fontSize = '14px';
        redriveButton.style.backgroundColor = '#004E36';
        redriveButton.style.color = '#fff';
        redriveButton.style.border = 'none';
        redriveButton.style.borderRadius = '0';
        redriveButton.style.cursor = 'pointer !important';

        // Append the button to the body
UIUtils.getBaseButtonsContainer().appendChild(redriveButton);
        console.log('Redrive button added to the page');

        // Add click event to the redrive button
    redriveButton.addEventListener('click', function() {
    console.log('Redrive button clicked');
    
    // Create overlay
    var overlay = document.createElement('div');
    overlay.id = 'redriveOverlay';
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
        <h3>Redrive Item(s)</h3>
        <label>PLU(s)</label>
        <input type="text" id="pluInput" style="width: 100%; margin-bottom: 10px;" placeholder="Enter PLU(s) separated by commas">
        <label>By</label>
        <select id="bySelect" style="width: 100%; margin-bottom: 10px;">
            <option value="Store">Store</option>
            <option value="Region">Region</option>
        </select>
        <label>Store/Region</label>
        <input type="text" id="storeRegionInput" style="width: 100%; margin-bottom: 10px;" placeholder="Enter Store/Region codes separated by commas">
        <label><input type="checkbox" id="allStoresCheckbox"> All Stores</label><br>
        <button id="generateRedriveFileButton" style="width: 100%;">Generate Redrive Files</button>
    `;
    var loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'redriveLoadingIndicator';
    loadingIndicator.innerHTML = 'Processing...';
    loadingIndicator.style.textAlign = 'center';
    loadingIndicator.style.marginTop = '10px';
    loadingIndicator.style.fontSize = '16px';
    loadingIndicator.style.color = '#004E36';
    formContainer.appendChild(loadingIndicator);

    formContainer.appendChild(closeButton);
overlay.appendChild(formContainer);
        UIUtils.makeDraggable(formContainer, {left: window.innerWidth/2 - 150, top: 100});
        document.body.appendChild(overlay);

    // Add event listener to close the overlay
    overlay.addEventListener('click', function(event) {
        if (event.target === overlay) {
            document.body.removeChild(overlay);
        }
    });

    // Add event listener to the "All Stores" checkbox
    document.getElementById('allStoresCheckbox').addEventListener('change', function() {
        const storeRegionInput = document.getElementById('storeRegionInput');
        storeRegionInput.disabled = this.checked;
        if (this.checked) {
            storeRegionInput.value = '';
        }
    });

    document.getElementById('generateRedriveFileButton').addEventListener('click', function() {
        // Logic to generate the redrive files
        const pluInput = Array.from(new Set(document.getElementById('pluInput').value.split(',').map(plu => plu.trim())));
        const bySelect = document.getElementById('bySelect').value;
        const storeRegionInput = Array.from(new Set(document.getElementById('storeRegionInput').value.split(',').map(sr => sr.trim())));

        // Determine the environment (prod or gamma)
        const environment = window.location.hostname.includes('gamma') ? 'gamma' : 'prod';
        const apiUrlBase = `https://${environment}.cam.wfm.amazon.dev/api/`;

        // Define the API endpoint and headers for getting stores
        const headersStores = {
            'accept': '*/*',
            'accept-encoding': 'gzip, deflate, br',
            'accept-language': 'en-US,en;q=0.9',
            'content-type': 'application/x-amz-json-1.0',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
            'x-amz-target': 'WfmCamBackendService.GetStoresInformation'
        };

        // Call the API to get the list of stores
        fetch(apiUrlBase, {
            method: 'POST',
            headers: headersStores,
            body: JSON.stringify({}),
            credentials: 'include' // Include cookies in the request
        })
        .then(response => response.json())
        .then(storeData => {
            console.log('Store data received:', storeData);

            if (!storeData || !storeData.storesInformation) {
                throw new Error('Invalid store data received');
            }

            // Extract store IDs
            const storeIds = [];
            for (const region in storeData.storesInformation) {
                const states = storeData.storesInformation[region];
                for (const state in states) {
                    const stores = states[state];
                    stores.forEach(store => {
                        if (document.getElementById('allStoresCheckbox').checked) {
                            storeIds.push(store.storeTLC);
                        } else {
                            const regionCode = region.split('-').pop(); // Extract short region code
                            if ((bySelect === 'Store' && storeRegionInput.includes(store.storeTLC)) ||
                                (bySelect === 'Region' && storeRegionInput.includes(regionCode))) {
                                storeIds.push(store.storeTLC);
                            }
                        }
                    });
                }
            }

            // Function to fetch items for a single store
            const fetchItemsForStore = (storeId) => {
                const headersItems = {
                    'accept': '*/*',
                    'accept-encoding': 'gzip, deflate, br',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/x-amz-json-1.0',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
                    'x-amz-target': 'WfmCamBackendService.GetItemsAvailability'
                };

                const payloadItems = {
                    "filterContext": {
                        "storeIds": [storeId]
                    },
                    "paginationContext": {
                        "pageNumber": 0,
                        "pageSize": 10000
                    }
                };

                return fetch(apiUrlBase, {
                    method: 'POST',
                    headers: headersItems,
                    body: JSON.stringify(payloadItems),
                    credentials: 'include' // Include cookies in the request
                })
                .then(response => response.json())
                .then(data => {
                    console.log(`Data for store ${storeId}:`, data);
                    return data.itemsAvailability.filter(item => pluInput.includes(item.wfmScanCode)).map(item => {
                        // Transformations
                        const currentState = item.andonCordState ? 'Enabled' : 'Disabled';
                        const oppositeState = item.andonCordState ? 'Disabled' : 'Enabled';
                        return {
                            'Store - 3 Letter Code': storeId,
                            'Andon Cord': currentState,
                            'Item Name': item.itemName,
                            'Item PLU/UPC': item.wfmScanCode,
                            'Availability': item.inventoryStatus,
                            'Current Inventory': item.inventoryStatus === 'Unlimited' ? "0" : (Math.max(0, Math.min(10000, parseInt(item.currentInventoryQuantity) || 0))).toString(),
                            'Sales Floor Capacity': '',
                            'Tracking Start Date': '',
                            'Tracking End Date': '',
                            'Redrive Andon Cord': oppositeState
                        };
                    });
                })
                .catch(error => {
                    console.error(`Error downloading data for store ${storeId}:`, error);
                    return [];
                });
            };

            // Fetch items for all stores and compile results
            Promise.all(storeIds.map(storeId => fetchItemsForStore(storeId)))
            .then(results => {
                const allItems = results.flat();
                console.log('Filtered items data:', allItems);

if (allItems.length > 0) {
    // Specify the correct headers to include
    const desiredHeaders = [
        'Store - 3 Letter Code', 'Item Name', 'Item PLU/UPC', 'Availability',
        'Current Inventory', 'Sales Floor Capacity', 'Andon Cord', 'Tracking Start Date', 'Tracking End Date'
    ];
    const csvContentRestore = desiredHeaders.join(",") + "\n" // Add headers
        + allItems.map(e => desiredHeaders.map(header => `"${e[header] || ''}"`).join(",")).join("\n");

    const desiredHeadersRedrive = [
        'Store - 3 Letter Code', 'Item Name', 'Item PLU/UPC', 'Availability',
        'Current Inventory', 'Sales Floor Capacity', 'Redrive Andon Cord', 'Tracking Start Date', 'Tracking End Date'
    ];
    const csvContentRedrive = desiredHeadersRedrive.join(",") + "\n" // Add headers
        + allItems.map(e => desiredHeadersRedrive.map(header => `"${e[header] || ''}"`).join(",")).join("\n");

    // Use JSZip to create a zip file containing both CSV files
    const zip = new JSZip();
    zip.file("Redrive Restore.csv", csvContentRestore);
    zip.file("Redrive.csv", csvContentRedrive);

    zip.generateAsync({ type: "blob" })
        .then(function(content) {
            // Create a download link for the zip file
            const link = document.createElement("a");
            link.href = URL.createObjectURL(content);
            link.download = "RedriveFiles.zip";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
} else {
    console.log('No items data available to download.');
}
            });
        })
        .catch(error => console.error('Error downloading data:', error));
    });
});
    }

    // Use MutationObserver to detect changes in the DOM
    const observer = new MutationObserver(addRedriveButton);
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial attempt to add the redrive button
    addRedriveButton();
})();
