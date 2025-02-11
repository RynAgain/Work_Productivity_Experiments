(function() {
    'use strict';

    // Helper function to create and style an element
    const createElementWithStyles = (tag, styles = {}) => {
        const el = document.createElement(tag);
        Object.assign(el.style, styles);
        return el;
    };

    // Helper to create a button with id, innerHTML and styles
    const createButton = (id, innerHTML, styles = {}) => {
        const btn = createElementWithStyles('button', styles);
        btn.id = id;
        btn.innerHTML = innerHTML;
        return btn;
    };

    // Function to add the activate/deactivate item(s) button
    const addActivateButton = () => {
        console.log('Attempting to add activate/deactivate item(s) button');

        // Check if the button already exists
        if (document.getElementById('activateButton')) {
            console.log('Activate/Deactivate item(s) button already exists');
            return;
        }

        const buttonStyles = {
            position: 'fixed',
            bottom: '0',
            left: '40%',
            width: '20%',
            height: '40px',
            zIndex: '1000',
            fontSize: '14px',
            backgroundColor: '#004E36',
            color: '#fff',
            border: 'none',
            borderRadius: '5px'
        };

        const activateButton = createButton('activateButton', 'Activate/Deactivate Item(s)', buttonStyles);
        activateButton.style.setProperty('cursor', 'pointer', 'important');
        document.body.appendChild(activateButton);

        activateButton.addEventListener('mouseover', () => {
            activateButton.style.backgroundColor = '#218838';
        });
        activateButton.addEventListener('mouseout', () => {
            activateButton.style.backgroundColor = '#004E36';
        });

        console.log('Activate/Deactivate item(s) button added to the page');

        // Add click event to the activate/deactivate item(s) button
        activateButton.addEventListener('click', () => {
            console.log('Activate/Deactivate Item(s) button clicked');
            
            // Create overlay similar to other buttons
            const overlay = createElementWithStyles('div', {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: '1001',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            });
            overlay.id = 'activateOverlay';

            const closeButton = createElementWithStyles('span', {
                position: 'absolute',
                top: '10px',
                right: '10px',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#fff',
                backgroundColor: '#000',
                padding: '5px',
                borderRadius: '0'
            });
            closeButton.innerHTML = '&times;';
            closeButton.addEventListener('click', () => {
                document.body.removeChild(overlay);
            });

            const formContainer = createElementWithStyles('div', {
                position: 'relative',
                backgroundColor: '#fff',
                padding: '20px',
                borderRadius: '5px',
                width: '300px'
            });

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
                <label><input type="checkbox" id="allStoresCheckbox"> All Stores</label><br>
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

            // Close overlay when clicking outside the form
            overlay.addEventListener('click', (event) => {
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
                const originalButtonText = generateButton.innerHTML;
                
                // Logic to generate the upload file
                const pluInput = Array.from(new Set(document.getElementById('pluInput').value.split(',').map(plu => plu.trim())));
                const bySelect = document.getElementById('bySelect').value;
                const storeRegionInput = Array.from(new Set(document.getElementById('storeRegionInput').value.split(',').map(sr => sr.trim())));
                const andonCord = document.getElementById('andonCordSelect').value;
                const loadingIndicator = createElementWithStyles('div', {
                    textAlign: 'center',
                    marginTop: '10px',
                    fontSize: '16px',
                    color: '#004E36'
                });
                loadingIndicator.id = 'loadingIndicator';
                loadingIndicator.innerHTML = 'Processing...';
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
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
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
                            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
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
    };

    // Use MutationObserver to detect changes in the DOM
    const observer = new MutationObserver(addActivateButton);
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial attempt to add the activate/deactivate item(s) button
    addActivateButton();
})();
