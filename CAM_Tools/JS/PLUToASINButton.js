(function () {
    'use strict';
  
    // Expose the function to the global scope for testing
    try {
        module.exports = {
            addPLUToASINFunctionality
        };
    } catch (e) {
        // Handle the error if needed
    }

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
        <h3>PLU to ASIN</h3>
        <label>Store Code</label>
        <input type="text" id="storeCodeInput" style="width: 100%; margin-bottom: 10px;" placeholder="Enter 3-letter store code">
        <label>PLU(s)</label>
        <input type="text" id="pluInput" style="width: 100%; margin-bottom: 10px;" placeholder="Enter PLU(s) separated by commas">
        <button id="convertButton" style="width: 100%; margin-bottom: 10px;">Convert</button>
        <div id="outputTable" style="width: 100%; height: 200px; border: 1px solid #ccc; padding: 10px; overflow-y: auto;"></div>
        <button id="exportCsvButton" style="width: 100%; margin-top: 10px;">Export to CSV</button>
      `;
  
      formContainer.appendChild(closeButton);
      overlay.appendChild(formContainer);
      document.body.appendChild(overlay);
  
      // Event listener for the "Convert" button
      document.getElementById('convertButton').addEventListener('click', function () {
        const storeCode = document.getElementById('storeCodeInput').value.trim();
        const pluInput = document.getElementById('pluInput').value;
        const pluCodes = pluInput.split(',').map(plu => plu.trim()).filter(plu => plu !== '');
  
        // Detect gamma or prod environment
        const apiUrlBase = `https://${window.location.hostname.includes('gamma') ? 'gamma' : 'prod'}.cam.wfm.amazon.dev/api/`;
  
        Promise.all(
          pluCodes.map(plu => {
            const payload = { storeId: storeCode, wfmScanCode: plu };
            console.log('Payload:', payload);
  
            return fetch(apiUrlBase, {
              method: 'POST',
              headers: {
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.9',
                // 'amz-sdk-invocation-id': '4e6108fd-1eee-4e74-afc3-c9f68d0237c1', // if required, uncomment
                'amz-sdk-request': 'attempt=1; max=1',
                'content-type': 'application/x-amz-json-1.0',
                'sec-ch-ua': '"Microsoft Edge";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'x-amz-user-agent': 'aws-sdk-js/0.0.1 os/Windows/NT_10.0 lang/js md/browser/Microsoft_Edge_131.0.0.0',
                'Referer': `https://prod.cam.wfm.amazon.dev/store/${storeCode}/item/${plu}`,
                'Referrer-Policy': 'strict-origin-when-cross-origin',
                'x-amz-target': 'WfmCamBackendService.GetItemAvailability'
              },
              body: JSON.stringify(payload),
              credentials: 'include' // Ensure cookies/certs are sent with the request
            })
              .then(response => {
                console.log('Response:', response);
                return response.json();
              })
              .then(data => {
                console.log('Data:', data);
                console.log('Item Availability:', data.itemAvailability);
                
                // If itemAvailability isn't present, fallback:
                if (!data.itemAvailability) {
                  return {
                    plu,
                    asin: 'error',
                    merchantId: 'error',
                    currentInventoryQuantity: 'error',
                    itemName: 'error'
                  };
                }
  
                // Return only the relevant fields
                return {
                  plu,
                  asin: data.itemAvailability.asin || 'error',
                  merchantId: data.itemAvailability.merchantId || 'error',
                  currentInventoryQuantity: data.itemAvailability.currentInventoryQuantity || 'error',
                  itemName: data.itemAvailability.itemName || 'error'
                };
              })
              .catch(err => {
                console.error(`Fetch error for PLU "${plu}":`, err);
                return {
                  plu,
                  asin: 'error',
                  merchantId: 'error',
                  currentInventoryQuantity: 'error',
                  itemName: 'error'
                };
              });

          })
        ).then(results => {
          document.getElementById('exportCsvButton').addEventListener('click', function () {
            const csvContent = "data:text/csv;charset=utf-8,"
              + ["PLU,ASIN,Merchant ID,Item Name"]
              .concat(results.map(result => `${result.plu},${result.asin},${result.merchantId},${result.itemName}`))
              .join("\n");

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "plu_to_asin_data.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          });

          // Build the table content with the 5 columns
          const tableContent = results
            .map(result => `
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px; text-align: left;">${result.plu}</td>
                <td style="padding: 8px; text-align: left;">${result.asin}</td>
              </tr>
            `)
            .join('');
  
          document.getElementById('outputTable').innerHTML = `
            <table style="width: auto; border-collapse: collapse; table-layout: auto;">
              <thead>
                <tr style="border-bottom: 2px solid #ddd;">
                  <th style="padding: 8px; text-align: left;">PLU</th>
                  <th style="padding: 8px; text-align: left;">ASIN</th>
                </tr>
              </thead>
              <tbody>
                ${tableContent}
              </tbody>
            </table>
          `;
        });
      });
    }
  
    // Use MutationObserver to detect when the button is added to the DOM
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
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
