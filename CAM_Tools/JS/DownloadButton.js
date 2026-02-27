(function() {
    'use strict';

    function addDownloadButton() {
        console.log('[Download] Attempting to add download data button');

        // Check if the button already exists
        if (document.getElementById('downloadDataButton')) {
            console.log('Download data button already exists');
            return;
        }

        // Create the download data button
        const downloadButton = document.createElement('button');
        downloadButton.id = 'downloadDataButton';
        downloadButton.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download Data`;
        downloadButton.className = 'button';

        downloadButton.style.position = 'fixed';
        downloadButton.style.bottom = '0';
        downloadButton.style.left = '0';
        downloadButton.style.width = '20%';
        downloadButton.style.height = '40px';
        downloadButton.style.zIndex = '1000';

        document.body.appendChild(downloadButton);
        console.log('[Download] Button added to the page');

        // Add click event to the download data button to show options overlay
        downloadButton.addEventListener('click', function() {
            console.log('[Download] Button clicked');

            // Create overlay (dark)
            const overlay = document.createElement('div');
            overlay.id = 'downloadOverlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100vw';
            overlay.style.height = '100vh';
            overlay.style.background = 'rgba(0, 0, 0, 0.6)';
            overlay.style.zIndex = '9995';
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';

            // Card container (dark)
            const formContainer = document.createElement('div');
            formContainer.style.position = 'relative';
            formContainer.style.background = '#1a1a1a';
            formContainer.style.padding = '0';
            formContainer.style.borderRadius = '12px';
            formContainer.style.width = '400px';
            formContainer.style.maxWidth = '95vw';
            formContainer.style.maxHeight = '90vh';
            formContainer.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)';
            formContainer.style.border = '1px solid #303030';
            formContainer.style.fontFamily = "'Roboto', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif";
            formContainer.style.overflow = 'hidden';
            formContainer.style.color = '#f1f1f1';

            // Header bar (dark)
            const headerBar = document.createElement('div');
            headerBar.style.background = '#242424';
            headerBar.style.color = '#f1f1f1';
            headerBar.style.padding = '12px 16px';
            headerBar.style.fontSize = '16px';
            headerBar.style.fontWeight = '600';
            headerBar.style.display = 'flex';
            headerBar.style.alignItems = 'center';
            headerBar.style.justifyContent = 'space-between';
            headerBar.style.borderBottom = '1px solid #303030';

            headerBar.innerHTML = `
                <span style="display:flex;align-items:center;gap:8px;">
                    Download Data
                    <span id="overlayInfoIcon" tabindex="0" aria-label="Show information" style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#3f3f3f;color:#f1f1f1;cursor:pointer;outline:none;transition:background 150ms ease;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                        </svg>
                    </span>
                </span>
            `;

            // Close button
            const closeButton = document.createElement('span');
            closeButton.innerHTML = '&times;';
            closeButton.id = 'downloadOverlayCloseButton';
            closeButton.style.fontSize = '22px';
            closeButton.style.cursor = 'pointer';
            closeButton.style.marginLeft = '16px';
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
            formContainer.appendChild(headerBar);
// Info/disclaimer box (dark)
const infoBox = document.createElement('div');
infoBox.id = 'downloadOverlayInfoBox';
infoBox.style.display = 'none';
infoBox.style.position = 'absolute';
infoBox.style.top = '54px';
infoBox.style.left = '24px';
infoBox.style.background = '#242424';
infoBox.style.color = '#f1f1f1';
infoBox.style.borderLeft = '4px solid var(--tm-accent-primary, #3ea6ff)';
infoBox.style.padding = '16px 22px 16px 18px';
infoBox.style.borderRadius = '8px';
infoBox.style.fontSize = '14px';
infoBox.style.lineHeight = '1.7';
infoBox.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
infoBox.style.zIndex = '9999';
infoBox.style.border = '1px solid #303030';
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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--tm-accent-primary, #3ea6ff)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:2px;">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <div style="flex:1;">
            <div style="font-weight:600;margin-bottom:2px;color:#f1f1f1;">Download Data</div>
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
        <button id="closeInfoBoxBtn" aria-label="Close information" style="background:transparent;border:none;color:#aaaaaa;font-size:20px;font-weight:bold;cursor:pointer;line-height:1;padding:0 4px;margin-left:8px;border-radius:4px;transition:color 150ms ease;">&times;</button>
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


            // Content area (dark)
            const contentArea = document.createElement('div');
            contentArea.style.padding = '16px';
            contentArea.style.display = 'flex';
            contentArea.style.flexDirection = 'column';
            contentArea.style.gap = '10px';
            contentArea.style.maxHeight = '80vh';
            contentArea.style.overflowY = 'auto';

            const inputStyle = 'width:100%;padding:8px;border:1px solid #3f3f3f;border-radius:4px;font-size:14px;background:#0f0f0f;color:#f1f1f1;font-family:inherit;box-sizing:border-box;';
            const labelStyle = 'color:#aaaaaa;font-size:13px;margin-top:2px;';
            const checkStyle = 'font-weight:500;display:flex;align-items:center;gap:8px;color:#f1f1f1;font-size:13px;';

            contentArea.innerHTML = `
                <label style="${checkStyle}">
                    <input type="checkbox" id="everythingCheckbox" style="accent-color:var(--tm-accent-primary, #3ea6ff);"> Everything, Everywhere
                </label>
                <label style="${labelStyle}">Specific PLUs</label>
                <input type="text" id="pluInput" style="${inputStyle}" placeholder="PLUs, comma-separated">
                <label style="${checkStyle}">
                    <input type="checkbox" id="allPlusCheckbox" style="accent-color:var(--tm-accent-primary, #3ea6ff);"> All PLUs
                </label>
                <label style="${labelStyle}">By</label>
                <select id="bySelect" style="${inputStyle}">
                    <option value="Store">Store</option>
                    <option value="Region">Region</option>
                </select>
                <label style="${labelStyle}">Store/Region</label>
                <input type="text" id="storeRegionInput" style="${inputStyle}" placeholder="Codes, comma-separated">
                <label style="${checkStyle}">
                    <input type="checkbox" id="allStoresCheckbox" style="accent-color:var(--tm-accent-primary, #3ea6ff);"> All Stores/Regions
                </label>
                <button id="executeDownloadButton" style="width:100%;margin-top:12px;background:var(--tm-accent-primary, #3ea6ff);color:#0f0f0f;border:none;border-radius:4px;padding:8px 0;font-size:14px;font-weight:500;cursor:pointer;transition:background 150ms ease;">Download</button>
                <div id="downloadProgress" style="display:none;margin-top:10px;text-align:center;font-size:13px;color:var(--tm-accent-primary, #3ea6ff);">Wait for Parameters</div>
                <button id="cancelDownloadButton" style="width:100%;margin-top:8px;background:transparent;color:#d32f2f;border:1px solid #d32f2f;border-radius:4px;padding:8px 0;font-size:14px;font-weight:500;cursor:pointer;transition:all 150ms ease;">Cancel</button>
            `;
            formContainer.appendChild(contentArea);

            // "Everything" checkbox disables all other options if checked
            formContainer.querySelector('#everythingCheckbox').addEventListener('change', function() {
                const allPlus = document.getElementById('allPlusCheckbox');
                const bySelect = document.getElementById('bySelect');
                const storeRegionInput = document.getElementById('storeRegionInput');
                const allStores = document.getElementById('allStoresCheckbox');
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
                const storeRegionInput = document.getElementById('storeRegionInput');
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
                const progress = document.getElementById('downloadProgress');
                progress.style.display = 'block';
                progress.innerHTML = 'Wait for Parameters';

                const everythingChecked = document.getElementById('everythingCheckbox').checked;
                const allPlusChecked = document.getElementById('allPlusCheckbox').checked;
                
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

                    const batchSize = 5;
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
                                "pageSize": 9999
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
                            
                            // Build CSV content efficiently without stack overflow
                            const csvRows = [desiredHeaders.join(",")];
                            
                            // Process items in chunks to avoid stack overflow
                            for (let i = 0; i < allItems.length; i++) {
                                const row = desiredHeaders.map(header => "\"" + (allItems[i][header] || "") + "\"").join(",");
                                csvRows.push(row);
                            }
                            
                            const csvContent = csvRows.join("\n");
                            
                            // Use Blob instead of data URI to handle large files
                            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.setAttribute("href", url);
                            link.setAttribute("download", "Cam_Item_Data.csv");
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            
                            // Clean up the blob URL
                            URL.revokeObjectURL(url);
                            
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

    // Initial attempt to add the download data button
    addDownloadButton();

    // Module export for testing (at end of IIFE)
    try {
        module.exports = { addDownloadButton };
    } catch (e) {
        // Browser environment
    }
})();
