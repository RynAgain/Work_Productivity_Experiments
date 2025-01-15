(function () {
    'use strict';

    // Function to get Merchant ID from Store Code
    function getMerchantIDFromStoreCode() {
        // Create overlay
        var overlay = document.createElement('div');
        overlay.id = 'merchantIdOverlay';
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

        // Create close button
        var closeButton = document.createElement('span');
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
        closeButton.addEventListener('click', function () {
            document.body.removeChild(overlay);
        });

        // Container for the form
        var formContainer = document.createElement('div');
        formContainer.style.position = 'relative';
        formContainer.style.backgroundColor = '#fff';
        formContainer.style.padding = '20px';
        formContainer.style.borderRadius = '5px';
        formContainer.style.width = '300px';

        // Create form elements
        formContainer.innerHTML = `
            <h3>Get Merchant ID from Store Code</h3>
            <label>Store Code</label>
            <input type="text" id="storeCodeInput" style="width: 100%; margin-bottom: 10px;" placeholder="Enter 3-letter store code">
            <button id="getMerchantIdButton" style="width: 100%; margin-bottom: 10px;">Get Merchant ID</button>
            <div id="merchantIdOutput" style="width: 100%; height: 50px; border: 1px solid #ccc; padding: 10px; overflow-y: auto;"></div>
        `;

        formContainer.appendChild(closeButton);
        overlay.appendChild(formContainer);
        document.body.appendChild(overlay);

        // Event listener for the "Get Merchant ID" button
        document.getElementById('getMerchantIdButton').addEventListener('click', function () {
            const storeCode = document.getElementById('storeCodeInput').value.trim().toUpperCase();
            const storeCodePattern = /^[A-Z]{3}$/;
            if (!storeCodePattern.test(storeCode)) {
                console.error('[GetMerchantIDFromStoreCode.js] Store code is empty or invalid.');
                document.getElementById('merchantIdOutput').innerText = 'Invalid store code. Please enter a valid code.';
                return;
            }
            console.log('[GetMerchantIDFromStoreCode.js] Store Code:', storeCode);
            console.log('Getting Merchant ID for Store Code:', storeCode);

            // Determine the environment (prod or gamma)
            const environment = window.location.hostname.includes('gamma') ? 'gamma' : 'prod';
            const apiUrlBase = `https://${environment}.cam.wfm.amazon.dev/api/`;

            // Define the API endpoint and headers for getting items
            const headersItems = {
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.9',
                'content-type': 'application/x-amz-json-1.0',
                'x-amz-target': 'WfmCamBackendService.GetItemsAvailability'
            };

            const payloadItems = {
                "filterContext": {
                    "storeIds": [storeCode]
                },
                "paginationContext": {
                    "pageNumber": 0,
                    "pageSize": 10000
                }
            };

            // Fetch all store items
            fetch(apiUrlBase, {
                method: 'POST',
                headers: headersItems,
                body: JSON.stringify(payloadItems),
                credentials: 'include' // Include cookies in the request
            })
            .then(response => response.json())
            .then(data => {
                console.log('[GetMerchantIDFromStoreCode.js] Items data received:', data);
                const items = data.itemsAvailability;
                if (!items || items.length === 0) {
                    throw new Error('No items found for this store code.');
                }
                // Pick a random PLU
                const randomPLU = items[Math.floor(Math.random() * items.length)].wfmScanCode;
                console.log('Random PLU selected:', randomPLU);

                // Use the random PLU to get Merchant ID
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
                    'Referer': `https://${environment}.cam.wfm.amazon.dev/store/${storeCode}/item/${randomPLU}`,
                    'Referrer-Policy': 'strict-origin-when-cross-origin'
                };
                const payloadMerchant = {
                    storeId: storeCode,
                    wfmScanCode: randomPLU
                };

                return fetch(merchantApiUrl, {
                    method: 'POST',
                    headers: headersMerchant,
                    body: JSON.stringify(payloadMerchant),
                    credentials: 'include' // Include cookies in the request
                });
            })
            .then(response => response.json())
            .then(data => {
                console.log('[GetMerchantIDFromStoreCode.js] Merchant ID data received:', data);
                console.log('[GetMerchantIDFromStoreCode.js] Merchant ID:', data.wfmoaMerchantId);
                document.getElementById('merchantIdOutput').innerText = `Merchant ID: ${data.wfmoaMerchantId}`;
            })
            .catch(error => {
                console.error('[GetMerchantIDFromStoreCode.js] Error fetching Merchant ID:', error);
                document.getElementById('merchantIdOutput').innerText = 'Error fetching Merchant ID';
            });
        });

    }

    // Use MutationObserver to detect when the button is added to the DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                const getMerchantIdButton = document.getElementById('getMerchantIdButton');
                if (getMerchantIdButton) {
                    getMerchantIdButton.addEventListener('click', getMerchantIDFromStoreCode);
                    observer.disconnect(); // Stop observing once the button is found
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

})();
