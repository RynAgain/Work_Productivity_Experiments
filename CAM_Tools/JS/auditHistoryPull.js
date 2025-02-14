(function() {
    'use strict';

    function auditHistoryPull() {
        console.log('Audit History Pull initiated for items with Andon Cord enabled');

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
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.zIndex = '1001';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';

        let isCancelled = false;
        const statusContainer = document.createElement('div');
        statusContainer.style.position = 'relative';
        statusContainer.style.backgroundColor = '#fff';
        statusContainer.style.padding = '20px';
        statusContainer.style.borderRadius = '5px';
        statusContainer.style.width = '300px';
        statusContainer.style.textAlign = 'center';
        statusContainer.innerHTML = `
            <h3>Audit History Status</h3>
            <p id="statusMessage">Initializing...</p>
            <label>By</label>
            <select id="bySelect" style="margin-top: 10px; width: 100%;">
                <option value="Store">Store</option>
                <option value="Region">Region</option>
            </select>
            <select id="storeSelect" style="margin-top: 10px; width: 100%;"></select>
            <label><input type="checkbox" id="getAsinCheckbox" style="margin-top: 10px;"> Get ASIN (extra slow)</label>
            <button id="nextRequestButton" style="margin-top: 10px; margin-right: 5px;">Next Request</button>
            <button id="cancelButton" style="margin-top: 10px;">Cancel</button>
        `;

        const closeButton = document.createElement('span');
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
        statusContainer.appendChild(closeButton);
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
            await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay

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

                if (response.status === 429 && attempt < maxAttempts) {
                    console.warn(`Rate limited, retrying in ${delayTime/1000} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, delayTime));
                    return fetchAuditHistoryWithDelay(item, attempt + 1);
                }

                const auditData = await response.json();
                console.log('Audit Data Response:', auditData); // Log the response data
                console.log('Compiled Data Before Push:', compiledData); // Log compiled data before pushing
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
                    Object.keys(storeData.storesInformation).forEach(region => {
                        const option = document.createElement('option');
                        option.value = region;
                        option.text = region;
                        storeSelect.add(option);
                    });
                }
            });
            if (!storeSelect) {
                throw new Error('Store select element not found');
            }

            storeSelect.innerHTML = '<option value="">Select a store...</option>';
            bySelectElement.dispatchEvent(new Event('change')); // Trigger change to populate initial options
            updateStatus('Store information retrieved successfully.');
            

            // Sort stores alphabetically
            stores.sort((a, b) => a.text.localeCompare(b.text));

            // Add sorted stores to the dropdown
            stores.forEach(store => {
                const option = document.createElement('option');
                option.value = store.value;
                option.text = store.text;
                storeSelect.add(option);
            });

            // Make the dropdown searchable
            $(storeSelect).select2({
                placeholder: 'Select a store...',
                allowClear: true
            });

            // Ensure no actions are taken until a store is selected and "Next Request" is clicked
            const nextRequestButton = document.getElementById('nextRequestButton');
            if (nextRequestButton) {
                nextRequestButton.addEventListener('click', function() {
                    const bySelect = document.getElementById('bySelect').value;
                    const selectedValue = $(storeSelect).val(); // Use select2 method to get the value
                    if (!selectedValue) {
                        updateStatus(`Please select a ${bySelect.toLowerCase()}.`);
                        return;
                    }

                    const headersItems = {
                        'accept': '*/*',
                        'accept-encoding': 'gzip, deflate, br',
                        'accept-language': 'en-US,en;q=0.9',
                        'content-type': 'application/x-amz-json-1.0',
                        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                        'x-amz-target': 'WfmCamBackendService.GetItemsAvailability'
                    };

                    updateStatus(`Fetching items for ${bySelect.toLowerCase()} ${selectedValue}...`);
                    fetch(apiUrlBase, {
                        method: 'POST',
                        headers: headersItems,
                        body: JSON.stringify({
                            "filterContext": {
                                "storeIds": bySelect === 'Store' ? [selectedValue] : Object.values(storeData.storesInformation[selectedValue]).flat().map(store => store.storeTLC)
                            },
                            "paginationContext": {
                                "pageNumber": 0,
                                "pageSize": 10000
                            }
                        }),
                        credentials: 'include'
                    })
                    .then(response => response.json())
                    .then(async data => {
                        const items = data.itemsAvailability.filter(item => item.andon === true);
                        console.log('Items with Andon Cord enabled:', items);
                        updateStatus(`Found ${items.length} items with Andon Cord enabled`);
                    
                        let maxConcurrentRequests = 5; // Start with a default batch size
                        let currentIndex = 0;

                        const processNextBatch = async () => {
                            if (isCancelled || currentIndex >= items.length) return;

                            const batch = items.slice(currentIndex, currentIndex + maxConcurrentRequests);
                            currentIndex += batch.length;

                            const results = await Promise.all(batch.map(async (item, index) => {
                                try {
                                    await fetchAuditHistoryWithDelay(item);
                                    updateStatus(`Gathering audit history... One Moment. ${currentIndex} / ${items.length}`);
                                    return true; // Indicate success
                                } catch (error) {
                                    console.error('Error fetching audit history:', error);
                                    return false; // Indicate failure
                                }
                            }));

                            const successRate = results.filter(result => result).length / results.length;
                            if (successRate < 0.8) {
                                maxConcurrentRequests = Math.max(1, maxConcurrentRequests - 1); // Decrease batch size on failure
                            } else if (successRate === 1) {
                                maxConcurrentRequests = Math.min(10, maxConcurrentRequests + 1); // Increase batch size on success
                            }

                            await delay(100); // Delay between batches
                            processNextBatch();
                        };

                        processNextBatch();
                    
                        if (!isCancelled && compiledData.length > 0) {
                            // Reduce to one row per unique key
                            const uniqueData = Array.from(new Map(compiledData.map(item => [item.uniqueKey, item])).values());
                            console.log('Unique Data Before Download:', uniqueData);
                            if (uniqueData.length > 0) {
                                console.log('Preparing to download data...');
                                const uniqueWorksheet = XLSX.utils.json_to_sheet(uniqueData);
                                const compiledWorksheet = XLSX.utils.json_to_sheet(compiledData);
                                const workbook = XLSX.utils.book_new();
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

    // Export for testing
    try {
        module.exports = { auditHistoryPull };
    } catch (e) {
        // Ignore if not in Node.js environment
    }
})();
