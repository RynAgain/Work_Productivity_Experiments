(function () {
    'use strict';

    // SVG icon for the quick tools menu
    const editorIcon = `
        <svg width="22" height="22" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <path d="M12 19l7-7 3 3-7 7-3-3z" fill="#004E36" stroke="#fff" stroke-width="1.5"/>
            <path d="M18 13l-6 6M2 12l6 6M3 3l18 18" stroke="#fff" stroke-width="1.5"/>
        </svg>
    `;

    // Function to open the Existing Item Editor
    function openExistingItemEditor() {
        console.log('Opening Existing Item Editor');

        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'editorOverlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.background = 'rgba(0,0,0,0.5)';
        overlay.style.zIndex = '1001';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';

        // Container for x-spreadsheet
        const container = document.createElement('div');
        container.style.width = '80vw';
        container.style.height = '80vh';
        container.style.background = '#fff';
        container.style.borderRadius = '12px';
        container.style.overflow = 'hidden';
        container.style.boxShadow = '0 8px 32px rgba(0,0,0,0.18), 0 1.5px 6px rgba(0,78,54,0.10)';

        // Initialize Handsontable
        const hot = new Handsontable(container, {
            data: [],
            rowHeaders: true,
            colHeaders: true,
            contextMenu: true,
            width: '100%',
            height: '100%',
            licenseKey: 'non-commercial-and-evaluation' // for non-commercial use
        });

        // Load data into spreadsheet
        fetchData().then(data => {
            sheet.loadData(data);
        });

        // Append container to overlay
        overlay.appendChild(container);
        document.body.appendChild(overlay);

        // Close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '&times;';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '10px';
        closeButton.style.fontSize = '24px';
        closeButton.style.cursor = 'pointer';
        closeButton.onclick = () => document.body.removeChild(overlay);
        container.appendChild(closeButton);

        // Input for file name
        const fileNameInput = document.createElement('input');
        fileNameInput.type = 'text';
        fileNameInput.placeholder = 'Enter file name';
        fileNameInput.style.position = 'absolute';
        fileNameInput.style.bottom = '50px';
        fileNameInput.style.right = '10px';
        fileNameInput.style.fontSize = '16px';
        fileNameInput.style.padding = '5px';
        container.appendChild(fileNameInput);

        // Download button
        const downloadButton = document.createElement('button');
        downloadButton.innerHTML = 'Download CSV';
        downloadButton.style.position = 'absolute';
        downloadButton.style.bottom = '10px';
        downloadButton.style.right = '10px';
        downloadButton.style.fontSize = '16px';
        downloadButton.style.cursor = 'pointer';
        downloadButton.onclick = () => {
            const fileName = fileNameInput.value.trim() || 'ExistingCamItems.csv';
            downloadCSV(sheet.getData(), fileName);
        };
        container.appendChild(downloadButton);

        // Upload button
        const uploadButton = document.createElement('button');
        uploadButton.innerHTML = 'Upload';
        uploadButton.style.position = 'absolute';
        uploadButton.style.bottom = '10px';
        uploadButton.style.right = '100px';
        uploadButton.style.fontSize = '16px';
        uploadButton.style.cursor = 'pointer';
        uploadButton.onclick = () => uploadData(sheet.getData());
        container.appendChild(uploadButton);
    }

    // Function to fetch data using API logic from RedriveButton
    function fetchData() {
        return new Promise((resolve, reject) => {
            const environment = window.location.hostname.includes('gamma') ? 'gamma' : 'prod';
            const apiUrlBase = `https://${environment}.cam.wfm.amazon.dev/api/`;

            const headersStores = {
                'accept': '*/*',
                'accept-encoding': 'gzip, deflate, br',
                'accept-language': 'en-US,en;q=0.9',
                'content-type': 'application/x-amz-json-1.0',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
                'x-amz-target': 'WfmCamBackendService.GetStoresInformation'
            };

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

                // Fetch items for all stores
                Promise.all(storeIds.map(storeId => fetchItemsForStore(storeId)))
                    .then(results => {
                        const allItems = results.flat();
                        resolve(allItems);
                    });
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                reject(error);
            });
        });
    }

    function fetchItemsForStore(storeId) {
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
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            return data.itemsAvailability.map(item => ({
                'Store - 3 Letter Code': storeId,
                'Item Name': item.itemName,
                'Item PLU/UPC': item.wfmScanCode,
                'Availability': item.inventoryStatus,
                'Current Inventory': item.inventoryStatus === 'Unlimited' ? "0" : (Math.max(0, Math.min(10000, parseInt(item.currentInventoryQuantity) || 0))).toString(),
                'Sales Floor Capacity': '',
                'Tracking Start Date': '',
                'Tracking End Date': ''
            }));
        })
        .catch(error => {
            console.error(`Error fetching items for store ${storeId}:`, error);
            return [];
        });
    }

    // Function to download data as CSV
    function downloadCSV(data, fileName) {
        console.log('Downloading CSV', data);
        const csvContent = data.map(row =>
            Object.values(row).map(value => `"${value}"`).join(",")
        ).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "spreadsheet_data.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Function to upload data
    function uploadData(data) {
        console.log('Uploading data', data);
        // Implement data upload logic
    }

    // Expose for Settings.js quick tools integration
    try {
        module.exports = { openExistingItemEditor, editorIcon };
    } catch (e) {
        window.openExistingItemEditor = openExistingItemEditor;
        window.editorIcon = editorIcon;
    }
})();