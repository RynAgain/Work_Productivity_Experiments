(function() {
    'use strict';

    // Function to handle the audit history pull for items with Andon Cord enabled
    function auditHistoryPull() {
        console.log('Audit History Pull initiated for items with Andon Cord enabled');

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

        // Create a status overlay
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

        const statusContainer = document.createElement('div');
        statusContainer.style.position = 'relative';
        statusContainer.style.backgroundColor = '#fff';
        statusContainer.style.padding = '20px';
        statusContainer.style.borderRadius = '5px';
        statusContainer.style.width = '300px';
        statusContainer.style.textAlign = 'center';
        statusContainer.innerHTML = '<h3>Audit History Status</h3><p id="statusMessage">Initializing...</p>';

        overlay.appendChild(statusContainer);
        document.body.appendChild(overlay);

        const updateStatus = (message) => {
            document.getElementById('statusMessage').innerText = message;
        };

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

            const storeIds = [];
            for (const region in storeData.storesInformation) {
                const states = storeData.storesInformation[region];
                for (const state in states) {
                    const stores = states[state];
                    stores.forEach(store => {
                        storeIds.push(store.storeTLC);
                    });
                }
            }

            // Step 2: Get items in the stores
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
                    // Step 3: Filter items by Andon Cord
                    const items = data.itemsAvailability.filter(item => item.andon === true);
                    console.log('Items with Andon Cord enabled:', items);

                    // Step 4: Fetch audit history for each item
                    items.forEach(item => {
                        const headersAudit = {
                            'accept': '*/*',
                            'accept-language': 'en-US,en;q=0.9',
                            'content-type': 'application/x-amz-json-1.0',
                            'x-amz-target': 'WfmCamBackendService.GetAuditHistory',
                            'x-amz-user-agent': 'aws-sdk-js/0.0.1 os/Windows/NT_10.0 lang/js md/browser/Chrome_133.0.0.0',
                            'Referer': `https://${environment}.cam.wfm.amazon.dev/store/${item.storeId}/item/${item.wfmScanCode}`,
                            'Referrer-Policy': 'strict-origin-when-cross-origin'
                        };

                        const payloadAudit = {
                            storeId: item.storeId,
                            wfmScanCode: item.wfmScanCode
                        };

                        fetch(apiUrlBase, {
                            method: 'POST',
                            headers: headersAudit,
                            body: JSON.stringify(payloadAudit),
                            credentials: 'include'
                        })
                        .then(response => response.json())
                        .then(auditData => {
                            console.log('Audit History Data for item:', auditData);
                            // Step 5: Compile the results into a data frame
                            const compiledData = []; // Array to hold compiled data

                            // Add audit data to compiledData
                            compiledData.push({
                                storeId: item.storeId,
                                wfmScanCode: item.wfmScanCode,
                                auditData: auditData // Assuming auditData is an object with relevant fields
                            });

                            // Convert compiledData to XLSX
                            const worksheet = XLSX.utils.json_to_sheet(compiledData);
                            const workbook = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(workbook, worksheet, 'AuditHistory');
                            XLSX.writeFile(workbook, 'AuditHistoryData.xlsx');
                        })
                        .catch(error => {
                            console.error('Error fetching audit history for item:', error);
                        });
                    });
                })
                .catch(error => {
                    console.error('Error fetching items:', error);
                });
            };

            // Process stores in batches
            const batchSize = 10;
            for (let i = 0; i < storeIds.length; i += batchSize) {
                fetchItemsForStores(storeIds.slice(i, i + batchSize));
            }
        });
    }

    // Expose the function to the global scope for testing
    try {
        module.exports = {
            auditHistoryPull
        };
    } catch (e) {
        // Handle the error if needed
    }

    // Use MutationObserver to detect when the button is added to the DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                const auditHistoryPullButton = document.getElementById('auditHistoryPullButton');
                if (auditHistoryPullButton) {
                    auditHistoryPullButton.addEventListener('click', function() {
                        auditHistoryPull();
                    });
                    observer.disconnect(); // Stop observing once the button is found
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
