(function() {
    'use strict';

    // Expose the function to the global scope for testing
    try {
        module.exports = {
            addDesyncFinderFunctionality
        };
    } catch (e) {
        // Handle the error if needed
    }

    function addDesyncFinderFunctionality() {
        console.log('Desync Finder button clicked');
        // Create overlay
        var overlay = document.createElement('div');
        overlay.id = 'desyncFinderOverlay';
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
            <h3>Desync Finder</h3>
            <input type="file" id="dailyInventoryFileInput" style="width: 100%; margin-bottom: 10px;" accept=".xlsx" placeholder="Daily Inventory Input">
            <input type="file" id="fullCAMDataFileInput" style="width: 100%; margin-bottom: 10px;" accept=".csv" placeholder="Full CAM Data">
            <button id="findDesyncIssuesButton" style="width: 100%; margin-bottom: 10px;" onclick="findDesyncIssues()">Find Desync Issues</button>
        `;

        formContainer.appendChild(closeButton);
        overlay.appendChild(formContainer);
        document.body.appendChild(overlay);
    }

    window.findDesyncIssues = function() {
        console.log('Button clicked, starting desync analysis...');
        // Step 1: Read the CAM Data
        const camFileInput = document.getElementById('fullCAMDataFileInput').files[0];
        const camReader = new FileReader();
        camReader.onload = function(event) {
            console.log('Reading CAM data...');
            const camData = XLSX.read(event.target.result, { type: 'binary', cellDates: true, cellStyles: true });
            console.log('CAM data read successfully.');
            const camSheet = camData.Sheets[camData.SheetNames[0]];
            const camJson = XLSX.utils.sheet_to_json(camSheet, { raw: false }).map(row => ({
                ...row,
                'Helper CAM': row['storeId'] + row['wfmScanCode']
            }));
            console.log("Cam Helper Column Complete")

            // Step 2: Read the Daily Inventory Data
            const diFileInput = document.getElementById('dailyInventoryFileInput').files[0];
            const diReader = new FileReader();
            diReader.onload = function(event) {
            console.log('Reading Daily Inventory data...');
            const diData = XLSX.read(event.target.result, { type: 'binary', cellDates: true, cellStyles: true });
            console.log('Daily Inventory data read successfully.');
                const diSheet = diData.Sheets['WFMOAC Inventory Data'];
                const diJson = XLSX.utils.sheet_to_json(diSheet, { raw: false }).map(row => ({
                    ...row,
                    'Helper DI': row['store_tlc'] + row['sku_wo_chck_dgt']
                }));
                console.log("Daily Invenotry Helper Column Complete")
                // Step 3: Filter CAM Data
                const filteredCamData = camJson.filter(camRow => diJson.some(diRow => diRow['Helper DI'] === camRow['Helper CAM']));

                // Step 4: Join Data using a Map for faster lookups
                const diMap = new Map(diJson.map(row => [row['Helper DI'], row]));
                const joinedData = filteredCamData.map(camRow => {
                    const diRow = diMap.get(camRow['Helper CAM']);
                    return diRow ? { ...camRow, ...diRow } : null;
                }).filter(row => row !== null);

                // Step 5: Identify Desyncs efficiently
                console.log('Identifying desyncs...');
                const desyncs = joinedData.reduce((acc, row) => {
                    if ((row['andon'] === 'Disabled' && row['listing_status'] === 'Inactive') ||
                        (row['andon'] === 'Enabled' && row['listing_status'] === 'Active')) {
                        acc.push(row);
                    }
                    return acc;
                }, []);

                // Step 6: Output Results
                if (desyncs.length > 0) {
                    const ws = XLSX.utils.json_to_sheet(desyncs);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Desynced Items');
                    XLSX.writeFile(wb, 'Desynced_Items.xlsx');
                    console.log('Desynced items file created and downloaded.');
                } else {
                    console.log('No desyncs found.');
                }
            };
            diReader.readAsBinaryString(diFileInput);
        };
        camReader.readAsBinaryString(camFileInput);
    }

    // Attach event listener to the Desync Finder button
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                const desyncFinder = document.getElementById('desyncFinderButton');
                if (desyncFinder) {
                    desyncFinder.addEventListener('click', addDesyncFinderFunctionality);
                    observer.disconnect(); // Stop observing once the button is found
                }
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
