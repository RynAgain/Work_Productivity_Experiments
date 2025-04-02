(function() {
    'use strict';

    // Expose the function to the global scope for testing
    try {
        module.exports = {
            addATCPropagationToolButton
        };
    } catch (e) {
        // Handle the error if needed
    }

    function attachATCPropagationToolButtonListener() {
        const atcpropButton = document.getElementById('atcpropButton');
        if (atcpropButton) {
            atcpropButton.addEventListener('click', function() {
                addATCPropagationToolButton();
            });
        }
    }

    // Use MutationObserver to detect changes in the DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                attachATCPropagationToolButtonListener();
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Initial attempt to add the ATC Propagation Tool button
    attachATCPropagationToolButtonListener();

    function addATCPropagationToolButton() {
        console.log('ATC Propagation Tool button clicked');
        // Check if the button already exists
        const atcButton = document.getElementById('atcpropButton');
        if (atcButton) {
            console.log('ATC Propagation Tool button already exists');
            return;
        }

        // Create the ATC Propagation Tool button
        const newButton = document.createElement('button');
        newButton.id = 'atcpropButton';
        newButton.innerHTML = 'ATC Propagation Tool';
        newButton.className = 'button';
        newButton.style.position = 'fixed';
        newButton.style.bottom = '0';
        newButton.style.left = '50%';
        newButton.style.width = '20%';
        newButton.style.height = '40px';
        newButton.style.zIndex = '1000';

        // Append the button to the body
        document.body.appendChild(newButton);
        console.log('ATC Propagation Tool button added to the page');

        // Add click event to the ATC Propagation Tool button
        newButton.addEventListener('click', function() {
            console.log('ATC Propagation Tool button clicked');
            // Create overlay
            var overlay = document.createElement('div');
            overlay.id = 'atcPropagationToolOverlay';
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
            formContainer.style.width = '400px';

            // Create form elements
            formContainer.innerHTML = `
                <h3>ATC Propagation Tool</h3>
                <label for="inputFile1">Input File 1 (.xlsx, .csv)</label>
                <input type="file" id="inputFile1" accept=".xlsx, .csv" style="width: 100%; margin-bottom: 10px;">
                <label for="inputFile2">Input File 2 (.xlsx, .csv)</label>
                <input type="file" id="inputFile2" accept=".xlsx, .csv" style="width: 100%; margin-bottom: 10px;">
                <label for="customFileName">Custom File Name (optional)</label>
                <input type="text" id="customFileName" placeholder="Enter custom file name" style="width: 100%; margin-bottom: 10px;">
                <button id="processFilesButton" style="width: 100%; margin-bottom: 10px;">Process Files</button>
                <div id="statusMessage" style="text-align: center; font-size: 14px; color: #004E36;"></div>
            `;

            formContainer.appendChild(closeButton);
            overlay.appendChild(formContainer);
            document.body.appendChild(overlay);

            document.getElementById('processFilesButton').addEventListener('click', function() {
                const inputFile1 = document.getElementById('inputFile1').files[0];
                const inputFile2 = document.getElementById('inputFile2').files[0];
                const statusMessage = document.getElementById('statusMessage');

                if (!inputFile1 || !inputFile2) {
                    statusMessage.innerText = 'Please select both files.';
                    return;
                }

                statusMessage.innerText = 'Processing...';

                // Read and process the input files
                const reader1 = new FileReader();
                reader1.onload = function(event) {
                    const data1 = new Uint8Array(event.target.result);
                    const workbook1 = XLSX.read(data1, { type: 'array' });
                    const sheet1 = workbook1.Sheets[workbook1.SheetNames[0]];
                    const dataJson1 = XLSX.utils.sheet_to_json(sheet1);

                    const reader2 = new FileReader();
                    reader2.onload = function(event) {
                        const data2 = new Uint8Array(event.target.result);
                        const workbook2 = XLSX.read(data2, { type: 'array' });
                        const sheet2 = workbook2.Sheets[workbook2.SheetNames[0]];
                        const dataJson2 = XLSX.utils.sheet_to_json(sheet2);

                        // Process the data from both files
                        const result = processData(dataJson1, dataJson2);

                        // Create and download the result as an xlsx file
                        const resultSheet = XLSX.utils.json_to_sheet(result);
                        const resultWorkbook = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(resultWorkbook, resultSheet, 'Results');
                        const customFileName = document.getElementById('customFileName').value.trim();
                        const fileName = customFileName ? customFileName + '.xlsx' : 'ATC_Propagation_Results.xlsx';
                        XLSX.writeFile(resultWorkbook, fileName);

                        statusMessage.innerText = 'Processing complete. File downloaded.';
                    };
                    reader2.readAsArrayBuffer(inputFile2);
                };
                reader1.readAsArrayBuffer(inputFile1);
            });
        });

        // Create the ATC Propagation Tool button
        const atcButton = document.createElement('button');
        atcButton.id = 'atcpropButton';
        atcButton.innerHTML = 'ATC Propagation Tool';
        atcButton.className = 'button';
        atcButton.style.position = 'fixed';
        atcButton.style.bottom = '0';
        atcButton.style.left = '50%';
        atcButton.style.width = '20%';
        atcButton.style.height = '40px';
        atcButton.style.zIndex = '1000';

        // Append the button to the body
        document.body.appendChild(atcButton);
        console.log('ATC Propagation Tool button added to the page');

        // Add click event to the ATC Propagation Tool button
        atcButton.addEventListener('click', function() {
            console.log('ATC Propagation Tool button clicked');
            // Create overlay
            var overlay = document.createElement('div');
            overlay.id = 'atcPropagationToolOverlay';
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
            formContainer.style.width = '400px';

            // Create form elements
            formContainer.innerHTML = `
                <h3>ATC Propagation Tool</h3>
                <label for="inputFile1">Input File 1 (.xlsx, .csv)</label>
                <input type="file" id="inputFile1" accept=".xlsx, .csv" style="width: 100%; margin-bottom: 10px;">
                <label for="inputFile2">Input File 2 (.xlsx, .csv)</label>
                <input type="file" id="inputFile2" accept=".xlsx, .csv" style="width: 100%; margin-bottom: 10px;">
                <label for="customFileName">Custom File Name (optional)</label>
                <input type="text" id="customFileName" placeholder="Enter custom file name" style="width: 100%; margin-bottom: 10px;">
                <button id="processFilesButton" style="width: 100%; margin-bottom: 10px;">Process Files</button>
                <div id="statusMessage" style="text-align: center; font-size: 14px; color: #004E36;"></div>
            `;

            formContainer.appendChild(closeButton);
            overlay.appendChild(formContainer);
            document.body.appendChild(overlay);

            document.getElementById('processFilesButton').addEventListener('click', function() {
                const inputFile1 = document.getElementById('inputFile1').files[0];
                const inputFile2 = document.getElementById('inputFile2').files[0];
                const statusMessage = document.getElementById('statusMessage');

                if (!inputFile1 || !inputFile2) {
                    statusMessage.innerText = 'Please select both files.';
                    return;
                }

                statusMessage.innerText = 'Processing...';

                // Read and process the input files
                const reader1 = new FileReader();
                reader1.onload = function(event) {
                    const data1 = new Uint8Array(event.target.result);
                    const workbook1 = XLSX.read(data1, { type: 'array' });
                    const sheet1 = workbook1.Sheets[workbook1.SheetNames[0]];
                    const dataJson1 = XLSX.utils.sheet_to_json(sheet1);

                    const reader2 = new FileReader();
                    reader2.onload = function(event) {
                        const data2 = new Uint8Array(event.target.result);
                        const workbook2 = XLSX.read(data2, { type: 'array' });
                        const sheet2 = workbook2.Sheets[workbook2.SheetNames[0]];
                        const dataJson2 = XLSX.utils.sheet_to_json(sheet2);

                        // Process the data from both files
                        const result = processData(dataJson1, dataJson2);

                        // Create and download the result as an xlsx file
                        const resultSheet = XLSX.utils.json_to_sheet(result);
                        const resultWorkbook = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(resultWorkbook, resultSheet, 'Results');
                        const customFileName = document.getElementById('customFileName').value.trim();
                        const fileName = customFileName ? customFileName + '.xlsx' : 'ATC_Propagation_Results.xlsx';
                        XLSX.writeFile(resultWorkbook, fileName);

                        statusMessage.innerText = 'Processing complete. File downloaded.';
                    };
                    reader2.readAsArrayBuffer(inputFile2);
                };
                reader1.readAsArrayBuffer(inputFile1);
            });
        });
    }

    function processData(data1, data2) {
        // Implement the logic to process data from both files
        // This is a placeholder function and should be replaced with actual logic
        return data1.concat(data2);
    }
})();
