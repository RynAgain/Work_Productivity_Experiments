(function() {
    'use strict';

    // Expose our init function for the main script
    window.initDownloadDataFeature = function() {
        console.log('initDownloadDataFeature called from required script');

        // Define the "addDownloadButton" function
        function addDownloadButton() {
            console.log('Attempting to add download data button...');

            // Check if the button already exists
            if (document.getElementById('downloadDataButton')) {
                console.log('Download data button already exists');
                return;
            }

            // Create the download data button
            const downloadButton = document.createElement('button');
            downloadButton.id = 'downloadDataButton';
            downloadButton.innerHTML = 'Download Data';
            downloadButton.style.position = 'fixed';
            downloadButton.style.bottom = '0';
            downloadButton.style.left = '0';
            downloadButton.style.width = '25%';
            downloadButton.style.height = '40px';
            // "zIndex = '1000 !important'" can be problematic. Use a number:
            downloadButton.style.zIndex = '9999999';
            downloadButton.style.fontSize = '14px';
            downloadButton.style.backgroundColor = '#007bff';
            downloadButton.style.color = '#fff';
            downloadButton.style.border = 'none';
            downloadButton.style.borderRadius = '0';
            downloadButton.style.cursor = 'pointer';

            // Create a progress tracker
            const progress = document.createElement('div');
            progress.id = 'progressTracker';
            progress.style.position = 'fixed';
            progress.style.bottom = '40px';
            progress.style.left = '0';
            progress.style.width = '100%';
            progress.style.height = '30px';
            progress.style.zIndex = '9999999';
            progress.style.fontSize = '14px';
            progress.style.backgroundColor = '#f0f0f0';
            progress.style.color = '#000';
            progress.style.textAlign = 'center';
            progress.style.lineHeight = '30px';
            progress.style.borderRadius = '0';
            progress.style.display = 'none';
            progress.textContent = 'Progress: 0%';

            // Append the button and progress tracker to the body
            document.body.appendChild(downloadButton);
            if (!document.getElementById('progressTracker')) {
                document.body.appendChild(progress);
            }
            console.log('Download data button and progress tracker added to the page');

            // Add click event to the download data button
            downloadButton.addEventListener('click', function() {
                console.log('Download Data button clicked');
                progress.style.display = 'block';

                // Example environment logic
                const environment = window.location.hostname.includes('gamma') ? 'gamma' : 'prod';
                const apiUrlBase = `https://${environment}.cam.wfm.amazon.dev/api/`;

                // Headers for store fetch
                const headersStores = {
                    'accept': '*/*',
                    'content-type': 'application/x-amz-json-1.0',
                    'x-amz-target': 'WfmCamBackendService.GetStoresInformation'
                };

                // Call the API to get the list of stores
                fetch(apiUrlBase, {
                    method: 'POST',
                    headers: headersStores,
                    body: JSON.stringify({}),
                    credentials: 'include'
                })
                .then(r => r.json())
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
                                console.log('Store:', store);
                                storeIds.push(store.storeTLC);
                            });
                        }
                    }

                    // Function to fetch items for a single store
                    function fetchItemsForStore(storeId) {
                        const headersItems = {
                            'accept': '*/*',
                            'content-type': 'application/x-amz-json-1.0',
                            'x-amz-target': 'WfmCamBackendService.GetItemsAvailability'
                        };

                        const payloadItems = {
                            filterContext: { storeIds: [storeId] },
                            paginationContext: { pageNumber: 0, pageSize: 10000 }
                        };

                        return fetch(apiUrlBase, {
                            method: 'POST',
                            headers: headersItems,
                            body: JSON.stringify(payloadItems),
                            credentials: 'include'
                        })
                        .then(r => r.json())
                        .then(data => {
                            console.log(`Data for store ${storeId}:`, data);

                            if (!data.itemsAvailability) return [];

                            return data.itemsAvailability.map(item => {
                                item.andon = item.andon === true ? 'Enabled' : 'Disabled';
                                if (item.inventoryStatus === 'Unlimited') {
                                    item.currentInventoryQuantity = 0;
                                } else if (item.inventoryStatus === 'Limited') {
                                    item.currentInventoryQuantity = Math.max(
                                        0,
                                        Math.min(10000, parseInt(item.currentInventoryQuantity) || 0)
                                    );
                                }
                                // Additional transformations here if needed
                                return item;
                            });
                        })
                        .catch(error => {
                            console.error(`Error downloading data for store ${storeId}:`, error);
                            return [];
                        });
                    }

                    // Fetch items for all stores
                    let completedStores = 0;
                    const totalStores = storeIds.length;

                    Promise.all(
                        storeIds.map(storeId =>
                            fetchItemsForStore(storeId).then(result => {
                                completedStores++;
                                const progressPercent = Math.round((completedStores / totalStores) * 100);
                                progress.textContent =
                                    `Compiling Item Data: ${completedStores}/${totalStores} stores processed (${progressPercent}%)`;
                                return result;
                            })
                        )
                    )
                    .then(results => {
                        const allItems = results.flat();
                        console.log('All items data:', allItems);

                        if (allItems.length > 0) {
                            // Build CSV
                            const desiredHeaders = [
                                'andon', 'currentInventoryQuantity', 'hasAndonEnabledComponent',
                                'inventoryStatus', 'isMultiChannel', 'itemName', 'itemType',
                                'reservedQuantity', 'salesFloorCapacity', 'storeId', 'storeName',
                                'team', 'wfmScanCode', 'wfmoaReservedQuantity', 'multiChannelEndDate',
                                'multiChannelStartDate', 'itemUnitOfMeasurement', 'Helper_Column'
                            ];

                            const csvContent = "data:text/csv;charset=utf-8,"
                                + desiredHeaders.join(",") + "\n"
                                + allItems.map(row => desiredHeaders.map(h => {
                                    if (['currentInventoryQuantity','reservedQuantity',
                                        'salesFloorCapacity', 'wfmoaReservedQuantity'].includes(h)) {
                                        return `"${row[h] || 0}"`;
                                    }
                                    if (h === 'Helper_Column') {
                                        return `"${(row.storeId || '') + (row.wfmScanCode || '')}"`;
                                    }
                                    return `"${row[h] || ''}"`;
                                }).join(",")).join("\n");

                            // Create a download link
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", "items_data.csv");
                            document.body.appendChild(link);

                            // Update progress
                            progress.textContent = 'Generating CSV...';

                            // Trigger download
                            link.click();
                            document.body.removeChild(link);

                            // Completion
                            progress.textContent = 'Downloading Now!';
                        } else {
                            console.log('No items data available to download.');
                            progress.textContent = 'No items data available.';
                        }
                    });
                })
                .catch(error => {
                    console.error('Error downloading data:', error);
                    progress.textContent = 'Error downloading data.';
                });
            });
        }

        // 1) Add our observer
        const observer = new MutationObserver(addDownloadButton);
        observer.observe(document.body, { childList: true, subtree: true });

        // 2) Attempt to add the button immediately
        addDownloadButton();
    };

    // The script is done here. The main script can call:
    //   window.initDownloadDataFeature();
})();