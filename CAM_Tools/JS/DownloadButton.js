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
        downloadButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5-.5h4.5V1.5a.5.5 0 0 1 1 0v7.9h4.5a.5.5 0 0 1 .5.5v.5a.5.5 0 0 1-.5.5H6.5v4.5a.5.5 0 0 1-1 0V10.9H1a.5.5 0 0 1-.5-.5v-.5z"></path><path d="M5.5 10.9V1.5a.5.5 0 0 1 1 0v9.4h4.5a.5.5 0 0 1 .5.5v.5a.5.5 0 0 1-.5.5H6.5v4.5a.5.5 0 0 1-1 0V11.9H1a.5.5 0 0 1-.5-.5v-.5a.5.5 0 0 1 .5-.5h4.5z"></path></svg> Download Data`;
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
            overlay.style.width = '100vw';
            overlay.style.height = '100vh';
            overlay.style.background = 'rgba(0, 0, 0, 0.5)';
            overlay.style.zIndex = '1001';
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';

            // Create form container for options
            var formContainer = document.createElement('div');
            formContainer.style.position = 'relative';
            formContainer.style.background = '#fff';
            formContainer.style.padding = '0';
            formContainer.style.borderRadius = '12px';
            formContainer.style.width = '360px';
            formContainer.style.boxShadow = '0 8px 32px rgba(0,0,0,0.18), 0 1.5px 6px rgba(0,78,54,0.10)';
            formContainer.style.border = '1.5px solid #e0e0e0';
            formContainer.style.fontFamily = 'Segoe UI, Arial, sans-serif';
            formContainer.style.overflow = 'hidden';

            // Header bar
            var headerBar = document.createElement('div');
            headerBar.style.background = '#004E36';
            headerBar.style.color = '#fff';
            headerBar.style.padding = '16px 24px 12px 24px';
            headerBar.style.fontSize = '20px';
            headerBar.style.fontWeight = 'bold';
            headerBar.style.letterSpacing = '0.5px';
            headerBar.style.display = 'flex';
            headerBar.style.alignItems = 'center';
            headerBar.style.justifyContent = 'space-between';

            headerBar.innerHTML = `
                <span style="display:flex;align-items:center;gap:8px;">
                    Download Data Options
                    <span id="overlayInfoIcon" tabindex="0" aria-label="Show information" style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#e0e0e0;color:#004E36;font-weight:bold;font-size:15px;cursor:pointer;outline:none;transition:background 0.2s;">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style="display:block;">
                            <circle cx="10" cy="10" r="10" fill="#e0e0e0"/>
                            <text x="10" y="14" text-anchor="middle" font-size="12" font-family="Segoe UI, Arial, sans-serif" fill="#004E36" font-weight="bold">i</text>
                        </svg>
                    </span>
                </span>
            `;

            // Close button
            var closeButton = document.createElement('span');
            closeButton.innerHTML = '&times;';
            closeButton.id = 'downloadOverlayCloseButton';
            closeButton.style.fontSize = '28px';
            closeButton.style.cursor = 'pointer';
            closeButton.style.marginLeft = '16px';
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
// Info/disclaimer box (hidden by default, shown when info icon is clicked)
var infoBox = document.createElement('div');
infoBox.id = 'downloadOverlayInfoBox';
infoBox.style.display = 'none';
infoBox.style.position = 'absolute';
infoBox.style.top = '54px';
infoBox.style.left = '24px';
infoBox.style.background = '#f5f7fa';
infoBox.style.color = '#222';
infoBox.style.borderLeft = '4px solid #004E36';
infoBox.style.padding = '16px 22px 16px 18px';
infoBox.style.borderRadius = '7px';
infoBox.style.fontSize = '15px';
infoBox.style.lineHeight = '1.7';
infoBox.style.boxShadow = '0 2px 12px rgba(0,0,0,0.10)';
infoBox.style.zIndex = '2002';
infoBox.style.minWidth = '270px';
infoBox.style.maxWidth = '340px';
infoBox.style.maxHeight = '60vh';
infoBox.style.overflowY = 'auto';
infoBox.style.transition = 'opacity 0.2s';
infoBox.setAttribute('role', 'dialog');
infoBox.setAttribute('aria-modal', 'false');
infoBox.tabIndex = -1;
infoBox.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:12px;">
        <svg width="22" height="22" fill="#004E36" viewBox="0 0 20 20" style="flex-shrink:0;margin-top:2px;">
            <circle cx="10" cy="10" r="10" fill="#e0e0e0"/>
            <text x="10" y="15" text-anchor="middle" font-size="13" font-family="Segoe UI, Arial, sans-serif" fill="#004E36" font-weight="bold">i</text>
        </svg>
        <div style="flex:1;">
            <div style="font-weight:600;margin-bottom:2px;">Download Data</div>
            Download item data as a CSV file based on your selected filters.<br>
            <div style="margin:7px 0 0 0;font-weight:600;">How to use:</div>
            <ol style="margin:7px 0 0 18px;padding:0 0 0 0;">
                <li><b>Everything, Everywhere</b>: Select this to download all available data, ignoring other filters.</li>
                <li><b>Specific PLUs</b>: Enter one or more PLU codes (comma-separated) to limit the download to those items.</li>
                <li><b>All PLUs</b>: Check to include all PLUs (overrides the specific PLUs field).</li>
                <li><b>By Store/Region</b>: Choose whether to filter by Store or Region, then enter the relevant codes in the field below.</li>
                <li><b>All Stores/Regions</b>: Check to include all stores/regions (overrides the Store/Region field).</li>
                <li>Click <b>Download</b> to start the process. The system will fetch and compile the data based on your selections. Progress will be shown during the download.</li>
                <li>When complete, a CSV file will be downloaded to your computer.</li>
            </ol>
            <div style="margin:7px 0 0 0;font-weight:600;">Tips:</div>
            <ul style="margin:4px 0 0 18px;padding:0 0 0 0;">
                <li>If you select "Everything, Everywhere", all other options are ignored.</li>
                <li>Use filters to limit the data to only what you need for faster downloads.</li>
                <li>If you encounter issues, try reducing the number of stores or PLUs selected.</li>
            </ul>
            <div style="margin:7px 0 0 0;font-weight:600;">Disclaimer:</div>
            The downloaded file <b>cannot be directly uploaded</b> elsewhere. You must convert or format it as required for uploads.
        </div>
        <button id="closeInfoBoxBtn" aria-label="Close information" style="background:transparent;border:none;color:#004E36;font-size:20px;font-weight:bold;cursor:pointer;line-height:1;padding:0 4px;margin-left:8px;border-radius:4px;transition:background 0.2s;">&times;</button>
    </div>
`;
formContainer.style.position = 'relative';
formContainer.appendChild(infoBox);

// Info icon click logic
setTimeout(function() {
    var infoIcon = document.getElementById('overlayInfoIcon');
    var infoBox = document.getElementById('downloadOverlayInfoBox');
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
                    infoBox.style.left = Math.max(24, vpW - rect.width - pad) + 'px';
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
        var closeBtn = document.getElementById('closeInfoBoxBtn');
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


            // Content area
            var contentArea = document.createElement('div');
            contentArea.style.padding = '20px 24px 18px 24px';
            contentArea.style.display = 'flex';
            contentArea.style.flexDirection = 'column';
            contentArea.style.gap = '10px';

            // Main content HTML
            contentArea.innerHTML = `
                <label style="font-weight:500;display:flex;align-items:center;gap:8px;">
                    <input type="checkbox" id="everythingCheckbox" style="margin-right:8px;"> Everything, Everywhere
                </label>
                <label style="margin-top:2px;">Specific PLUs</label>
                <input type="text" id="pluInput" style="width:100%;margin-bottom:2px;padding:8px 10px;border:1px solid #ccc;border-radius:5px;font-size:15px;" placeholder="Enter specific PLUs separated by commas">
                <label style="font-weight:500;display:flex;align-items:center;gap:8px;">
                    <input type="checkbox" id="allPlusCheckbox" style="margin-right:8px;"> All PLUs
                </label>
                <label style="margin-top:2px;">By</label>
                <select id="bySelect" style="width:100%;margin-bottom:2px;padding:8px 10px;border:1px solid #ccc;border-radius:5px;font-size:15px;">
                    <option value="Store">Store</option>
                    <option value="Region">Region</option>
                </select>
                <label style="margin-top:2px;">Store/Region</label>
                <input type="text" id="storeRegionInput" style="width:100%;margin-bottom:2px;padding:8px 10px;border:1px solid #ccc;border-radius:5px;font-size:15px;" placeholder="Enter Store/Region codes separated by commas">
                <label style="font-weight:500;display:flex;align-items:center;gap:8px;">
                    <input type="checkbox" id="allStoresCheckbox" style="margin-right:8px;"> All Stores/Regions
                </label>
                <button id="executeDownloadButton" class="button" style="width:100%;margin-top:12px;background:#004E36;color:#fff;border:none;border-radius:5px;padding:10px 0;font-size:16px;cursor:pointer;transition:background 0.2s;">Download</button>
                <div id="downloadProgress" style="display:none;margin-top:10px;text-align:center;font-size:16px;color:#004E36;">Wait for Parameters</div>
                <button id="cancelDownloadButton" class="button" style="width:100%;margin-top:10px;background:#e74c3c;color:#fff;border:none;border-radius:5px;padding:10px 0;font-size:16px;cursor:pointer;transition:background 0.2s;">Cancel</button>
            `;
            formContainer.appendChild(contentArea);

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
