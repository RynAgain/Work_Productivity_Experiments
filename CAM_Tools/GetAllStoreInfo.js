(function () {
    'use strict';

    // Function to get all store information
    function getAllStoreInfo() {
        console.log('[GetAllStoreInfo.js] Get All Store Info button clicked');
        try {
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
                console.log('[GetAllStoreInfo.js] Store data received:', storeData);

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
                            console.log('[GetAllStoreInfo.js] Store:', store);
                            const regionParts = region.split('-');
                            const regionCode = regionParts[regionParts.length - 1]; // Extract short region code
                            storeIds.push({ storeTLC: store.storeTLC, region: regionCode });
                        });
                    }
                }

                // Function to fetch merchant IDs for a single store
                const fetchMerchantIdsForStore = (store) => {
                    const headersItems = {
                        'accept': '*/*',
                        'accept-language': 'en-US,en;q=0.9',
                        'content-type': 'application/x-amz-json-1.0',
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
                        console.log(`[GetAllStoreInfo.js] Data for store ${storeId}:`, data);
                        const items = data.itemsAvailability;
                        if (!items || items.length === 0) {
                            throw new Error('No items found for this store code.');
                        }
                        // Predefined PLUs to try
                        const pluList = ['122415', '120998', '124017', '124165', '124017'];

                        // Function to attempt fetching merchant ID with a PLU
                        const tryFetchMerchantId = (pluIndex = 0) => {
                            if (pluIndex >= pluList.length) {
                                throw new Error(`Error in merchant ID gathering at ${store.storeTLC} Store`);
                            }

                            const plu = pluList[pluIndex];
                            console.log('[GetAllStoreInfo.js] Trying PLU:', plu);

                            const merchantApiUrl = apiUrlBase;
                            const headersMerchant = {
                                'accept': '*/*',
                                'accept-language': 'en-US,en;q=0.9',
                                'content-type': 'application/x-amz-json-1.0',
                                'x-amz-target': 'WfmCamBackendService.GetItemAvailability',
                                'amz-sdk-request': 'attempt=1; max=1',
                                'sec-ch-ua': '"Microsoft Edge";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                                'sec-ch-ua-mobile': '?0',
                                'sec-ch-ua-platform': '"Windows"',
                                'sec-fetch-dest': 'empty',
                                'sec-fetch-mode': 'cors',
                                'sec-fetch-site': 'same-origin',
                                'x-amz-user-agent': 'aws-sdk-js/0.0.1 os/Windows/NT_10.0 lang/js md/browser/Microsoft_Edge_131.0.0.0',
                                'Referer': `https://\${environment}.cam.wfm.amazon.dev/store/\${store.storeTLC}/item/\${plu}`,
                                'Referrer-Policy': 'strict-origin-when-cross-origin'
                            };
                            const payloadMerchant = {
                                storeId: store.storeTLC,
                                wfmScanCode: plu
                            };

                            return fetch(merchantApiUrl, {
                                method: 'POST',
                                headers: headersMerchant,
                                body: JSON.stringify(payloadMerchant),
                                credentials: 'include' // Include cookies in the request
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (!data.itemAvailability || !data.itemAvailability.merchantId) {
                                    console.log('[GetAllStoreInfo.js] PLU failed, trying next:', plu);
                                    return tryFetchMerchantId(pluIndex + 1);
                                }
                                console.log('[GetAllStoreInfo.js] Merchant ID data received:', data);
                                return { 
                                    storeId: store.storeTLC,
                                    region: store.region,
                                    merchantId: data.itemAvailability.merchantId,
                                    wfmoaMerchantId: data.itemAvailability.wfmoaMerchantId
                                };
                            });
                        };

                        return tryFetchMerchantId();
                    })
                    .catch(error => {
                        console.error(`[GetAllStoreInfo.js] Error fetching data for store ${storeId}:`, error);
                        return { 
                            storeId: store.storeTLC,
                            region: store.region,
                            merchantId: 'error',
                            wfmoaMerchantId: 'error'
                        };
                    });
                };

                // Fetch merchant IDs for all stores and compile results
                let completedStores = 0;
                const totalStores = storeIds.length;

                Promise.all(storeIds.map((storeId, index) => {
                    return new Promise(resolve => setTimeout(resolve, index * 500)) // Wait 0.5 seconds between requests
                    .then(() => fetchMerchantIdsForStore(storeId))
                    .then(result => {
                        completedStores++;
                        const progressPercent = Math.round((completedStores / totalStores) * 100);
                        console.log(`[GetAllStoreInfo.js] Progress: ${progressPercent}%`);
                        return result;
                    });
                }))
                .then(results => {
                    console.log('[GetAllStoreInfo.js] All store info:', results);

                    // Generate CSV content
                    const csvContent = "data:text/csv;charset=utf-8,"
                        + ["Store ID,Merchant ID,WFMOA Merchant ID"]
                        .concat(results.map(result => `${result.storeId},${result.region},${result.merchantId},${result.wfmoaMerchantId}`))
                        .join("\n");

                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "store_info.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    console.log('[GetAllStoreInfo.js] Downloading Now!');
                });
            })
            .catch(error => console.error('[GetAllStoreInfo.js] Get Store data Crashed:', error));
        } catch (error) {
            console.error('[GetAllStoreInfo.js] Get Store data Crashed:', error);
        }
    }

    // Use MutationObserver to detect when the button is added to the DOM
    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.addedNodes.length) {
                const getAllStoreInfoButton = document.getElementById('getAllStoreInfoButton');
                if (getAllStoreInfoButton) {
                    getAllStoreInfoButton.addEventListener('click', getAllStoreInfo);
                    observer.disconnect(); // Stop observing once the button is found
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
