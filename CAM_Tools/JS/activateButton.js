 (function() {
    'use strict';

    // Expose the function to the global scope for testing
    try {
        module.exports = {
            addActivateButton
        };
    } catch (e) {
        // Handle the error if needed
    }

    function addActivateButton() {
        console.log('Attempting to add activate/deactivate item(s) button');

        // Check if the button already exists
        if (document.getElementById('activateButton')) {
            console.log('Activate/Deactivate item(s) button already exists');
            return;
        }

        // Create the activate/deactivate item(s) button
        const activateButton = document.createElement('button');
        activateButton.id = 'activateButton';
        activateButton.innerHTML = 'Activate/Deactivate Item(s)';
        activateButton.className = 'button';
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
        activateButton.style.borderRadius = '5px';
        activateButton.style.cursor = 'pointer !important';

        // Append the button to the body
        document.body.appendChild(activateButton);
        activateButton.addEventListener('mouseover', function() {
            activateButton.style.backgroundColor = '#218838';
        });
        activateButton.addEventListener('mouseout', function() {
            activateButton.style.backgroundColor = '#004E36';
        });
        console.log('Activate/Deactivate item(s) button added to the page');

        // Add click event to the activate/deactivate item(s) button
        activateButton.addEventListener('click', function() {
            console.log('Activate/Deactivate Item(s) button clicked');
            
            // Create overlay
            const overlay = document.createElement('div');
            overlay.id = 'activateOverlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100vw';
            overlay.style.height = '100vh';
            overlay.style.background = 'rgba(0,0,0,0.5)';
            overlay.style.zIndex = '1001';
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';

            // Card container
            const formContainer = document.createElement('div');
            formContainer.style.position = 'relative';
            formContainer.style.background = '#fff';
            formContainer.style.padding = '0';
            formContainer.style.borderRadius = '12px';
            formContainer.style.width = '300px';
            formContainer.style.maxWidth = '95vw';
            formContainer.style.boxShadow = '0 8px 32px rgba(0,0,0,0.18), 0 1.5px 6px rgba(0,78,54,0.10)';
            formContainer.style.border = '1.5px solid #e0e0e0';
            formContainer.style.fontFamily = 'Segoe UI, Arial, sans-serif';
            formContainer.style.overflow = 'hidden';

            // Header bar
            var headerBar = document.createElement('div');
            headerBar.style.background = '#004E36';
            headerBar.style.color = '#fff';
            headerBar.style.padding = '10px 16px 8px 16px';
            headerBar.style.fontSize = '17px';
            headerBar.style.fontWeight = 'bold';
            headerBar.style.letterSpacing = '0.5px';
            headerBar.style.display = 'flex';
            headerBar.style.alignItems = 'center';
            headerBar.style.justifyContent = 'space-between';
            headerBar.innerHTML = `<span>Activate/Deactivate Item(s)</span>`;

            // Close button
            const closeButton = document.createElement('span');
            closeButton.innerHTML = '&times;';
            closeButton.id = 'activateOverlayCloseButton';
            closeButton.style.fontSize = '22px';
            closeButton.style.cursor = 'pointer';
            closeButton.style.marginLeft = '8px';
            closeButton.style.color = '#fff';
            closeButton.style.background = 'transparent';
            closeButton.style.border = 'none';
            closeButton.style.padding = '0 4px';
            closeButton.style.borderRadius = '4px';
            closeButton.style.transition = 'background 0.2s';
            closeButton.addEventListener('mouseenter', function() {
                closeButton.style.background = 'rgba(0,0,0,0.12)';
            });
            closeButton.addEventListener('mouseleave', function() {
                closeButton.style.background = 'transparent';
            });
            closeButton.addEventListener('click', function() {
                document.body.removeChild(overlay);
            });
            headerBar.appendChild(closeButton);
            formContainer.appendChild(headerBar);

            // Content area
            var contentArea = document.createElement('div');
            contentArea.style.padding = '12px 16px';
            contentArea.style.display = 'flex';
            contentArea.style.flexDirection = 'column';
            contentArea.style.gap = '6px';
            contentArea.style.maxHeight = '80vh';
            contentArea.style.overflowY = 'auto';

            // Main content HTML
            contentArea.innerHTML = `
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="flex:1;">
                        <label style="margin-bottom:2px;display:block;">PLU(s)</label>
                        <input type="text" id="pluInput" style="width:100%;padding:6px 8px;border:1px solid #ccc;border-radius:5px;font-size:14px;" placeholder="Enter PLU(s) separated by commas">
                    </div>
                    <label style="font-weight:500;display:flex;align-items:center;gap:4px;margin-top:18px;">
                        <input type="checkbox" id="allStoresCheckbox" style="margin-right:4px;"> All Stores
                    </label>
                </div>
                <label style="margin-bottom:2px;">By</label>
                <select id="bySelect" style="width:100%;padding:6px 8px;border:1px solid #ccc;border-radius:5px;font-size:14px;">
                    <option value="Store">Store</option>
                    <option value="Region">Region</option>
                </select>
                <label style="margin-bottom:2px;">Store/Region</label>
                <input type="text" id="storeRegionInput" style="width:100%;padding:6px 8px;border:1px solid #ccc;border-radius:5px;font-size:14px;" placeholder="Enter Store/Region codes separated by commas">
                <label style="margin-bottom:2px;">Andon Cord</label>
                <select id="andonCordSelect" style="width:100%;padding:6px 8px;border:1px solid #ccc;border-radius:5px;font-size:14px;">
                    <option value="Enabled">Enabled</option>
                    <option value="Disabled">Disabled</option>
                </select>
                <button id="generateUploadFileButton" style="width:100%;margin-top:10px;background:#004E36;color:#fff;border:none;border-radius:5px;padding:8px 0;font-size:15px;cursor:pointer;transition:background 0.2s;">Generate Upload File</button>
            `;
            formContainer.appendChild(contentArea);
            overlay.appendChild(formContainer);
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

            document.getElementById('generateUploadFileButton').addEventListener('click', function() {
                const generateButton = document.getElementById('generateUploadFileButton');
                var originalButtonText = generateButton.innerHTML;
                
                
                // Logic to generate the upload file
                const pluInput = Array.from(new Set(document.getElementById('pluInput').value.split(',').map(plu => plu.trim())));
                const bySelect = document.getElementById('bySelect').value;
                const storeRegionInput = Array.from(new Set(document.getElementById('storeRegionInput').value.split(',').map(sr => sr.trim())));
                const andonCord = document.getElementById('andonCordSelect').value;
                const loadingIndicator = document.createElement('div');
                loadingIndicator.id = 'loadingIndicator';
                loadingIndicator.innerHTML = 'Processing...';
                loadingIndicator.style.textAlign = 'center';
                loadingIndicator.style.marginTop = '10px';
                loadingIndicator.style.fontSize = '16px';
                loadingIndicator.style.color = '#004E36';
                formContainer.appendChild(loadingIndicator);

                // Determine the environment (prod or gamma)
                const environment = window.location.hostname.includes('gamma') ? 'gamma' : 'prod';
                const apiUrlBase = `https://${environment}.cam.wfm.amazon.dev/api/`;
                const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

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
                delay(500).then(() => fetch(apiUrlBase, {
                    method: 'POST',
                    headers: headersStores,
                    body: JSON.stringify({}),
                    credentials: 'include' // Include cookies in the request
                }))
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
                                    const regionParts = region.split('-');
                                    const regionCode = regionParts[regionParts.length - 1]; // Extract short region code
                                    if ((bySelect === 'Store' && storeRegionInput.includes(store.storeTLC)) ||
                                        (bySelect === 'Region' && storeRegionInput.includes(regionCode))) {
                                        storeIds.push(store.storeTLC);
                                    }
                                }
                            });
                        }
                    }

                    // Define batching for fetching items for stores
                    const batchSize = 10;
                    const storeIdBatches = [];
                    for (let i = 0; i < storeIds.length; i += batchSize) {
                        storeIdBatches.push(storeIds.slice(i, i + batchSize));
                    }
                    loadingIndicator.innerHTML = 'Processing batches...';
                    const retryLimit = 10;
                    const fetchItemsForStores = (storeIdsBatch) => {
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
                                "storeIds": storeIdsBatch
                            },
                            "paginationContext": {
                                "pageNumber": 0,
                                "pageSize": 10000
                            }
                        };

                        return delay(500).then(() => fetch(apiUrlBase, {
                            method: 'POST',
                            headers: headersItems,
                            body: JSON.stringify(payloadItems),
                            credentials: 'include'
                        }))
                        .then(response => response.json())
                        .then(data => {
                            console.log(`Data for store batch:`, data);
                            return data.itemsAvailability.filter(item => pluInput.includes(item.wfmScanCode)).map(item => {
                                return {
                                    'Store - 3 Letter Code': item.storeCode || item.storeTLC || item.storeId || item.store || '', //didnt remember what the actual id was.
                                    'Andon Cord': andonCord,
                                    'Item Name': item.itemName,
                                    'Item PLU/UPC': item.wfmScanCode,
                                    'Availability': item.inventoryStatus,
                                    'Current Inventory': item.inventoryStatus === 'Unlimited' ? "0" : (Math.max(0, Math.min(10000, parseInt(item.currentInventoryQuantity) || 0))).toString(),
                                    'Sales Floor Capacity': '',
                                    'Tracking Start Date': '',
                                    'Tracking End Date': ''
                                };
                                console.log(item);
                            });
                        })
                        .catch(error => {
                            console.error(`Error downloading data for store batch:`, error);
                            return [];
                        });
                    };

                    const fetchWithRetry = async (storeIdsBatch, attempt = 1) => {
                        try {
                            await delay(100);
                            return fetchItemsForStores(storeIdsBatch);
                        } catch (error) {
                            if (attempt < retryLimit) {
                                console.warn(`Retrying store batch, attempt ${attempt + 1}`);
                                return fetchWithRetry(storeIdsBatch, attempt + 1);
                            } else {
                                console.error(`Failed after ${retryLimit} attempts`);
                                return [];
                            }
                        }
                    };

                    async function processBatches() {
                        const results = [];
                        for (let i = 0; i < storeIdBatches.length; i++) {
                            loadingIndicator.innerHTML = 'Processing batch ' + (i + 1) + ' of ' + storeIdBatches.length;
                            const res = await fetchWithRetry(storeIdBatches[i]);
                            results.push(res);
                        }
                        return results;
                    }
                    processBatches().then(results => {
                        const allItems = results.flat();
                        console.log('Filtered items data:', allItems);

                        if (allItems.length > 0) {
                            // Specify the correct headers to include
                            const desiredHeaders = [
                                'Store - 3 Letter Code', 'Item Name', 'Item PLU/UPC', 'Availability',
                                'Current Inventory', 'Sales Floor Capacity', 'Andon Cord', 'Tracking Start Date', 'Tracking End Date'
                            ];
                            const csvContent = "data:text/csv;charset=utf-8,"
                                + desiredHeaders.join(",") + "\n"
                                + allItems.map(e => desiredHeaders.map(header => `"${e[header] || ''}"`).join(",")).join("\n");

                            // Create a download link
                            loadingIndicator.innerHTML = 'Downloading...';
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
                .catch(error => console.error('Error downloading data:', error))
                .finally(function() {
                    generateButton.innerHTML = originalButtonText;
                    generateButton.style.cursor = 'pointer';
                    generateButton.disabled = false;
                });
            });
        });
    }

    // Use MutationObserver to detect changes in the DOM
    const observer = new MutationObserver(addActivateButton);
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial attempt to add the activate/deactivate item(s) button
    addActivateButton();

    // Expose the function to the global scope for testing
    try {
        module.exports = {
            addActivateButton
        };
    } catch (e) {
        // Handle the error if needed
    }
})();
