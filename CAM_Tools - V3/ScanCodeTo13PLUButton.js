(function() {
    'use strict';

    // Function to add the Scan Code to 13-PLU button functionality
    function addScanCodeTo13PLUFunctionality() {
        console.log('Scan Code to 13-PLU button clicked');
        // Create overlay
        var overlay = document.createElement('div');
        overlay.id = 'scanCodeTo13PLUOverlay';
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
            <h3>Scan Code to 13-PLU</h3>
            <textarea id="scanCodeInput" style="width: 100%; height: 100px; margin-bottom: 10px;" placeholder="Enter scan codes here..."></textarea>
            <label>Output Format</label>
            <select id="outputFormatSelect" style="width: 100%; margin-bottom: 10px;">
                <option value="excel">Excel</option>
                <option value="comma">Comma Separated List</option>
            </select>
            <button id="convertButton" style="width: 100%; margin-bottom: 10px;">Convert</button>
            <div id="pluOutput" style="width: 100%; height: 100px; border: 1px solid #ccc; padding: 10px; overflow-y: auto;"></div>
            <button id="copyButton" style="width: 100%; margin-top: 10px;">Copy to Clipboard</button>
        `;

        formContainer.appendChild(closeButton);
        overlay.appendChild(formContainer);
        document.body.appendChild(overlay);

        // Add event listener to the "Convert" button
        document.getElementById('convertButton').addEventListener('click', function() {
            const input = document.getElementById('scanCodeInput').value;
            const scanCodes = input.split(/[\s,]+/).map(code => code.replace(/\s+/g, '').trim()).filter(code => code !== '');
            const pluCodes = scanCodes.map(code => {
                const upcCode = getUPC(code);
                return getEAN(upcCode);
            });
            const outputFormat = document.getElementById('outputFormatSelect').value;
            const outputText = outputFormat === 'excel' ? pluCodes.join('\n') : pluCodes.join(', ');
            document.getElementById('pluOutput').innerText = outputText;
        });

        // Add event listener to the "Copy to Clipboard" button
        document.getElementById('copyButton').addEventListener('click', function() {
            const outputText = document.getElementById('pluOutput').innerText;
            navigator.clipboard.writeText(outputText).then(() => {
                alert('Output copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        });

        // Function to convert to 12-digit UPC
        function getUPC(sku) {
            const upc = ('000000000000' + sku).slice(-12);
            return upc;
        }

        // Function to calculate EAN-13 from 12-digit UPC
        function getEAN(upc) {
            if (upc.length !== 12) {
                return 'Length not 12';
            }
            return upc + calculateCheckDigit(upc);
        }

        // Function to calculate check digit
        function calculateCheckDigit(code) {
            const oddSum = [0, 2, 4, 6, 8, 10].reduce((sum, i) => sum + parseInt(code[i]), 0);
            const evenSum = [1, 3, 5, 7, 9, 11].reduce((sum, i) => sum + parseInt(code[i]), 0);
            const totalSum = oddSum + evenSum * 3;
            const nextTen = Math.ceil(totalSum / 10) * 10;
            return nextTen - totalSum;
        }

    }

    // Use MutationObserver to detect when the button is added to the DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                const scanCodeTo13PLUButton = document.getElementById('scanCodeTo13PLUButton');
                if (scanCodeTo13PLUButton) {
                    scanCodeTo13PLUButton.addEventListener('click', addScanCodeTo13PLUFunctionality);
                    observer.disconnect(); // Stop observing once the button is found
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
