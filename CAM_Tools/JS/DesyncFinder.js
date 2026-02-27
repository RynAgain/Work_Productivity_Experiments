(function() {
    'use strict';

    // Expose the function to the global scope for testing, wrap in a try so that it doesn't crash Tampermonkey
    try {
        module.exports = {
            addDesyncFinderFunctionality
        };
    } catch (e) {
        // Handle the error if needed
    }

    function addDesyncFinderFunctionality() {
        console.log('[DesyncFinder] Button clicked');
        // Create overlay
        var overlay = document.createElement('div');
        overlay.id = 'desyncFinderOverlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        overlay.style.zIndex = '9995';
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
        formContainer.style.backgroundColor = '#1a1a1a';
        formContainer.style.color = '#f1f1f1';
        formContainer.style.padding = '20px';
        formContainer.style.borderRadius = '5px';
        formContainer.style.width = '300px';

        // Create form elements
        formContainer.innerHTML = `
            <h3>Desync Finder</h3>
            <label for="dailyInventoryFileInput">Daily Inventory File (.xlsx):</label>
            <input type="file" id="dailyInventoryFileInput" style="width: 100%; margin-bottom: 10px;" accept=".xlsx">
            <label for="fullCAMDataFileInput">Full CAM Data File (.csv):</label>
            <input type="file" id="fullCAMDataFileInput" style="width: 100%; margin-bottom: 10px;" accept=".csv">
            <button id="findDesyncIssuesButton" style="width: 100%; margin-bottom: 10px;" onclick="findDesyncIssues()">Find Desync Issues</button>
            <div id="statusMessage" style="margin-top: 10px; text-align: center; font-size: 14px; color: #004E36;"></div>
        `;

        formContainer.appendChild(closeButton);
        overlay.appendChild(formContainer);
        document.body.appendChild(overlay);
    }

    // Make this globally visible so the button can call it
    window.findDesyncIssues = function() {
        const statusMessage = document.getElementById('statusMessage');
        statusMessage.innerText = 'Processing...';
        console.log('Button clicked, starting desync analysis...');

        // Utility to read file async
        const readFileAsync = (file, isCsv = false) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                // If it's a CSV, read as text. For XLSX, read as binary.
                if (isCsv) {
                    reader.readAsText(file);
                } else {
                    reader.readAsBinaryString(file);
                }
            });
        };

        const processFiles = async () => {
            try {
                // Step 1: Read the CAM (CSV) data
                console.log('Reading CAM data...');
                statusMessage.innerText = 'Reading CAM data...';
                const camFileInput = document.getElementById('fullCAMDataFileInput').files[0];
                const camFileContents = await readFileAsync(camFileInput, true /* isCsv */);
                const camData = XLSX.read(camFileContents, {
                    type: 'string', // since it's CSV
                    raw: true,      // faster, no format conversions
                    cellDates: true,
                    cellStyles: true
                });
                statusMessage.innerText = 'CAM data read successfully.';

                console.log('Processing CAM data...');
                statusMessage.innerText = 'Processing CAM data...';
                const camSheet = camData.Sheets[camData.SheetNames[0]];
                const camJson = XLSX.utils.sheet_to_json(camSheet, { raw: true })
                    .map(row => ({
                        ...row,
                        // Construct "Helper CAM" for matching
                        'Helper CAM': row['storeId'] + row['wfmScanCode']
                    }));
                console.log("Cam Helper Column Complete");
                statusMessage.innerText = 'Cam Helper Column Complete';

                // Step 2: Read the Daily Inventory (XLSX) data
                console.log('Reading Daily Inventory data...');
                statusMessage.innerText = 'Reading Daily Inventory data...';
                const diFileInput = document.getElementById('dailyInventoryFileInput').files[0];
                const diFileContents = await readFileAsync(diFileInput, false /* isCsv */);
                const diData = XLSX.read(diFileContents, {
                    type: 'binary',
                    raw: true,
                    cellDates: true,
                    cellStyles: true
                });
                statusMessage.innerText = 'Daily Inventory data read successfully.';

                console.log('Processing Daily Inventory data...');
                statusMessage.innerText = 'Processing Daily Inventory data...';
                const diSheet = diData.Sheets['WFMOAC Inventory Data'];
                const diJson = XLSX.utils.sheet_to_json(diSheet, { raw: true })
                    .map(row => ({
                        ...row,
                        // Construct "Helper DI" for matching
                        'Helper DI': row['store_tlc'] + row['sku_wo_chck_dgt']
                    }));
                console.log("Daily Inventory Helper Column Complete");
                statusMessage.innerText = 'Daily Inventory Helper Column Complete';

                // Step 3: Build a map from daily inventory data for faster lookup
                const diMap = new Map(diJson.map(row => [row['Helper DI'], row]));

                // Step 4: Join data in a single pass (avoid filter(...some(...)) which is O(n*m))
                const joinedData = [];
                for (const camRow of camJson) {
                    const diRow = diMap.get(camRow['Helper CAM']);
                    if (diRow) {
                        // If we found a matching daily-inventory row, merge them
                        joinedData.push({ ...camRow, ...diRow });
                    }
                }

                // Step 5: Identify desyncs
                console.log('Identifying desyncs...');
                statusMessage.innerText = 'Identifying desyncs...';

                // NOTE: The condition here might look "backwards" but is presumably correct for your logic.
                const desyncs = joinedData.reduce((acc, row) => {
                    // This condition flags items that are "in sync" if we read it plainly,
                    // but the script's naming is reversed, so we keep it as-is if you say it is correct.
                    if (
                        (row['andon'] === 'Disabled' && row['listing_status'] === 'Inactive') ||
                        (row['andon'] === 'Enabled' && row['listing_status'] === 'Active')
                    ) {
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
                    statusMessage.innerText = 'Desynced items file created and downloaded.';
                } else {
                    console.log('No desyncs found.');
                    statusMessage.innerText = 'No desyncs found.';
                }
            } catch (error) {
                console.error('Error processing files:', error);
                statusMessage.innerText = 'Error processing files.';
            }
        };

        processFiles();
    };

    // Attach event listener to the Desync Finder button when it appears
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