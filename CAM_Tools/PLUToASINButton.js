(function() {
    'use strict';

    // Function to add the PLU to ASIN button functionality
    function addPLUToASINFunctionality() {
        console.log('PLU to ASIN button clicked');
        // Create overlay
        var overlay = document.createElement('div');
        overlay.id = 'pluToAsinOverlay';
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
        closeButton.addEventListener('click', function() {
            document.body.removeChild(overlay);
        });

        var formContainer = document.createElement('div');
        formContainer.style.position = 'relative';
        formContainer.style.backgroundColor = '#fff';
        formContainer.style.padding = '20px';
        formContainer.style.borderRadius = '5px';
        formContainer.style.width = '300px';

        // Create form elements
        formContainer.innerHTML = `
            <h3>PLU to ASIN</h3>
            <label>Store Code</label>
            <input type="text" id="storeCodeInput" style="width: 100%; margin-bottom: 10px;" placeholder="Enter 3-letter store code">
            <label>PLU(s)</label>
            <input type="text" id="pluInput" style="width: 100%; margin-bottom: 10px;" placeholder="Enter PLU(s) separated by commas">
            <button id="convertButton" style="width: 100%; margin-bottom: 10px;">Convert</button>
            <div id="outputTable" style="width: 100%; height: 200px; border: 1px solid #ccc; padding: 10px; overflow-y: auto;"></div>
        `;

        formContainer.appendChild(closeButton);
        overlay.appendChild(formContainer);
        document.body.appendChild(overlay);

        // Add event listener to the "Convert" button
        document.getElementById('convertButton').addEventListener('click', function() {
            const storeCode = document.getElementById('storeCodeInput').value.trim();
            const pluInput = document.getElementById('pluInput').value;
            const pluCodes = pluInput.split(',').map(plu => plu.trim()).filter(plu => plu !== '');

            const apiUrlBase = `https://\${window.location.hostname.includes('gamma') ? 'gamma' : 'prod'}.cam.wfm.amazon.dev/api/`;

            Promise.all(pluCodes.map(plu => {
                const payload = { storeId: storeCode, wfmScanCode: plu };
                return fetch(apiUrlBase, {
                    method: 'POST',
                    headers: {
                        'accept': '*/*',
                        'accept-encoding': 'gzip, deflate, br',
                        'accept-language': 'en-US,en;q=0.9',
                        'content-type': 'application/x-amz-json-1.0',
                        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
                        'x-amz-target': 'WfmCamBackendService.GetItemAvailability'
                    },
                    body: JSON.stringify(payload),
                    credentials: 'include'
                })
                .then(response => response.json())
                .then(data => ({
                    plu,
                    asin: data.asin || 'error',
                    wfmoaMerchantId: data.wfmoaMerchantId || 'error'
                }))
                .catch(() => ({
                    plu,
                    asin: 'error',
                    wfmoaMerchantId: 'error'
                }));
            }))
            .then(results => {
                const tableContent = results.map(result => `
                    <tr>
                        <td>\${result.plu}</td>
                        <td>\${result.asin}</td>
                        <td>\${result.wfmoaMerchantId}</td>
                    </tr>
                `).join('');
                document.getElementById('outputTable').innerHTML = `
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr>
                                <th>PLU</th>
                                <th>ASIN</th>
                                <th>Merchant ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            \${tableContent}
                        </tbody>
                    </table>
                `;
            });
        });
    }

    // Use MutationObserver to detect when the button is added to the DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                const pluToAsinButton = document.getElementById('pluToAsinButton');
                if (pluToAsinButton) {
                    pluToAsinButton.addEventListener('click', addPLUToASINFunctionality);
                    observer.disconnect(); // Stop observing once the button is found
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
