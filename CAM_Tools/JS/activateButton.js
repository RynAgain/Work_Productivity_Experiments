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
        console.log('[Activate] Attempting to add button');

        // Check if the button already exists
        if (document.getElementById('activateButton')) {
            console.log('[Activate] Button already exists');
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
        activateButton.style.backgroundColor = '#1a1a1a';
        activateButton.style.color = '#f1f1f1';
        activateButton.style.border = '1px solid #303030';
        activateButton.style.borderRadius = '4px';
        activateButton.style.cursor = 'pointer';
        activateButton.style.transition = 'background 150ms ease';
        activateButton.style.fontFamily = "'Roboto', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif";

        document.body.appendChild(activateButton);
        activateButton.addEventListener('mouseover', function() {
            activateButton.style.backgroundColor = '#242424';
        });
        activateButton.addEventListener('mouseout', function() {
            activateButton.style.backgroundColor = '#1a1a1a';
        });
        console.log('[Activate] Button added');

        // Add click event to the activate/deactivate item(s) button
        activateButton.addEventListener('click', function() {
            console.log('[Activate] Button clicked');
            
            // Create overlay
            const overlay = document.createElement('div');
            overlay.id = 'activateOverlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100vw';
            overlay.style.height = '100vh';
            overlay.style.background = 'rgba(0,0,0,0.6)';
            overlay.style.zIndex = '9995';
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';

            // Card container
            const formContainer = document.createElement('div');
            formContainer.style.position = 'relative';
            formContainer.style.background = '#1a1a1a';
            formContainer.style.padding = '0';
            formContainer.style.borderRadius = '12px';
            formContainer.style.width = '300px';
            formContainer.style.maxWidth = '95vw';
            formContainer.style.maxHeight = '90vh';
            formContainer.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)';
            formContainer.style.border = '1px solid #303030';
            formContainer.style.fontFamily = "'Roboto', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif";
            formContainer.style.overflow = 'hidden';
            formContainer.style.color = '#f1f1f1';

            // Header bar
            const headerBar = document.createElement('div');
            headerBar.style.background = '#242424';
            headerBar.style.color = '#f1f1f1';
            headerBar.style.padding = '12px 16px';
            headerBar.style.fontSize = '16px';
            headerBar.style.fontWeight = '600';
            headerBar.style.letterSpacing = '0.3px';
            headerBar.style.display = 'flex';
            headerBar.style.alignItems = 'center';
            headerBar.style.justifyContent = 'space-between';
            headerBar.style.borderBottom = '1px solid #303030';
            headerBar.innerHTML = `<span>Activate/Deactivate Item(s)</span>`;

            // Close button
            const closeButton = document.createElement('span');
            closeButton.innerHTML = '&times;';
            closeButton.id = 'activateOverlayCloseButton';
            closeButton.style.fontSize = '22px';
            closeButton.style.cursor = 'pointer';
            closeButton.style.marginLeft = '8px';
            closeButton.style.color = '#aaaaaa';
            closeButton.style.background = 'transparent';
            closeButton.style.border = 'none';
            closeButton.style.padding = '0 4px';
            closeButton.style.borderRadius = '4px';
            closeButton.style.transition = 'color 150ms ease';
            closeButton.addEventListener('mouseenter', function() {
                closeButton.style.color = '#f1f1f1';
            });
            closeButton.addEventListener('mouseleave', function() {
                closeButton.style.color = '#aaaaaa';
            });
            closeButton.addEventListener('click', function() {
                document.body.removeChild(overlay);
            });
            headerBar.appendChild(closeButton);
// Info/disclaimer box (hidden by default, shown when info icon is clicked)
const infoBox = document.createElement('div');
infoBox.id = 'activateOverlayInfoBox';
infoBox.style.display = 'none';
infoBox.style.position = 'absolute';
infoBox.style.top = '48px';
infoBox.style.left = '16px';
infoBox.style.background = '#242424';
infoBox.style.color = '#f1f1f1';
infoBox.style.borderLeft = '4px solid var(--tm-accent-primary, #3ea6ff)';
infoBox.style.padding = '14px 18px 14px 16px';
infoBox.style.borderRadius = '8px';
infoBox.style.fontSize = '14px';
infoBox.style.lineHeight = '1.7';
infoBox.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
infoBox.style.zIndex = '9999';
infoBox.style.border = '1px solid #303030';
infoBox.style.minWidth = '240px';
infoBox.style.maxWidth = '340px';
infoBox.style.maxHeight = '60vh';
infoBox.style.overflowY = 'auto';
infoBox.style.transition = 'opacity 0.2s';
infoBox.setAttribute('role', 'dialog');
infoBox.setAttribute('aria-modal', 'false');
infoBox.tabIndex = -1;
infoBox.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:12px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--tm-accent-primary, #3ea6ff)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:2px;">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <div style="flex:1;">
            <div style="font-weight:600;margin-bottom:2px;color:#f1f1f1;">Activate/Deactivate Item(s)</div>
            Use this tool to generate upload files for activating or deactivating items in selected stores.<br>
            <div style="margin:7px 0 0 0;font-weight:600;">How to use:</div>
            <ol style="margin:7px 0 0 18px;padding:0 0 0 0;">
                <li>Enter one or more PLU codes (comma-separated) to select items.</li>
                <li>Choose whether to filter by Store or Region, then enter the relevant codes.</li>
                <li>Check "All Stores" to include all stores (overrides the Store/Region field).</li>
                <li>Select the desired Andon Cord state (Enabled/Disabled).</li>
                <li>Click <b>Generate Upload File</b> to fetch and compile the data. Progress will be shown.</li>
                <li>When complete, a CSV file will be downloaded to your computer.</li>
            </ol>
            <div style="margin:7px 0 0 0;font-weight:600;">Tips:</div>
            <ul style="margin:4px 0 0 18px;padding:0 0 0 0;">
                <li>Use filters to limit the data for faster downloads.</li>
                <li>If you encounter issues, try reducing the number of stores or PLUs selected.</li>
            </ul>
        </div>
        <button id="closeActivateInfoBoxBtn" aria-label="Close information" style="background:transparent;border:none;color:#aaaaaa;font-size:20px;font-weight:bold;cursor:pointer;line-height:1;padding:0 4px;margin-left:8px;border-radius:4px;transition:color 150ms ease;">&times;</button>
    </div>
`;
formContainer.style.position = 'relative';
formContainer.appendChild(infoBox);

// Add info icon to headerBar
const infoIcon = document.createElement('span');
infoIcon.id = 'activateOverlayInfoIcon';
infoIcon.tabIndex = 0;
infoIcon.setAttribute('aria-label', 'Show information');
infoIcon.style.display = 'inline-flex';
infoIcon.style.alignItems = 'center';
infoIcon.style.justifyContent = 'center';
infoIcon.style.width = '20px';
infoIcon.style.height = '20px';
infoIcon.style.borderRadius = '50%';
infoIcon.style.background = '#3f3f3f';
infoIcon.style.color = '#f1f1f1';
infoIcon.style.fontWeight = 'bold';
infoIcon.style.fontSize = '15px';
infoIcon.style.cursor = 'pointer';
infoIcon.style.marginLeft = '8px';
infoIcon.style.transition = 'background 0.2s';
infoIcon.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
`;
headerBar.querySelector('span').appendChild(infoIcon);

// Info icon click logic
setTimeout(function() {
    var infoIcon = document.getElementById('activateOverlayInfoIcon');
    var infoBox = document.getElementById('activateOverlayInfoBox');
    if (infoIcon && infoBox) {
        function showInfoBox() {
            infoBox.style.display = 'block';
            // Clamp position to viewport
            setTimeout(function() {
                var rect = infoBox.getBoundingClientRect();
                var pad = 8;
                var vpW = window.innerWidth, vpH = window.innerHeight;
                // Clamp left/right
                if (rect.right > vpW - pad) {
                    infoBox.style.left = Math.max(16, vpW - rect.width - pad) + 'px';
                }
                if (rect.left < pad) {
                    infoBox.style.left = pad + 'px';
                }
                // Clamp top/bottom
                if (rect.bottom > vpH - pad) {
                    var newTop = Math.max(8, vpH - rect.height - pad);
                    infoBox.style.top = newTop + 'px';
                }
                if (rect.top < pad) {
                    infoBox.style.top = pad + 'px';
                }
            }, 0);
            infoBox.focus();
        }
        function hideInfoBox() {
            infoBox.style.display = 'none';
            infoIcon.focus();
        }
        infoIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            showInfoBox();
        });
        infoIcon.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                showInfoBox();
            }
        });
        // Close button inside infoBox
        var closeBtn = document.getElementById('closeActivateInfoBoxBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                hideInfoBox();
            });
        }
        // Dismiss infoBox on Escape key
        infoBox.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                hideInfoBox();
            }
        });
        // Optional: clicking outside infoBox closes it
        document.addEventListener('mousedown', function handler(e) {
            if (infoBox.style.display === 'block' && !infoBox.contains(e.target) && !infoIcon.contains(e.target)) {
                hideInfoBox();
            }
        });
    }
}, 0);
            formContainer.appendChild(headerBar);

            // Content area
            const contentArea = document.createElement('div');
            contentArea.style.padding = '16px';
            contentArea.style.display = 'flex';
            contentArea.style.flexDirection = 'column';
            contentArea.style.gap = '6px';
            contentArea.style.maxHeight = '80vh';
            contentArea.style.overflowY = 'auto';

            // Main content HTML
            const iStyle = 'width:100%;padding:8px;border:1px solid #3f3f3f;border-radius:4px;font-size:14px;background:#0f0f0f;color:#f1f1f1;font-family:inherit;box-sizing:border-box;';
            const lStyle = 'margin-bottom:2px;color:#aaaaaa;font-size:13px;';
            contentArea.innerHTML = `
                <label style="${lStyle}">PLU(s)</label>
                <input type="text" id="pluInput" style="${iStyle}" placeholder="PLUs, comma-separated">
                <label style="${lStyle}">By</label>
                <select id="bySelect" style="${iStyle}">
                    <option value="Store">Store</option>
                    <option value="Region">Region</option>
                </select>
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="flex:1;">
                        <label style="${lStyle}display:block;">Store/Region</label>
                        <input type="text" id="storeRegionInput" style="${iStyle}" placeholder="Codes, comma-separated">
                    </div>
                    <label style="font-weight:500;display:flex;align-items:center;gap:4px;margin-top:18px;color:#aaaaaa;font-size:13px;">
                        <input type="checkbox" id="allStoresCheckbox" style="margin-right:4px;accent-color:var(--tm-accent-primary, #3ea6ff);"> All Stores
                    </label>
                </div>
                <label style="${lStyle}">Andon Cord</label>
                <select id="andonCordSelect" style="${iStyle}">
                    <option value="Enabled">Enabled</option>
                    <option value="Disabled">Disabled</option>
                </select>
                <button id="generateUploadFileButton" style="width:100%;margin-top:10px;background:var(--tm-accent-primary, #3ea6ff);color:#0f0f0f;border:none;border-radius:4px;padding:8px 0;font-size:14px;font-weight:500;cursor:pointer;transition:background 150ms ease;">Generate Upload File</button>
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
                loadingIndicator.style.fontSize = '14px';
                loadingIndicator.style.color = 'var(--tm-accent-primary, #3ea6ff)';
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
