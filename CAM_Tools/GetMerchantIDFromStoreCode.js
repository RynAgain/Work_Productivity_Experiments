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
            console.log('Getting Merchant ID for Store Code:', storeCode);

            // Fetch all store items
            const itemsApiUrl = `https://example.com/api/getItemsAvailability?storeCode=${storeCode}`;
            fetch(itemsApiUrl, {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                    'content-type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                const items = data.items;
                if (items.length === 0) {
                    throw new Error('No items found for this store code.');
                }
                // Pick a random PLU
                const randomPLU = items[Math.floor(Math.random() * items.length)].plu;
                console.log('Random PLU selected:', randomPLU);

                // Use the random PLU to get Merchant ID
                const merchantApiUrl = `https://example.com/api/getItemAvailability?storeCode=${storeCode}&plu=${randomPLU}`;
                return fetch(merchantApiUrl, {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'content-type': 'application/json'
                    }
                });
            })
            .then(response => response.json())
            .then(data => {
                console.log('Merchant ID:', data.merchantId);
                document.getElementById('merchantIdOutput').innerText = `Merchant ID: ${data.merchantId}`;
            })
            .catch(error => {
                console.error('Error:', error);
                document.getElementById('merchantIdOutput').innerText = 'Error fetching Merchant ID';
            });
        });

        // Define the API endpoint
        const apiUrl = `https://example.com/api/getMerchantId?storeCode=${storeCode}`;

        // Fetch the Merchant ID
        fetch(apiUrl, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log('Merchant ID:', data.merchantId);
            // Display the Merchant ID or handle it as needed
        })
        .catch(error => {
            console.error('Error fetching Merchant ID:', error);
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
