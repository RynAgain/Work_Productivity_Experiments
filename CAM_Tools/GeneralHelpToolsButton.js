(function() {
    'use strict';

    // Function to add the General Help Tools button
    function addGeneralHelpToolsButton() {
        console.log('Attempting to add General Help Tools button');

        // Check if the button already exists
        if (document.getElementById('generalHelpToolsButton')) {
            console.log('General Help Tools button already exists');
            return;
        }

        // Create the General Help Tools button
        var generalHelpToolsButton = document.createElement('button');
        generalHelpToolsButton.id = 'generalHelpToolsButton';
        generalHelpToolsButton.innerHTML = 'General Help Tools';
        generalHelpToolsButton.style.position = 'fixed';
        generalHelpToolsButton.style.bottom = '0';
        generalHelpToolsButton.style.left = '80%';
        generalHelpToolsButton.style.width = '20%';
        generalHelpToolsButton.style.height = '40px';
        generalHelpToolsButton.style.zIndex = '1000';
        generalHelpToolsButton.style.fontSize = '14px';
        generalHelpToolsButton.style.backgroundColor = '#004E36';
        generalHelpToolsButton.style.color = '#fff';
        generalHelpToolsButton.style.border = 'none';
        generalHelpToolsButton.style.borderRadius = '0';
        generalHelpToolsButton.style.cursor = 'pointer !important';

        // Append the button to the body
        document.body.appendChild(generalHelpToolsButton);
        console.log('General Help Tools button added to the page');

        // Add click event to the General Help Tools button
        generalHelpToolsButton.addEventListener('click', function() {
            console.log('General Help Tools button clicked');
            // Create overlay
            var overlay = document.createElement('div');
            overlay.id = 'generalHelpOverlay';
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
            // Attach the event listener for the PLU Dedupe & List button
            const pluDedupeListButton = formContainer.querySelector('#pluDedupeListButton');
            if (pluDedupeListButton) {
                pluDedupeListButton.addEventListener('click', addPLUDedupeListFunctionality);
            }
        });

            var formContainer = document.createElement('div');
            formContainer.style.position = 'relative';
            formContainer.style.backgroundColor = '#fff';
            formContainer.style.padding = '20px';
            formContainer.style.borderRadius = '5px';
            formContainer.style.width = '300px';

            // Create list of buttons
            formContainer.innerHTML = `
                <h3>General Help Tools</h3>
                <button id="pluDedupeListButton" style="width: 100%; margin-bottom: 10px;">PLU Dedupe & List</button>
                <button id="nisFileToCAMUploadButton" style="width: 100%; margin-bottom: 10px;">NIS File to CAM Upload</button>
                <button id="scanCodeTo13PLUButton" style="width: 100%; margin-bottom: 10px;">Scan Code to 13-PLU</button>
                <button id="pluToAsinButton" style="width: 100%; margin-bottom: 10px;">PLU to ASIN</button>
                <button id="getMerchantIdButton" style="width: 100%; margin-bottom: 10px;">Get Merchant ID from Store Code</button>
                <button id="tool6Button" style="width: 100%; margin-bottom: 10px;">Tool 6</button>
            `;

            formContainer.appendChild(closeButton);
            overlay.appendChild(formContainer);
            document.body.appendChild(overlay);
        });

        // Attach the event listener for the Get Merchant ID button
        const getMerchantIdButton = formContainer.querySelector('#getMerchantIdButton');
        if (getMerchantIdButton) {
            getMerchantIdButton.addEventListener('click', getMerchantIDFromStoreCode);
        }
    }

    // Use MutationObserver to detect changes in the DOM
    const observer = new MutationObserver(addGeneralHelpToolsButton);
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial attempt to add the General Help Tools button
    addGeneralHelpToolsButton();
})();
