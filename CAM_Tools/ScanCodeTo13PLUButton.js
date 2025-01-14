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
        `;

        formContainer.appendChild(closeButton);
        overlay.appendChild(formContainer);
        document.body.appendChild(overlay);

        // Add event listener to the "Convert" button
        document.getElementById('convertButton').addEventListener('click', function() {
            const input = document.getElementById('scanCodeInput').value;
            const scanCodes = input.split(/[\s,]+/).map(code => code.trim()).filter(code => code !== '');
            const pluCodes = scanCodes.map(code => {
                const paddedPLU = padTo12Digits(code);
                return getEAN(paddedPLU);
            });
            const outputFormat = document.getElementById('outputFormatSelect').value;
            const outputText = outputFormat === 'excel' ? pluCodes.join('\n') : pluCodes.join(', ');
            document.getElementById('pluOutput').innerText = outputText;
        });

        // Function to pad PLU to 12 digits
        function padTo12Digits(plu) {
            return ('000000000000' + plu).slice(-12);
        }

        // Function to calculate EAN-13 from 12-digit PLU
        function getEAN(plu) {
            if (plu.length !== 12) {
                return 'Length not 12';
            }
            const b = [1, 3, 1, 3, 1, 3].reduce((sum, weight, i) => sum + parseInt(plu[i * 2 + 1]) * weight, 0);
            const c = [1, 3, 1, 3, 1, 3].reduce((sum, weight, i) => sum + parseInt(plu[i * 2]) * weight, 0);
            const d = b + c;
            const a = Math.ceil(d / 10) * 10;
            const e = a - d;
            return plu + e;
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
