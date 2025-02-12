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
        // ... (previous overlay styling remains the same)

        let isCancelled = false;
        const statusContainer = document.createElement('div');
        // ... (previous statusContainer styling remains the same)

        overlay.appendChild(statusContainer);
        document.body.appendChild(overlay);

        let compiledData = [];

        const updateStatus = (message) => {
            document.getElementById('statusMessage').innerText = message;
        };

        document.getElementById('cancelButton').addEventListener('click', function() {
            isCancelled = true;
            updateStatus('Cancelling...');
        });

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

            // Populate store select dropdown
            const storeSelect = document.getElementById('storeSelect');
            storeSelect.innerHTML = '';
            updateStatus('Store information retrieved successfully.');
            
            for (const region in storeData.storesInformation) {
                const states = storeData.storesInformation[region];
                for (const state in states) {
                    states[state].forEach(store => {
                        const option = document.createElement('option');
                        option.value = store.storeTLC;
                        option.text = `${store.storeTLC} - ${store.storeName}`;
                        storeSelect.add(option);
                    });
                }
            }

            // Handle next request button click
            document.getElementById('nextRequestButton').addEventListener('click', function() {
                const selectedStoreId = storeSelect.value;
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

                const fetchItemsForStore = () => {
                    const payloadItems = {
                        "filterContext": {
                            "storeIds": [selectedStoreId]
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
                    .then(async data => {
                        const items = data.itemsAvailability.filter(item => item.andon === true);
                        console.log('Items with Andon Cord enabled:', items);

                        for (const item of items) {
                            if (isCancelled) break;
                            await fetchAuditHistoryWithDelay(item);
                        }

                        // Export to Excel after processing all items
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
                };

                fetchItemsForStore();
            });
        })
        .catch(error => {
            console.error('Error fetching store data:', error);
            updateStatus('Error fetching store data.');
        });
    }

    // Helper function for fetching audit history with retry logic
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
            compiledData.push({
                storeId: item.storeId,
                wfmScanCode: item.wfmScanCode,
                auditData: auditData
            });
        } catch (error) {
            console.error('Error fetching audit history:', error);
            updateStatus('Error fetching audit history for item.');
        }
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
