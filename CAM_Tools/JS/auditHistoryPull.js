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
            <select id="storeSelect" style="margin-top: 10px; width: 100%;"></select>
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

        async function fetchAuditHistoryWithDelay(item, attempt = 1) {
            const maxAttempts = 5;
            const delayTime = Math.pow(2, attempt) * 1000;

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
                compiledData.push({
                    storeId: item.storeId,
                    wfmScanCode: item.wfmScanCode,
                    auditData: auditData // Store the entire response data
                });
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

            const storeSelect = document.getElementById('storeSelect');
            if (!storeSelect) {
                throw new Error('Store select element not found');
            }

            storeSelect.innerHTML = '<option value="">Select a store...</option>';
            updateStatus('Store information retrieved successfully.');
            
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
                    const selectedStoreId = $(storeSelect).val(); // Use select2 method to get the value
                    if (!selectedStoreId) {
                        updateStatus('Please select a store.');
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

                    updateStatus(`Fetching items for store ${selectedStoreId}...`);
                    fetch(apiUrlBase, {
                        method: 'POST',
                        headers: headersItems,
                        body: JSON.stringify({
                            "filterContext": {
                                "storeIds": [selectedStoreId]
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

                        for (const item of items) {
                            if (isCancelled) break;
                            await fetchAuditHistoryWithDelay(item);
                            updateStatus(`Gathering audit history... One Moment. ${item} / ${items.length}`);
                        }

                        if (!isCancelled && compiledData.length > 0) {
                            const worksheet = XLSX.utils.json_to_sheet(compiledData);
                            const workbook = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(workbook, worksheet, 'AuditHistory');
                            XLSX.writeFile(workbook, 'AuditHistoryData.xlsx');
                            updateStatus('Audit history data exported to Excel file.');
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
