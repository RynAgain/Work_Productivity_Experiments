(function() {
    'use strict';

    // Expose the function to the global scope for testing
    try {
        module.exports = {
            addATCPropagationToolButton
        };
    } catch (e) {
        // Module exports not available in browser environment
    }

    function addATCPropagationToolButton() {
        try {
            // Check if the button already exists
            if (document.getElementById('atcpropButton')) {
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
            newButton.style.transform = 'translateX(-50%)';
            newButton.style.width = '20%';
            newButton.style.height = '40px';
            newButton.style.zIndex = '1000';

            // Add click event to the button
            newButton.addEventListener('click', createOverlay);
            document.body.appendChild(newButton);
            console.log('ATC Propagation Tool button added to the page');
        } catch (error) {
            console.error('Error in addATCPropagationToolButton:', error);
        }
    }

    function createOverlay() {
        const overlay = document.createElement('div');
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

        const formContainer = createFormContainer();
        overlay.appendChild(formContainer);
        document.body.appendChild(overlay);
    }

    function createFormContainer() {
        const formContainer = document.createElement('div');
        formContainer.style.position = 'relative';
        formContainer.style.backgroundColor = '#fff';
        formContainer.style.padding = '20px';
        formContainer.style.borderRadius = '5px';
        formContainer.style.width = '400px';

        const closeButton = createCloseButton();
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
        attachProcessFilesListener();
        return formContainer;
    }

    function createCloseButton() {
        const closeButton = document.createElement('span');
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
        
        closeButton.addEventListener('click', () => {
            const overlay = document.getElementById('atcPropagationToolOverlay');
            if (overlay) {
                document.body.removeChild(overlay);
            }
        });

        return closeButton;
    }

    function attachProcessFilesListener() {
        document.getElementById('processFilesButton').addEventListener('click', handleFileProcessing);
    }

    function handleFileProcessing() {
        const inputFile1 = document.getElementById('inputFile1').files[0];
        const inputFile2 = document.getElementById('inputFile2').files[0];
        const statusMessage = document.getElementById('statusMessage');

        if (!inputFile1 || !inputFile2) {
            statusMessage.innerText = 'Please select both files.';
            return;
        }

        statusMessage.innerText = 'Processing...';
        processFiles(inputFile1, inputFile2, statusMessage);
    }

    function processFiles(file1, file2, statusMessage) {
        const reader1 = new FileReader();
        reader1.onload = function(event) {
            const data1 = new Uint8Array(event.target.result);
            const workbook1 = XLSX.read(data1, { type: 'array' });
            const sheet1 = workbook1.Sheets[workbook1.SheetNames[0]];
            const dataJson1 = XLSX.utils.sheet_to_json(sheet1);

            const reader2 = new FileReader();
            reader2.onload = function(event) {
                try {
                    const data2 = new Uint8Array(event.target.result);
                    const workbook2 = XLSX.read(data2, { type: 'array' });
                    const sheet2 = workbook2.Sheets[workbook2.SheetNames[0]];
                    const dataJson2 = XLSX.utils.sheet_to_json(sheet2);

                    const result = processData(dataJson1, dataJson2);
                    downloadResult(result, statusMessage);
                } catch (error) {
                    console.error('Error processing files:', error);
                    statusMessage.innerText = 'Error processing files.';
                }
            };
            reader2.readAsArrayBuffer(file2);
        };
        reader1.readAsArrayBuffer(file1);
    }

    function downloadResult(result, statusMessage) {
        const resultSheet = XLSX.utils.json_to_sheet(result);
        const resultWorkbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(resultWorkbook, resultSheet, 'Results');
        
        const customFileName = document.getElementById('customFileName').value.trim();
        const fileName = customFileName ? `${customFileName}.xlsx` : 'ATC_Propagation_Results.xlsx';
        
        XLSX.writeFile(resultWorkbook, fileName);
        statusMessage.innerText = 'Processing complete. File downloaded.';
    }

    function processData(data1, data2) {
        // Implement the logic to process data from both files
        // This is a placeholder function and should be replaced with actual logic
        return data1.concat(data2);
    }

    // Initialize the button
    addATCPropagationToolButton();
})();
