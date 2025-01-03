// ==UserScript==
// @name         Add Button to Download Data
// @namespace    http://tampermonkey.net/
// @version      4.8
// @description  Adds a button to download data from the API
// @author       Ryan Satterfield
// @match        https://*.cam.wfm.amazon.dev/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    console.log('Tampermonkey script is running');

    // Function to add the buttons and progress tracker
    function addButtonsAndProgress(): void {
        console.log('Attempting to add buttons and progress tracker');

        // Check if the buttons already exist
        if (document.getElementById('downloadDataButton')) {
            console.log('Buttons already exist');
            return;
        }

        // Create the download data button
        const downloadButton: HTMLButtonElement = document.createElement('button');
        downloadButton.id = 'downloadDataButton';
        downloadButton.innerHTML = 'Download Data';
        downloadButton.style.position = 'fixed';
        downloadButton.style.bottom = '0';
        downloadButton.style.left = '0';
        downloadButton.style.width = '25%';
        downloadButton.style.height = '40px';
        downloadButton.style.zIndex = '1000 !important';
        downloadButton.style.fontSize = '14px !important';
        downloadButton.style.backgroundColor = '#007bff !important';
        downloadButton.style.color = '#fff !important';
        downloadButton.style.border = 'none !important';
        downloadButton.style.borderRadius = '0';
        downloadButton.style.cursor = 'pointer !important';

        // Create the add new item(s) button
        const addItemButton: HTMLButtonElement = document.createElement('button');
        addItemButton.id = 'addItemButton';
        addItemButton.innerHTML = 'Add New Item(s)';
        addItemButton.style.position = 'fixed';
        addItemButton.style.bottom = '0';
        addItemButton.style.left = '25%';
        addItemButton.style.width = '25%';
        addItemButton.style.height = '40px';
        addItemButton.style.zIndex = '1000 !important';
        addItemButton.style.fontSize = '14px !important';
        addItemButton.style.backgroundColor = '#28a745 !important';
        addItemButton.style.color = '#fff !important';
        addItemButton.style.border = 'none !important';
        addItemButton.style.borderRadius = '0';
        addItemButton.style.cursor = 'pointer !important';

        // Create the activate/deactivate item(s) button
        const activateButton: HTMLButtonElement = document.createElement('button');
        activateButton.id = 'activateButton';
        activateButton.innerHTML = 'Activate/Deactivate Item(s)';
        activateButton.style.position = 'fixed';
        activateButton.style.bottom = '0';
        activateButton.style.left = '50%';
        activateButton.style.width = '25%';
        activateButton.style.height = '40px';
        activateButton.style.zIndex = '1000 !important';
        activateButton.style.fontSize = '14px !important';
        activateButton.style.backgroundColor = '#ffc107 !important';
        activateButton.style.color = '#fff !important';
        activateButton.style.border = 'none !important';
        activateButton.style.borderRadius = '0';
        activateButton.style.cursor = 'pointer !important';

        // Create the redrive button
        const redriveButton: HTMLButtonElement = document.createElement('button');
        redriveButton.id = 'redriveButton';
        redriveButton.innerHTML = 'Redrive';
        redriveButton.style.position = 'fixed';
        redriveButton.style.bottom = '0';
        redriveButton.style.left = '75%';
        redriveButton.style.width = '25%';
        redriveButton.style.height = '40px';
        redriveButton.style.zIndex = '1000 !important';
        redriveButton.style.fontSize = '14px !important';
        redriveButton.style.backgroundColor = '#dc3545 !important';
        redriveButton.style.color = '#fff !important';
        redriveButton.style.border = 'none !important';
        redriveButton.style.borderRadius = '0';
        redriveButton.style.cursor = 'pointer !important';

        // Create a progress tracker
        const progress: HTMLDivElement = document.createElement('div');
        progress.id = 'progressTracker';
        progress.style.position = 'fixed';
        progress.style.bottom = '40px';
        progress.style.left = '0';
        progress.style.width = '100%';
        progress.style.height = '30px';
        progress.style.zIndex = '1000 !important';
        progress.style.fontSize = '14px !important';
        progress.style.backgroundColor = '#f0f0f0 !important';
        progress.style.color = '#000 !important';
        progress.style.textAlign = 'center';
        progress.style.lineHeight = '30px';
        progress.style.borderRadius = '0';
        progress.style.display = 'none';
        progress.innerHTML = 'Progress: 0%';

        // Append the buttons and progress tracker to the body
        document.body.appendChild(downloadButton);
        document.body.appendChild(addItemButton);
        document.body.appendChild(activateButton);
        document.body.appendChild(redriveButton);
        document.body.appendChild(progress);
        console.log('Buttons and progress tracker added to the page');

        // Add click event to the download data button
        downloadButton.addEventListener('click', function() {
            console.log('Download Data button clicked');
            progress.style.display = 'block';

            // Determine the environment (prod or gamma)
            const environment: string = window.location.hostname.includes('gamma') ? 'gamma' : 'prod';
            const apiUrlBase: string = `https://${environment}.cam.wfm.amazon.dev/api/`;

            // Define the API endpoint and headers for getting stores
            const headersStores: HeadersInit = {
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
                const storeIds: string[] = [];
                for (const region in storeData.storesInformation) {
                    const states = storeData.storesInformation[region];
                    for (const state in states) {
                        const stores = states[state];
                        stores.forEach((store: any) => {
                            console.log('Store:', store);
                            storeIds.push(store.storeTLC);
                        });
                    }
                }

                // Function to fetch items for a single store
                const fetchItemsForStore = (storeId: string, index: number): Promise<any[]> => {
                    const headersItems: HeadersInit = {
                        'accept': '*/*',
                        'accept-encoding': 'gzip, deflate, br',
                        'accept-language': 'en-US,en;q=0.9',
                        'content-type': 'application/x-amz-json-1.0',
                        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
                        'x-amz-target': 'WfmCamBackendService.GetItemsAvailability'
                    };

                    const payloadItems = {
                        "filterContext": {
                            "storeIds": [storeId]
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
                        credentials: 'include' // Include cookies in the request
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log(`Data for store ${storeId}:`, data);
                        return data.itemsAvailability.map((item: any) => {
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
                            return item;
                        });
                    })
                    .catch(error => {
                        console.error(`Error downloading data for store ${storeId}:`, error);
                        return [];
                    });
                };

                // Fetch items for all stores and compile results
                let completedStores = 0;
                const totalStores = storeIds.length;

                Promise.all(storeIds.map((storeId, index) =>
                    fetchItemsForStore(storeId, index).then(result => {
                        completedStores++;
                        const progressPercent = Math.round((completedStores / totalStores) * 100);
                        progress.innerHTML = `Compilinig Item Data: ${completedStores}/${totalStores} stores processed (${progressPercent}%)`;
                        return result;
                    })
                ))
                .then(results => {
                    const allItems = results.flat();
                    console.log('All items data:', allItems);

                    if (allItems.length > 0) {
                        // Specify the correct headers to include
                        const desiredHeaders = [
                            'andon', 'currentInventoryQuantity', 'hasAndonEnabledComponent',
                            'inventoryStatus', 'isMultiChannel', 'itemName', 'itemType',
                            'reservedQuantity', 'salesFloorCapacity', 'storeId', 'storeName',
                            'team', 'wfmScanCode', 'wfmoaReservedQuantity', 'multiChannelEndDate',
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
                    } else {
                        console.log('No items data available to download.');
                    }
                });
            })
            .catch(error => console.error('Error downloading data:', error));
        });

        // Add click event to the add new item(s) button
        addItemButton.addEventListener('click', function() {
            console.log('Add New Item(s) button clicked');
            alert('Coming Soon');
        });

        // Add click event to the activate/deactivate item(s) button
        activateButton.addEventListener('click', function() {
            console.log('Activate/Deactivate Item(s) button clicked');
            alert('Coming Soon');
        });

        // Add click event to the redrive button
        redriveButton.addEventListener('click', function() {
            console.log('Redrive button clicked');
            alert('Coming Soon');
        });
    }

    // Use MutationObserver to detect changes in the DOM
    const observer: MutationObserver = new MutationObserver(addButtonsAndProgress);
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial attempt to add the buttons and progress tracker
    addButtonsAndProgress();
})();
