(function() {
    'use strict';

    // Function to add the download data button
    function addDownloadButton() {
        console.log('Attempting to add download data button');
        
        // Check if the button already exists
        if (document.getElementById('downloadDataButton')) {
            console.log('Download data button already exists');
            return;
        }

        // Create the download data button
        var downloadButton = document.createElement('button');
        downloadButton.id = 'downloadDataButton';
        downloadButton.innerHTML = 'Download Data';
        downloadButton.style.position = 'fixed';
        downloadButton.style.bottom = '0';
        downloadButton.style.left = '0';
        downloadButton.style.width = '20%';
        downloadButton.style.height = '40px';
        downloadButton.style.zIndex = '1000';
        downloadButton.style.fontSize = '14px';
        downloadButton.style.backgroundColor = '#004E36';
        downloadButton.style.color = '#fff';
        downloadButton.style.border = 'none';
        downloadButton.style.borderRadius = '0';
        downloadButton.style.cursor = 'pointer';

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

            formContainer.innerHTML = `
                <h3>Download Data Options</h3>
                <label>PLU(s)</label>
                <input type="text" id="pluInput" style="width: 100%; margin-bottom: 10px;" placeholder="Enter PLU(s) separated by commas">
                <label>By</label>
                <select id="bySelect" style="width: 100%; margin-bottom: 10px;">
                    <option value="Store">Store</option>
                    <option value="Region">Region</option>
                </select>
                <label>Store/Region</label>
                <input type="text" id="storeRegionInput" style="width: 100%; margin-bottom: 10px;" placeholder="Enter Store/Region codes separated by commas">
                <label><input type="checkbox" id="allStoresCheckbox"> All Stores/Regions</label><br>
                <button id="executeDownloadButton" style="width: 100%; margin-top:10px;">Download</button>
                <button id="cancelDownloadButton" style="width: 100%; margin-top:10px; background-color: #FF0000;">Cancel</button>
                <div id="downloadProgress" style="display:none; margin-top:10px; text-align:center; font-size:16px; color:#004E36;">Progress: 0%</div>
            `;

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

                // Get user input values
                const pluInput = Array.from(new Set(document.getElementById('pluInput').value.split(',').map(plu => plu.trim()))).filter(Boolean);
                const bySelect = document.getElementById('bySelect').value;
                const storeRegionInput = Array.from(new Set(document.getElementById('storeRegionInput').value.split(',').map(sr => sr.trim()))).filter(Boolean);
                
                // Determine the environment (prod or gamma)
                const environment = window.location.hostname.includes('gamma') ? 'gamma' : 'prod';
                const apiUrlBase = `https://${environment}.cam.wfm.amazon.dev/api/`;
                
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
                    
                    // Build storeIds array based on user selections
                    const storeIds = [];
                    for(const region in storeData.storesInformation) {
                        const states = storeData.storesInformation[region];
                        for(const state in states) {
                            const stores = states[state];
                            stores.forEach(store => {
                                if(document.getElementById('allStoresCheckbox').checked) {
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
                            console.log(`Data for store batch:`, data);
                            return data.itemsAvailability;
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
                            // Generate CSV content from available items
                            const desiredHeaders = Object.keys(allItems[0]);
                            const csvContent = "data:text/csv;charset=utf-8," + desiredHeaders.join(",") + "\n" 
                                + allItems.map(e => desiredHeaders.map(header => `"${e[header] || ''}"`).join(",")).join("\n");
                            // Create and trigger download link
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", "custom_items_data.csv");
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            progress.innerHTML = 'Download Complete!';
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

    // Use MutationObserver to detect changes in the DOM
    const observer = new MutationObserver(addDownloadButton);
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial attempt to add the download data button
    addDownloadButton();
})();
