(function() {
    'use strict';

    // Expose the function to the global scope for testing
    try {
        module.exports = {
            auditHistoryPull
        };
    } catch (e) {
        // Handle the error if needed
    }

    // Define the auditHistoryPull function
    async function auditHistoryPull() {
      // Password protection (same as AddItemButton.js)
      var pw = prompt('Enter password to access Audit History Pull:');
      if (pw !== 'Leeloo') {
        alert('Incorrect password. Access denied.');
        return;
      }

        console.log('[AuditHistory] Pull initiated');

        const environment = window.location.hostname.includes('gamma') ? 'gamma' : 'prod';
        const apiUrlBase = `https://${environment}.cam.wfm.amazon.dev/api/`;

        const headersStores = {
            'accept': '*/*',
            'accept-encoding': 'gzip, deflate, br',
            'accept-language': 'en-US,en;q=0.9',
            'content-type': 'application/x-amz-json-1.0',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'x-amz-target': 'WfmCamBackendService.GetStoresInformation'
        };

        // Create overlay and status elements
        const overlay = document.createElement('div');
        overlay.id = 'auditHistoryOverlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        overlay.style.zIndex = '9995';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';

        let isCancelled = false;
        const statusContainer = document.createElement('div');
        statusContainer.style.position = 'relative';
        statusContainer.style.backgroundColor = '#1a1a1a';
        statusContainer.style.color = '#f1f1f1';
        statusContainer.style.padding = '0';
        statusContainer.style.borderRadius = '12px';
        statusContainer.style.width = '340px';
        statusContainer.style.maxWidth = '95vw';
        statusContainer.style.border = '1px solid #303030';
        statusContainer.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)';
        statusContainer.style.fontFamily = "'Roboto', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif";
        statusContainer.style.overflow = 'hidden';
        statusContainer.innerHTML = `
            <div style="background:#242424;padding:12px 16px;font-size:16px;font-weight:600;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #303030;">
                <span>Audit History</span>
                <span id="auditHistoryCloseBtn" style="font-size:22px;cursor:pointer;color:#aaaaaa;padding:0 4px;transition:color 150ms ease;">&times;</span>
            </div>
            <div class="tm-form-stack">
                <p id="statusMessage" style="margin:0;font-size:13px;color:var(--tm-accent-primary, #3ea6ff);">Initializing...</p>
                <label class="tm-field-label">By</label>
                <select id="bySelect" class="tm-select">
                    <option value="Store">Store</option>
                    <option value="Region">Region</option>
                </select>
                <select id="storeSelect" class="tm-select"></select>
                <label class="tm-checkbox-label">
                    <input type="checkbox" id="getAsinCheckbox">
                    <span>Get ASIN (extra slow)</span>
                </label>
                <label class="tm-checkbox-label">
                    <input type="checkbox" id="allStoresCheckbox">
                    <span>All Stores</span>
                </label>
                <div style="display:flex;gap:8px;">
                    <button id="nextRequestButton" class="tm-form-action" style="flex:1;">Next Request</button>
                    <button id="cancelButton" class="tm-form-cancel" style="flex:1;margin-top:0;">Cancel</button>
                </div>
            </div>
        `;

        statusContainer.querySelector('#auditHistoryCloseBtn').addEventListener('click', function() {
            document.body.removeChild(overlay);
        });
        overlay.appendChild(statusContainer);
        document.body.appendChild(overlay);

        let compiledData = [];

        const updateStatus = (message) => {
            const statusMessage = document.getElementById('statusMessage');
            if (statusMessage) {
                statusMessage.innerText = message;
            }
        };

        // Now that elements are created, add event listeners
        const cancelButton = document.getElementById('cancelButton');
        if (cancelButton) {
            cancelButton.addEventListener('click', function() {
                isCancelled = true;
                updateStatus('Cancelling...');
            });
        }

        async function fetchASIN(storeId, plu) {
            const apiUrlBase = `https://${environment}.cam.wfm.amazon.dev/api/`;
            const payload = { storeId: storeId, wfmScanCode: plu };
            // Short delay to avoid hammering
            await new Promise(resolve => setTimeout(resolve, 100));

            try {
                const response = await fetch(apiUrlBase, {
                    method: 'POST',
                    headers: {
                        'accept': '*/*',
                        'accept-language': 'en-US,en;q=0.9',
                        'content-type': 'application/x-amz-json-1.0',
                        'x-amz-target': 'WfmCamBackendService.GetItemAvailability',
                        'x-amz-user-agent': 'aws-sdk-js/0.0.1 os/Windows/NT_10.0 lang/js md/browser/Chrome_133.0.0.0',
                        'Referer': `https://${environment}.cam.wfm.amazon.dev/store/${storeId}/item/${plu}`,
                        'Referrer-Policy': 'strict-origin-when-cross-origin'
                    },
                    body: JSON.stringify(payload),
                    credentials: 'include'
                });

                const data = await response.json();
                return data.itemAvailability ? data.itemAvailability.asin : 'error';
            } catch (err) {
                console.error(`Fetch error for PLU "${plu}":`, err);
                return 'error';
            }
        }

        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        async function fetchAuditHistoryWithDelay(item, attempt = 1) {
            const maxAttempts = 5;
            const delayTime = Math.pow(2, attempt) * 100;

            try {
                // Short delay between each item request
                await new Promise(resolve => setTimeout(resolve, 500));

                const headersAudit = {
                    'accept': '*/*',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/x-amz-json-1.0',
                    'x-amz-target': 'WfmCamBackendService.GetAuditHistory',
                    'x-amz-user-agent': 'aws-sdk-js/0.0.1 os/Windows/NT_10.0 lang/js md/browser/Chrome_133.0.0.0',
                    'Referer': `https://${environment}.cam.wfm.amazon.dev/store/${item.storeId}/item/${item.wfmScanCode}`,
                    'Referrer-Policy': 'strict-origin-when-cross-origin'
                };

                const response = await fetch(apiUrlBase, {
                    method: 'POST',
                    headers: headersAudit,
                    body: JSON.stringify({
                        storeId: item.storeId,
                        wfmScanCode: item.wfmScanCode
                    }),
                    credentials: 'include'
                });

                // Handle 429 rate limiting
                if (response.status === 429 && attempt < maxAttempts) {
                    console.warn(`Rate limited, retrying in ${delayTime / 1000} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, delayTime));
                    return fetchAuditHistoryWithDelay(item, attempt + 1);
                }

                const auditData = await response.json();
                console.log('Audit Data Response:', auditData);
                console.log('Compiled Data Before Push:', compiledData);

                // Determine the most recent "Andon Cord enabled" event
                const andonEnabledEvent = auditData.auditHistory
                    .filter(entry => entry.updateReason === "Andon Cord enabled")
                    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];

                const timeSinceAndonEnabled = andonEnabledEvent
                    ? `${Math.floor((new Date() - new Date(andonEnabledEvent.updatedAt)) / (1000 * 60 * 60 * 24))} days ago`
                    : `${Math.floor((new Date() - new Date(auditData.auditHistory[0].updatedAt)) / (1000 * 60 * 60 * 24))} days ago (since earliest entry)`;

                for (const entry of auditData.auditHistory) {
                    let asin = 'Not Requested';
                    if (document.getElementById('getAsinCheckbox').checked) {
                        asin = await fetchASIN(item.storeId, item.wfmScanCode);
                    }
                    const uniqueKey = `${item.storeId}-${item.wfmScanCode}`;
                    compiledData.push({
                        uniqueKey: uniqueKey,
                        storeId: item.storeId,
                        wfmScanCode: item.wfmScanCode,
                        newValue: entry.newValue,
                        previousValue: entry.previousValue || 'N/A',
                        updateReason: entry.updateReason,
                        updatedAt: entry.updatedAt,
                        updatedBy: entry.updatedBy,
                        timeSinceAndonEnabled: timeSinceAndonEnabled,
                        asin: asin
                    });
                }
            } catch (error) {
                console.error('Error fetching audit history:', error);
                updateStatus('Error fetching audit history for item.');
            }
        }

        // Fetch stores
        updateStatus('Fetching list of stores...');
        fetch(apiUrlBase, {
            method: 'POST',
            headers: headersStores,
            body: JSON.stringify({}),
            credentials: 'include'
        })
        .then(response => response.json())
        .then(storeData => {
            if (!storeData || !storeData.storesInformation) {
                throw new Error('Invalid store data received');
            }

            const bySelectElement = document.getElementById('bySelect');
            const storeSelect = document.getElementById('storeSelect');
            const allStoresCheckbox = document.getElementById('allStoresCheckbox');

            // Disable store dropdown if "All Stores" is checked
            allStoresCheckbox.addEventListener('change', function() {
                storeSelect.disabled = this.checked;
            });

            const stores = [];
            for (const region in storeData.storesInformation) {
                const states = storeData.storesInformation[region];
                for (const state in states) {
                    states[state].forEach(store => {
                        stores.push({
                            value: store.storeTLC,
                            text: `${store.storeTLC} - ${store.storeName}`
                        });
                    });
                }
            }

            // Populate store dropdown or region dropdown based on "bySelect"
            bySelectElement.addEventListener('change', function() {
                const bySelectValue = bySelectElement.value;
                storeSelect.innerHTML = ''; // Clear existing options
                storeSelect.placeholder = `Select a ${bySelectValue.toLowerCase()}...`;
                if (bySelectValue === 'Store') {
                    stores.forEach(store => {
                        const option = document.createElement('option');
                        option.value = store.value;
                        option.text = store.text;
                        storeSelect.add(option);
                    });
                } else {
                    // Populate with region names
                    Object.keys(storeData.storesInformation).forEach(region => {
                        const option = document.createElement('option');
                        option.value = region;
                        option.text = region;
                        storeSelect.add(option);
                    });
                }
            });

            // Initialize store select with a placeholder
            storeSelect.innerHTML = '<option value="">Select a store...</option>';
            bySelectElement.dispatchEvent(new Event('change')); // Trigger to populate initial options
            updateStatus('Store information retrieved successfully.');

            // Sort stores alphabetically for the Store dropdown
            stores.sort((a, b) => a.text.localeCompare(b.text));
            stores.forEach(store => {
                const option = document.createElement('option');
                option.value = store.value;
                option.text = store.text;
                storeSelect.add(option);
            });

            // Make the dropdown searchable (requires Select2)
            $(storeSelect).select2({
                placeholder: 'Select a store...',
                allowClear: true
            });

            // ------------------------------------------------------------------
            //  Batching logic: fetch items in groups of (say) 10 stores at a time
            // ------------------------------------------------------------------
            const headersItems = {
                'accept': '*/*',
                'accept-encoding': 'gzip, deflate, br',
                'accept-language': 'en-US,en;q=0.9',
                'content-type': 'application/x-amz-json-1.0',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'x-amz-target': 'WfmCamBackendService.GetItemsAvailability'
            };

            // Helper function to fetch items for store IDs in batches
            async function fetchItemsInBatches(storeIds, batchSize=10) {
                let allItems = [];
                // Break the array of storeIds into slices of size "batchSize"
                for (let i = 0; i < storeIds.length; i += batchSize) {
                    const storeIdBatch = storeIds.slice(i, i + batchSize);
                    updateStatus(`Fetching items for stores [${storeIdBatch.join(', ')}] ...`);

                    // Single fetch call for this batch
                    const response = await fetch(apiUrlBase, {
                        method: 'POST',
                        headers: headersItems,
                        body: JSON.stringify({
                            filterContext: {
                                storeIds: storeIdBatch
                            },
                            paginationContext: {
                                pageNumber: 0,
                                pageSize: 10000
                            }
                        }),
                        credentials: 'include'
                    });
                    const data = await response.json();
                    if (data && data.itemsAvailability) {
                        allItems.push(...data.itemsAvailability);
                    }

                    // Short delay between batches to avoid overwhelming the server
                    await delay(500);
                }
                return allItems;
            }

            // Handle the "Next Request" button
            const nextRequestButton = document.getElementById('nextRequestButton');
            if (nextRequestButton) {
                nextRequestButton.addEventListener('click', function() {
                    const bySelectValue = document.getElementById('bySelect').value;
                    const selectedValue = $(storeSelect).val(); // Use select2 method
                    const allStoresSelected = document.getElementById('allStoresCheckbox').checked;

                    // Must choose a store/region unless "All Stores" is checked
                    if (!selectedValue && !allStoresSelected) {
                        updateStatus(`Please select a ${bySelectValue.toLowerCase()}.`);
                        return;
                    }

                    // Prepare the store list depending on "By Store", "By Region", or "All Stores"
                    const storeIds = allStoresSelected
                        ? Object.values(storeData.storesInformation).flatMap(regionObj =>
                            Object.values(regionObj).flat().map(store => store.storeTLC)
                          )
                        : bySelectValue === 'Store'
                            ? [selectedValue]
                            : Object.values(storeData.storesInformation[selectedValue])
                                 .flat()
                                 .map(store => store.storeTLC);

                    // Now fetch *all* items from those storeIds in batches
                    fetchItemsInBatches(storeIds, 10)
                        .then(async (allItemsAvailability) => {
                            // Filter for Andon
                            const items = allItemsAvailability.filter(item => item.andon === true);
                            const itemsData = allItemsAvailability.map(item => ({
                                storeId: item.storeId,
                                wfmScanCode: item.wfmScanCode,
                                itemName: item.itemName,
                                inventoryStatus: item.inventoryStatus,
                                currentInventoryQuantity: item.currentInventoryQuantity
                            }));

                            console.log('Items with Andon Cord enabled:', items);
                            updateStatus(`Found ${items.length} items with Andon Cord enabled`);

                            // -------------------------------
                            // Concurrency for Audit History
                            // -------------------------------
                            let maxConcurrentRequests = 5; // Start with a default concurrency
                            let currentIndex = 0;
                            const startTime = Date.now();

                            const processNextBatch = async () => {
                                if (isCancelled || currentIndex >= items.length) return;

                                const batch = items.slice(currentIndex, currentIndex + maxConcurrentRequests);
                                currentIndex += batch.length;

                                const results = await Promise.all(batch.map(async (item) => {
                                    try {
                                        await fetchAuditHistoryWithDelay(item);
                                        // Estimate progress/time
                                        const elapsedTime = (Date.now() - startTime) / 1000; // in seconds
                                        const estimatedTotalTime = (elapsedTime / currentIndex) * items.length;
                                        const remainingTime = estimatedTotalTime - elapsedTime;
                                        updateStatus(`Gathering audit history... ${currentIndex} / ${items.length}. Estimated time left: ${Math.round(remainingTime)} seconds`);
                                        return true; // success
                                    } catch (error) {
                                        console.error('Error fetching audit history:', error);
                                        return false; // failure
                                    }
                                }));

                                // Dynamically adjust concurrency based on success rate
                                const successRate = results.filter(Boolean).length / results.length;
                                if (successRate < 0.8) {
                                    maxConcurrentRequests = Math.max(1, maxConcurrentRequests - 1);
                                } else if (successRate === 1) {
                                    maxConcurrentRequests = Math.min(10, maxConcurrentRequests + 1);
                                }

                                // Short delay between batches
                                await delay(100);

                                // Continue to next batch
                                return processNextBatch();
                            };

                            await Promise.all([processNextBatch()]);

                            // Optional progress bar container
                            const progressContainer = document.createElement('div');
                            progressContainer.id = 'progressContainer';
                            statusContainer.appendChild(progressContainer);

                            // Example React-based progress bar (requires React/ReactDOM)
                            const ProgressBar = ({ progress }) => (
                                React.createElement('div', { className: 'progress', style: { width: '100%', marginTop: '10px' } },
                                    React.createElement('div', {
                                        className: 'progress-bar',
                                        role: 'progressbar',
                                        style: { width: `${progress}%` },
                                        'aria-valuenow': progress,
                                        'aria-valuemin': '0',
                                        'aria-valuemax': '100'
                                    }, `${progress}%`)
                                )
                            );
                            const progress = (currentIndex / items.length) * 100;
                            if (typeof React !== 'undefined' && typeof ReactDOM !== 'undefined') {
                                ReactDOM.render(
                                    React.createElement(ProgressBar, { progress }),
                                    progressContainer
                                );
                            }

                            // Final Excel export if not cancelled and we got data
                            if (!isCancelled && compiledData.length > 0) {
                                const workbook = XLSX.utils.book_new();

                                // "ItemsAvailability" sheet
                                const itemsWorksheet = XLSX.utils.json_to_sheet(itemsData);
                                XLSX.utils.book_append_sheet(workbook, itemsWorksheet, 'ItemsAvailability');

                                // For the audit history: reduce to one row per unique key
                                // Create unique data by keeping the most recent entry for each uniqueKey
                                const uniqueDataMap = new Map();
                                compiledData.forEach(item => {
                                    const existing = uniqueDataMap.get(item.uniqueKey);
                                    if (!existing || new Date(item.updatedAt) > new Date(existing.updatedAt)) {
                                        uniqueDataMap.set(item.uniqueKey, item);
                                    }
                                });
                                const uniqueData = Array.from(uniqueDataMap.values());
                                console.log('Unique Data Before Download:', uniqueData);

                                if (uniqueData.length > 0) {
                                    console.log('Preparing to download data...');
                                    const uniqueWorksheet = XLSX.utils.json_to_sheet(uniqueData);
                                    const compiledWorksheet = XLSX.utils.json_to_sheet(compiledData);

                                    XLSX.utils.book_append_sheet(workbook, uniqueWorksheet, 'UniqueAuditHistory');
                                    XLSX.utils.book_append_sheet(workbook, compiledWorksheet, 'CompiledAuditHistory');
                                    XLSX.writeFile(workbook, 'AuditHistoryData.xlsx');
                                    updateStatus('Audit history data exported to Excel file.');
                                    console.log('Download triggered.');
                                } else {
                                    updateStatus('No data available to export.');
                                }
                            }
                        })
                        .catch(error => {
                            console.error('Error fetching items:', error);
                            updateStatus('Error fetching items for store.');
                        });
                });
            }
        })
        .catch(error => {
            console.error('Error fetching store data:', error);
            updateStatus('Error fetching store data.');
        });
    }

    // Setup mutation observer for button
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                const auditHistoryPullButton = document.getElementById('auditHistoryPullButton');
                if (auditHistoryPullButton) {
                    auditHistoryPullButton.addEventListener('click', auditHistoryPull);
                    observer.disconnect();
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

})();
