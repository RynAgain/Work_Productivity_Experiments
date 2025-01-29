(function() {
    'use strict';

    // Expose an init function to the global scope
    window.initDownloadDataFeature = function() {
        console.log('initDownloadDataFeature called from required script');

        // Function to add the download data button
        function addDownloadButton() {
            console.log('Attempting to add download data button');
            console.log('initDownloadDataFeature function is executing.');

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

            // Create a progress tracker
            var progress = document.createElement('div');
            progress.id = 'progressTracker';
            progress.style.position = 'fixed';
            progress.style.bottom = '40px';
            progress.style.left = '0';
            progress.style.width = '100%';
            progress.style.height = '30px';
            progress.style.zIndex = '1000 ';
            progress.style.fontSize = '14px ';
            progress.style.backgroundColor = '#f0f0f0 ';
            progress.style.color = '#000 ';
            progress.style.textAlign = 'center';
            progress.style.lineHeight = '30px';
            progress.style.borderRadius = '0';
            progress.style.display = 'none';
            progress.innerHTML = 'Progress: 0%';

            // Create a cancel button
            var cancelButton = document.createElement('button');
            cancelButton.id = 'cancelButton';
            cancelButton.innerHTML = 'Cancel';
            cancelButton.style.position = 'fixed';
            cancelButton.style.bottom = '80px';
            cancelButton.style.left = '0';
            cancelButton.style.width = '20%';
            cancelButton.style.height = '40px';
            cancelButton.style.zIndex = '1000';
            cancelButton.style.fontSize = '14px';
            cancelButton.style.backgroundColor = '#FF0000';
            cancelButton.style.color = '#fff';
            cancelButton.style.border = 'none';
            cancelButton.style.borderRadius = '0';
            cancelButton.style.cursor = 'pointer';
            cancelButton.style.display = 'none';

            // Append the button, progress tracker, and cancel button to the body
            document.body.appendChild(downloadButton);
            document.body.appendChild(progress);
            document.body.appendChild(cancelButton);
            console.log('Download data button, progress tracker, and cancel button added to the page');
            console.log('Button HTML:', downloadButton.outerHTML);
            console.log('Progress HTML:', progress.outerHTML);

            // Add click event to the download data button
            downloadButton.addEventListener('click', function() {
                console.log('Download Data button clicked');
                var progress = document.getElementById('progressTracker');
                var cancelButton = document.getElementById('cancelButton');
                if (progress) {
                    progress.style.display = 'block';
                    if (cancelButton) {
                        cancelButton.style.display = 'block';
                    } else {
                        console.error('Cancel button not found');
                    }
                } else {
                    console.error('Progress tracker not found');
                }

                // Determine the environment (prod or gamma)
                const environment = window.location.hostname.includes('gamma') ? 'gamma' : 'prod';
                const apiUrlBase = `https://${environment}.cam.wfm.amazon.dev/api/`;

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
                fetch(apiUrlBase, {
                    method: 'POST',
                    headers: headersStores,
                    body: JSON.stringify({}),
                    credentials: 'include' // Include cookies in the request
                })
                .then(response => response.json())
                .then(storeData => {
                    console.log('Store data received:', storeData);

                    if (!storeData || !storeData.storesInformation) {
                        throw new Error('Invalid store data received');
                    }

                    // Extract store IDs from the nested structure
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

                    // Function to fetch items for a batch of stores
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
                                "pageSize": 10000 //would like to test expanding this range
                            }
                        };

                        return fetch(apiUrlBase, {
                            method: 'POST',
                            headers: headersItems,
                            body: JSON.stringify(payloadItems),
                            credentials: 'include' // Include cookies in the request
                        })
                        .then(response => response.json())
                        .then(data => {
                            console.log(`Data for store batch:`, data); //unclear what this change did
                            return data.itemsAvailability.map(item => {
                                // Transformations
                                item.andon = item.andon === true ? 'Enabled' : 'Disabled';
                                if (item.inventoryStatus === 'Unlimited') {
                                    item.currentInventoryQuantity = 0;
                                } else if (item.inventoryStatus === 'Limited') {
                                    item.currentInventoryQuantity = Math.max(0, Math.min(10000, parseInt(item.currentInventoryQuantity) || 0));
                                }
                                item.hasAndonEnabledComponent = item.hasAndonEnabledComponent || 'FALSE';
                                item.isMultiChannel = item.isMultiChannel || 'FALSE';
                                item.reservedQuantity = item.reservedQuantity !== undefined && item.reservedQuantity !== '' ? parseInt(item.reservedQuantity) || 0 : 0;
                                item.salesFloorCapacity = item.salesFloorCapacity !== undefined && item.salesFloorCapacity !== '' ? parseInt(item.salesFloorCapacity) || 0 : 0;
                                item.wfmoaReservedQuantity = item.wfmoaReservedQuantity !== undefined && item.wfmoaReservedQuantity !== '' ? parseInt(item.wfmoaReservedQuantity) || 0 : 0;
                                return {
                                    ...item//,
                                    // asin: item.asin || '',
                                    // wfmoaMerchantId: item.wfmoaMerchantId || ''
                                };
                            });
                        })
                        .catch(error => {
                            console.error(`Error downloading data for store batch:`, error);
                            return [];
                        });
                    };

                    // Fetch items for all stores and compile results
                    let completedStores = 0;
                    const totalStores = storeIds.length;

                    let cancelRequested = false;
                    cancelButton.addEventListener('click', function() {
                        cancelRequested = true;
                        progress.innerHTML = 'Download Cancelled';
                        cancelButton.style.display = 'none';
                    });

                    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

                    const batchSize = 10; // Number of stores per batch
                    const storeIdBatches = [];
                    for (let i = 0; i < storeIds.length; i += batchSize) {
                        storeIdBatches.push(storeIds.slice(i, i + batchSize));
                    }

                    const retryLimit = 10;
                    const fetchWithRetry = async (storeIdsBatch, attempt = 1) => {
                        try {
                            await delay(100); // Add a delay between requests
                            if (cancelRequested) {
                                return Promise.resolve([]);
                            }
                            return fetchItemsForStores(storeIdsBatch);
                        } catch (error) {
                            if (attempt < retryLimit) {
                                console.warn(`Retrying store batch, attempt ${attempt + 1}`);
                                return fetchWithRetry(storeIdsBatch, attempt + 1);
                            } else {
                                console.error(`Failed to download data for store batch after ${retryLimit} attempts`);
                                return [];
                            }
                        }
                    };

                    Promise.all(storeIdBatches.map(storeIdsBatch => {
                        return fetchWithRetry(storeIdsBatch).then(result => {
                            if (cancelRequested) {
                                return [];
                            }
                            completedStores += storeIdsBatch.length;
                            if (!cancelRequested) {
                                const progressPercent = Math.round((completedStores / totalStores) * 100);
                                progress.innerHTML = `Compiling Item Data: ${completedStores}/${totalStores} stores processed (${progressPercent}%)`;
                            }
                            return result;
                        });
                    }))
                    .then(results => {
                        const allItems = results.flat();
                        console.log('All items data:', allItems);

                        if (allItems.length > 0) {
                            // Specify the correct headers to include
                            const desiredHeaders = [
                                'andon', 'currentInventoryQuantity', 'hasAndonEnabledComponent',
                                'inventoryStatus', 'isMultiChannel', 'itemName', 'itemType',
                                'reservedQuantity', 'salesFloorCapacity', 'storeId', 'storeName',
                                'team', 'wfmScanCode', 'wfmoaReservedQuantity', /* 'asin', 'wfmoaMerchantId', */ 'multiChannelEndDate',
                                'multiChannelStartDate', 'itemUnitOfMeasurement', 'Helper_Column'
                            ];
                            const csvContent = "data:text/csv;charset=utf-8,"
                                + desiredHeaders.join(",") + "\n" // Add headers
                                + allItems.map(e => desiredHeaders.map(header => {
                                    if (['currentInventoryQuantity','reservedQuantity', 'salesFloorCapacity', 'wfmoaReservedQuantity'].includes(header)) {
                                        return `"${e[header] || 0}"`;
                                    }
                                    if (header === 'Helper_Column') {
                                        return `"${e['storeId'] || ''}${e['wfmScanCode'] || ''}"`;
                                    }
                                    return `"${e[header] || ''}"`;
                                }).join(",")).join("\n");

                            // Create a download link
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", "items_data.csv");
                            document.body.appendChild(link);

                            // Update progress to indicate CSV generation
                            progress.innerHTML = 'Generating CSV...';

                            // Trigger the download
                            link.click();
                            document.body.removeChild(link);

                            // Update progress to indicate completion
                            progress.innerHTML = 'Downloading Now!';
                            progress.style.color = 'red'; // Make this message appear red, because that looks better?
                            // Inject CSS for fade-out effect
                            const style = document.createElement('style');
                            style.innerHTML = `
                                @keyframes fadeOut {
                                    0% { opacity: 1; }
                                    100% { opacity: 0; visibility: hidden; }
                                }
                                .fade-out {
                                    animation: fadeOut 10s forwards;
                                }
                            `;
                            document.head.appendChild(style);

                            // Apply fade-out effect after a delay
                            setTimeout(() => {
                                progress.classList.add('fade-out');
                            }, 2000);

                        } else {
                            console.log('No items data available to download.');
                        }
                    });
                })
                .catch(error => console.error('Error downloading data:', error));
                //make this message appear red!
            });
        }

        // Use MutationObserver to detect changes in the DOM
        const observer = new MutationObserver(addDownloadButton);
        observer.observe(document.body, { childList: true, subtree: true });

        // Initial attempt to add the download data button
        addDownloadButton();
    };
})();
