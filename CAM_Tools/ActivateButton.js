(function() {
    'use strict';

    // Function to add the activate/deactivate item(s) button
    function addActivateButton() {
        console.log('Attempting to add activate/deactivate item(s) button');

        // Check if the button already exists
        if (document.getElementById('activateButton')) {
            console.log('Activate/Deactivate item(s) button already exists');
            return;
        }

        // Create the activate/deactivate item(s) button
        var activateButton = document.createElement('button');
        activateButton.id = 'activateButton';
        activateButton.innerHTML = 'Activate/Deactivate Item(s)';
        activateButton.style.position = 'fixed';
        activateButton.style.bottom = '0';
        activateButton.style.left = '40%';
        activateButton.style.width = '20%';
        activateButton.style.height = '40px';
        activateButton.style.zIndex = '1000';
        activateButton.style.fontSize = '14px';
        activateButton.style.backgroundColor = '#004E36';
        activateButton.style.color = '#fff';
        activateButton.style.border = 'none';
        activateButton.style.borderRadius = '0';
        activateButton.style.cursor = 'pointer !important';

        // Append the button to the body
        document.body.appendChild(activateButton);
        console.log('Activate/Deactivate item(s) button added to the page');

        // Add click event to the activate/deactivate item(s) button
        activateButton.addEventListener('click', function() {
            console.log('Activate/Deactivate Item(s) button clicked');
            
            // Create overlay
            var overlay = document.createElement('div');
            overlay.id = 'activateOverlay';
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
                <h3>Activate/Deactivate Item(s)</h3>
                <label>PLU(s)</label>
                <input type="text" id="pluInput" style="width: 100%; margin-bottom: 10px;" placeholder="Enter PLU(s) separated by commas">
                <label>By</label>
                <select id="bySelect" style="width: 100%; margin-bottom: 10px;">
                    <option value="Store">Store</option>
                    <option value="Region">Region</option>
                </select>
                <label>Store/Region</label>
                <input type="text" id="storeRegionInput" style="width: 100%; margin-bottom: 10px;" placeholder="Enter Store/Region codes separated by commas">
                <label>Andon Cord</label>
                <select id="andonCordSelect" style="width: 100%; margin-bottom: 10px;">
                    <option value="Enabled">Enabled</option>
                    <option value="Disabled">Disabled</option>
                </select>
                <button id="generateUploadFileButton" style="width: 100%;">Generate Upload File</button>
            `;

            formContainer.appendChild(closeButton);
            overlay.appendChild(formContainer);
            document.body.appendChild(overlay);

            // Add event listener to close the overlay
            overlay.addEventListener('click', function(event) {
                if (event.target === overlay) {
                    document.body.removeChild(overlay);
                }
            });

            // Add click event to the "Generate Upload File" button
            document.getElementById('generateUploadFileButton').addEventListener('click', function() {
                // Logic to generate the upload file
                const pluInput = document.getElementById('pluInput').value.split(',').map(plu => plu.trim());
                const bySelect = document.getElementById('bySelect').value;
                const storeRegionInput = document.getElementById('storeRegionInput').value.split(',').map(sr => sr.trim());
                const andonCord = document.getElementById('andonCordSelect').value;

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

                    // Extract store IDs and filter based on user input
                    const storeIds = [];
                    for (const region in storeData.storesInformation) {
                        const states = storeData.storesInformation[region];
                        for (const state in states) {
                            const stores = states[state];
                            stores.forEach(store => {
                                if ((bySelect === 'Store' && storeRegionInput.includes(store.storeTLC)) ||
                                    (bySelect === 'Region' && storeRegionInput.includes(state))) {
                                    storeIds.push(store.storeTLC);
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
                                return {
                                    'Store - 3 Letter Code': storeId,
                                    'Andon Cord': andonCord,
                                    'Item Name': item.itemName,
                                    'Item PLU/UPC': item.wfmScanCode,
                                    'Availability': item.inventoryStatus,
                                    'Current Inventory': item.inventoryStatus === 'Unlimited' ? "0" : (Math.max(0, Math.min(10000, parseInt(item.currentInventoryQuantity) || 0))).toString(),
                                    'Sales Floor Capacity': '',
                                    'Tracking Start Date': '',
                                    'Tracking End Date': ''
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
                            const csvContent = "data:text/csv;charset=utf-8,"
                                + desiredHeaders.join(",") + "\n" // Add headers
                                + allItems.map(e => desiredHeaders.map(header => `"${e[header] || ''}"`).join(",")).join("\n");

                            // Create a download link
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", "upload_items_data.csv");
                            document.body.appendChild(link);

                            // Trigger the download
                            link.click();
                            document.body.removeChild(link);
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
    const observer = new MutationObserver(addActivateButton);
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial attempt to add the activate/deactivate item(s) button
    addActivateButton();
})();
