(function() {
    'use strict';

    // Expose the function to the global scope for testing
    try {
        module.exports = {
            addGeneralHelpToolsButton
        };
    } catch (e) {
        // Handle the error if needed
    }

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
        generalHelpToolsButton.className = 'button'; // Use common button class for consistent styling

        generalHelpToolsButton.style.position = 'fixed';
        generalHelpToolsButton.style.bottom = '0';
        generalHelpToolsButton.style.left = '80%';
        generalHelpToolsButton.style.width = '20%';
        generalHelpToolsButton.style.height = '40px';
        generalHelpToolsButton.style.zIndex = '1000';

        // Append the button to the body
        document.body.appendChild(generalHelpToolsButton);
        console.log('General Help Tools button added to the page');
        generalHelpToolsButton.addEventListener('mouseover', function(){
            generalHelpToolsButton.style.backgroundColor = '#218838';
        });
        generalHelpToolsButton.addEventListener('mouseout', function(){
            generalHelpToolsButton.style.backgroundColor = '#004E36';
        });

        // Add click event to the General Help Tools button
        generalHelpToolsButton.addEventListener('click', function() {
            console.log('General Help Tools button clicked');
            var existingOverlay = document.getElementById('generalHelpOverlay');
            if(existingOverlay) {
                existingOverlay.style.display = 'flex';
                return;
            }
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
                overlay.style.display = 'none';
            });

            var formContainer = document.createElement('div');
            formContainer.style.position = 'relative';
            formContainer.style.backgroundColor = '#fff';
            formContainer.style.padding = '20px';
            formContainer.style.borderRadius = '5px';
            formContainer.style.width = '600px';

            // Create list of buttons in a two-section layout: Main and Beta
            formContainer.innerHTML = `
                <h3>General Help Tools</h3>
                <div id="buttonGrid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                    <button id="pluDedupeListButton" style="width: 100%;">PLU Dedupe & List</button>
                    <button id="scanCodeTo13PLUButton" style="width: 100%;">Scan Code to 13-PLU</button>
                    <button id="pluToAsinButton" style="width: 100%;">Basic PLU to ASIN</button>
                    <button id="getMerchantIdButton" style="width: 100%;">Get eMerchant IDs from Store Code</button>
                    <button id="getAllStoreInfoButton" style="width: 100%;">Get All Store Info</button>
                    <button id="meatInventoryToUploadConverterButton" style="width: 100%;">Meat Inventory to Upload Converter</button>
                    <button id="filechunker" style="width: 100%;">File Chunker</button>
                    <button id="massUploaderButton" style="width: 100%;">Mass File Upload</button>
                    <button id="auditHistoryPullButton" style="width: 100%;">Audit History Pull</button>
                    <button id="desyncFinderButton" style="width: 100%;">Desync Finder</button>
                    <button id="componentUploadBuilderButton" style="width: 100%;">Component Upload Builder</button>
                </div>
                <h4 style="margin-top: 20px;">Beta</h4>
                <div id="betaButtonGrid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                    <button id="nisFileToCAMUploadButton" style="width: 100%;">zNon-functional Buttonz</button>
                    <button id="auditHistoryDashboardButton" style="width: 100%;">zAudit History Dashboardz</button>
                    <button id="dailyInventoryTool" style="width: 100%;">zDaily Inventory Toolz</button>
                    <button id="atcpropButton" style="width: 100%;">zATC Propagation Toolz</button>
                </div>
                <a href="#" id="creditsLink" style="display: block; text-align: center; margin-top: 10px;">Credits</a>
                <a href="https://share.amazon.com/sites/WFM_eComm_ABI/_layouts/15/download.aspx?SourceUrl=%2Fsites%2FWFM%5FeComm%5FABI%2FShared%20Documents%2FWFMOAC%2FDailyInventory%2FWFMOAC%20Inventory%20Data%2Exlsx&FldUrl=&Source=https%3A%2F%2Fshare%2Eamazon%2Ecom%2Fsites%2FWFM%5FeComm%5FABI%2FShared%2520Documents%2FForms%2FAllItems%2Easpx%3FRootFolder%3D%252Fsites%252FWFM%255FeComm%255FABI%252FShared%2520Documents%252FWFMOAC%252FDailyInventory%26FolderCTID%3D0x0120007B3CF5C516656843AD728338D9C2AFA4" target="_blank" id="dailyLink" style="display: block; text-align: center; margin-top: 10px;">Daily Seller Inventory</a>
            `;
            // Insert close button at the beginning of formContainer
            formContainer.insertBefore(closeButton, formContainer.firstChild);
            overlay.appendChild(formContainer);
            document.body.appendChild(overlay);
            // Removed redundant text reset for PLU Dedupe List button

            // Add event listener for the "Credits" link
            document.getElementById('creditsLink').addEventListener('click', function(event) {
                event.preventDefault();
                alert('Software Version: 2.6.x\nLast Update Date: 2025-3-10\nAuthor: Ryan Satterfield\nThis is an unofficial tool.');
            });
        });
    }

    try {
        module.exports = {
            addGeneralHelpToolsButton
        };
    } catch (e) {
        // Handle the error if needed
    }
    // Use MutationObserver to detect changes in the DOM
    const observer = new MutationObserver(function(mutationsList, observer) {
        if (!document.getElementById('generalHelpToolsButton')) {
            addGeneralHelpToolsButton();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Removed MutationObserver block to prevent duplicate button insertion.
    // Initial attempt to add the General Help Tools button
    addGeneralHelpToolsButton();
})();
