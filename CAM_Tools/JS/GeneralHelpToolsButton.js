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
            // Function to reattach event listeners for buttons in the overlay
            function reattachEventListeners() {
                const buttonActions = {
                    'pluDedupeListButton': addPLUDedupeListFunctionality,
                    'nisFileToCAMUploadButton': addNISFileToCAMUploadFunctionality,
                    'scanCodeTo13PLUButton': addScanCodeTo13PLUFunctionality,
                    'pluToAsinButton': addPLUToASINFunctionality,
                    'getMerchantIdButton': getMerchantIDFromStoreCode,
                    'getAllStoreInfoButton': getAllStoreInfo,
                    'meatInventoryToUploadConverterButton': addMeatInventoryToUploadConverterFunctionality,
                    'filechunker': addFileChunkerFunctionality,
                    'massUploaderButton': addMassUploaderFunctionality,
                    'auditHistoryPullButton': auditHistoryPull
                };

                for (const [buttonId, action] of Object.entries(buttonActions)) {
                    const button = document.getElementById(buttonId);
                    if (button) {
                        button.addEventListener('click', action);
                    }
                }
            }

            // Reattach event listeners each time the overlay is opened
            reattachEventListeners();
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
                <button id="nisFileToCAMUploadButton" style="width: 100%; margin-bottom: 10px;">zNon-functional Buttonz</button>
                <button id="scanCodeTo13PLUButton" style="width: 100%; margin-bottom: 10px;">Scan Code to 13-PLU</button>
                <button id="pluToAsinButton" style="width: 100%; margin-bottom: 10px;">Basic PLU to ASIN</button>
                <button id="getMerchantIdButton" style="width: 100%; margin-bottom: 10px;">Get eMerchant IDs from Store Code</button>
                <button id="getAllStoreInfoButton" style="width: 100%; margin-bottom: 10px;">Get All Store Info</button>
                <button id="meatInventoryToUploadConverterButton" style="width: 100%; margin-bottom: 10px;">Meat Inventory to Upload Converter</button>
                <button id ="filechunker" style = "width: 100%; margin-bottom: 10px;">File Chunker</button>
                <button id ="massUploaderButton" style = "width: 100%; margin-bottom: 10px;">Mass File Upload</button> 
                <button id="auditHistoryPullButton" style="width: 100%; margin-bottom: 10px;">Audit History Pull</button>

                <button id ="auditHistoryDashboardButton" style = "width: 100%; margin-bottom: 10px;">zAudit History Dashboardz</button>
                <button id ="dailyInventoryTool" style = "width: 100%; margin-bottom: 10px;">zDaily Inventory Toolz</button>
                <button id="atcpropButton" style ="width: 100%; margin-bottom: 10px;">zATC Propagation Toolz</button>

                <a href="#" id="creditsLink" style="display: block; text-align: center; margin-top: 10px;">Credits</a>
            `;

            formContainer.appendChild(closeButton);
            overlay.appendChild(formContainer);
            document.body.appendChild(overlay);
            // Add event listener for the "Credits" link
            document.getElementById('creditsLink').addEventListener('click', function(event) {
                event.preventDefault();
                alert('Software Version: 2.5\nLast Update Date: 2025-2-10\nAuthor: Ryan Satterfield\nThis is an unofficial tool.');
                
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
    const observer = new MutationObserver(addGeneralHelpToolsButton);
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial attempt to add the General Help Tools button
    addGeneralHelpToolsButton();
})();
