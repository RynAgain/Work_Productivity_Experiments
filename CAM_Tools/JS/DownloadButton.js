(function() {
    'use strict';

    // Expose the function to the global scope for testing
    try {
        module.exports = {
            addDownloadButton
        };
    } catch (e) {
        // Handle the error if needed
    }

    function addDownloadButton() {
        console.log('Attempting to add download data button');

        // Check if the button already exists
        if (document.getElementById('downloadDataButton')) {
            console.log('Download data button already exists');
            return;
        }

        // Create the download data button using shared button styling
        var downloadButton = document.createElement('button');
        downloadButton.id = 'downloadDataButton';
        downloadButton.innerHTML = 'Download Data';
        downloadButton.className = 'button'; // Use common button class for consistent styling

        // Set positioning to align with other UI elements (e.g., AddItemButton)
        downloadButton.style.position = 'fixed';
        downloadButton.style.bottom = '0';
        downloadButton.style.left = '0';
        downloadButton.style.width = '20%';
        downloadButton.style.height = '40px';
        downloadButton.style.zIndex = '1000';

        document.body.appendChild(downloadButton);
        console.log('Download data button added to the page');

        // Add click event to the download data button to show options overlay
        downloadButton.addEventListener('click', function() {
            console.log('Download Data button clicked');

            // Create overlay for download options
            var overlay = document.createElement('div');
            overlay.id = 'downloadOverlay';
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

            // Create form container for options
            var formContainer = document.createElement('div');
            formContainer.style.position = 'relative';
            formContainer.style.backgroundColor = '#fff';
            formContainer.style.padding = '20px';
            formContainer.style.borderRadius = '5px';
            formContainer.style.width = '300px';

            // Create close button styled similarly to AddItemButton's close button
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
    console.log('Close button clicked');
                document.body.removeChild(overlay);
            });
            formContainer.appendChild(closeButton);

            // New UI with improved layout:
            // Options first, then Download button, progress indicator, then Cancel button.
            formContainer.insertAdjacentHTML('beforeend', `
                <h3>Download Data Options</h3>
                <label><input type="checkbox" id="everythingCheckbox"> Everything</label><br>
                <label>Specific PLUs</label>
                <input type="text" id="pluInput" style="width: 100%; margin-bottom: 10px;" placeholder="Enter specific PLUs separated by commas"><br>
                <label><input type="checkbox" id="allPlusCheckbox"> All PLUs</label><br>
                <label>By</label>
                <select id="bySelect" style="width: 100%; margin-bottom: 10px;">
                    <option value="Store">Store</option>
                    <option value="Region">Region</option>
                </select>
                <label>Store/Region</label>
                <input type="text" id="storeRegionInput" style="width: 100%; margin-bottom: 10px;" placeholder="Enter Store/Region codes separated by commas">
                <label><input type="checkbox" id="allStoresCheckbox"> All Stores/Regions</label><br>
                <button id="executeDownloadButton" class="button" style="width: 100%; margin-top:10px;">Download</button>
                <div id="downloadProgress" style="display:none; margin-top:10px; text-align:center; font-size:16px; color:#004E36;">Wait for Parameters</div>
                <button id="cancelDownloadButton" class="button" style="width: 100%; margin-top:10px; background-color: #FF0000;">Cancel</button>
            `);

            // "Everything" checkbox disables all other options if checked
            formContainer.querySelector('#everythingCheckbox').addEventListener('change', function() {
                var allPlus = document.getElementById('allPlusCheckbox');
                var bySelect = document.getElementById('bySelect');
                var storeRegionInput = document.getElementById('storeRegionInput');
                var allStores = document.getElementById('allStoresCheckbox');
                if(this.checked) {
                    allPlus.disabled = true;
                    bySelect.disabled = true;
                    storeRegionInput.disabled = true;
                    allStores.disabled = true;
                } else {
                    allPlus.disabled = false;
                    bySelect.disabled = false;
                    storeRegionInput.disabled = false;
                    allStores.disabled = false;
                }
            });

            // If "All Stores/Regions" is checked, disable storeRegionInput
            formContainer.querySelector('#allStoresCheckbox').addEventListener('change', function() {
                var storeRegionInput = document.getElementById('storeRegionInput');
                storeRegionInput.disabled = this.checked;
                if(this.checked) {
                    storeRegionInput.value = '';
                }
            });

            // Cancel download: remove overlay
            formContainer.querySelector('#cancelDownloadButton').addEventListener('click', function() {
                document.body.removeChild(overlay);
            });

            overlay.appendChild(formContainer);
            document.body.appendChild(overlay);

            // Execute download button event
            formContainer.querySelector('#executeDownloadButton').addEventListener('click', function() {
                var progress = document.getElementById('downloadProgress');
                progress.style.display = 'block';
                progress.innerHTML = 'Wait for Parameters';

                // Check if "Everything" is checked; if so, ignore all other filters
                var everythingChecked = document.getElementById('everythingCheckbox').checked;
                var allPlusChecked = document.getElementById('allPlusCheckbox').checked;
                
                // For PLUs, if allPlus or everything is checked, use all PLUs (empty array means no filtering)
                const pluInput = allPlusChecked || everythingChecked ? [] : Array.from(new Set(document.getElementById('pluInput').value.split(',').map(plu => plu.trim()))).filter(Boolean);
                const bySelect = document.getElementById('bySelect').value;
                const storeRegionInput = Array.from(new Set(document.getElementById('storeRegionInput').value.split(',').map(sr => sr.trim()))).filter(Boolean);
                
                // Determine the environment (prod or gamma)
                const environment = window.location.hostname.includes('gamma') ? 'gamma' : 'prod';
                const apiUrlBase = `https://${environment}.cam.wfm.amazon.dev/api/`;

                // Update progress: processing parameters
                progress.innerHTML = 'Processing...';

                // Define the API endpoint and headers for getting stores
                const headersStores = {
                    'accept': '*/*',
                    'accept-encoding': 'gzip, deflate, br',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/x-amz-json-1.0',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    'x-amz-target': 'WfmCamBackendService.GetStoresInformation'
                };

                // Call the API to get stores information
                fetch(apiUrlBase, {
                    method: 'POST',
                    headers: headersStores,
                    body: JSON.stringify({}),
                    credentials: 'include'
                })
                .then(response => response.json())
                .then(storeData => {
                    console.log('Store data received:', storeData);
                    if(!storeData || !storeData.storesInformation) {
                        throw new Error('Invalid store data received');
                    }
                    
                    // Build storeIds array based on user selections.
                    const storeIds = [];
                    for(const region in storeData.storesInformation) {
                        const states = storeData.storesInformation[region];
                        for(const state in states) {
                            const stores = states[state];
                            stores.forEach(store => {
                                if(document.getElementById('allStoresCheckbox').checked || everythingChecked) {
                                    storeIds.push(store.storeTLC);
                                } else {
                                    const regionCode = region.split('-').pop();
                                    if((bySelect === 'Store' && storeRegionInput.includes(store.storeTLC)) ||
                                       (bySelect === 'Region' && storeRegionInput.includes(regionCode))) {
                                        storeIds.push(store.storeTLC);
                                    }
                                }
                            });
                        }
                    }

                    // Update progress: Downloading
                    progress.innerHTML = 'Downloading';

                    const batchSize = 10;
                    const storeIdBatches = [];
                    for(let i = 0; i < storeIds.length; i += batchSize) {
                        storeIdBatches.push(storeIds.slice(i, i + batchSize));
                    }
                    let completed = 0;
                    const total = storeIds.length;
                    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
                    const headersItems = {
                        'accept': '*/*',
                        'accept-encoding': 'gzip, deflate, br',
                        'accept-language': 'en-US,en;q=0.9',
                        'content-type': 'application/x-amz-json-1.0',
                        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                        'x-amz-target': 'WfmCamBackendService.GetItemsAvailability'
                    };
                    
                    const fetchItemsForStores = (storeIdsBatch) => {
                        const payloadItems = {
                            "filterContext": {
                                "storeIds": storeIdsBatch
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
                            credentials: 'include'
                        })
                        .then(response => response.json())
    .then(data => {
        console.log('Data for store batch:', data);
        let items = data.itemsAvailability;
        // Filter items by PLU if user provided specific PLUs in the text field (pluInput)
        if (pluInput.length > 0) {
            items = items.filter(item => pluInput.includes(item.wfmScanCode));
        }
        return items.map(item => {
            item.andon = item.andon === true ? 'Enabled' : 'Disabled';
            if (item.inventoryStatus === 'Unlimited') {
                item.currentInventoryQuantity = 0;
            } else if (item.inventoryStatus === 'Limited') {
                const currQty = Number(item.currentInventoryQuantity);
                item.currentInventoryQuantity = isNaN(currQty) ? 0 : Math.max(0, Math.min(10000, currQty));
            }
            item.reservedQuantity = (item.reservedQuantity !== undefined && item.reservedQuantity !== '') ? Number(item.reservedQuantity) : 0;
            item.hasAndonEnabledComponent = item.hasAndonEnabledComponent || 'FALSE';
            item.isMultiChannel = item.isMultiChannel || 'FALSE';
            item.salesFloorCapacity = (item.salesFloorCapacity !== undefined && item.salesFloorCapacity !== '') ? Number(item.salesFloorCapacity) : 0;
            item.wfmoaReservedQuantity = (item.wfmoaReservedQuantity !== undefined && item.wfmoaReservedQuantity !== '') ? Number(item.wfmoaReservedQuantity) : 0;
            return item;
        });
    })
                        .catch(error => {
                            console.error('Error fetching items for batch:', error);
                            return [];
                        });
                    };

                    const retryLimit = 10;
                    const fetchWithRetry = async (storeIdsBatch, attempt = 1) => {
                        try {
                            await delay(100);
                            return fetchItemsForStores(storeIdsBatch);
                        } catch (error) {
                            if(attempt < retryLimit) {
                                console.warn(`Retrying batch, attempt ${attempt+1}`);
                                return fetchWithRetry(storeIdsBatch, attempt + 1);
                            } else {
                                console.error('Failed batch after retries');
                                return [];
                            }
                        }
                    };

                    Promise.all(storeIdBatches.map(batch => {
                        return fetchWithRetry(batch).then(result => {
                            completed += batch.length;
                            const percent = Math.round((completed / total) * 100);
                            progress.innerHTML = `Compiling Data: ${completed}/${total} stores (${percent}%)`;
                            return result;
                        });
                    }))
                    .then(results => {
                        const allItems = results.flat();
                        console.log('All items data:', allItems);
                        if(allItems.length > 0) {
                            const desiredHeaders = Object.keys(allItems[0]);
                            const csvContent = "data:text/csv;charset=utf-8," + desiredHeaders.join(",") + "\n" + allItems.map(e => desiredHeaders.map(header => "\"" + (e[header] || "") + "\"").join(",")).join("\n");
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", "Cam_Item_Data.csv");
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            progress.innerHTML = 'Done';
                        } else {
                            progress.innerHTML = 'No data available.';
                        }
                    })
                    .catch(error => {
                        console.error('Error during download process:', error);
                        progress.innerHTML = 'An error occurred.';
                    });
                })
                .catch(error => {
                    console.error('Error fetching stores:', error);
                    progress.innerHTML = 'Error fetching store data.';
                });
            });
        });
    }

    // Use MutationObserver to detect changes and add the download button when needed
    const observer = new MutationObserver(addDownloadButton);
    observer.observe(document.body, { childList: true, subtree: true });

    //expose
    try {
        module.exports = {
            addDownloadButton
        };
    } catch (e) {
        // Handle the error if needed
    }
    // Initial attempt to add the download data button
    addDownloadButton();
})();
