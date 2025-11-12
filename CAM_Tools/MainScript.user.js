// ==UserScript==
// @name         CAM_Admin_Tools
// @namespace    http://tampermonkey.net/
// @version      2.6.252  
// @description  Main script to include button functionalities
// @author       Ryan Satterfield
// @match        https://*.cam.wfm.amazon.dev/*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.0/xlsx.full.min.js
// @require      https://cdn.jsdelivr.net/npm/papaparse@5.3.2/papaparse.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/react/17.0.2/umd/react.production.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/react-dom/17.0.2/umd/react-dom.production.min.js
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @require      https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js


// @require      https://unpkg.com/x-data-spreadsheet@1.1.5/dist/xspreadsheet.js

// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/AddItemButton.js
// @require      https://raw.githubusercontent.com/RynAgain/Work_Productivity_Experiments/main/CAM_Tools/JS/activateButton.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/RedriveButton.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/GeneralHelpToolsButton.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/PLUDedupeListButton.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/NISFileToCAMUploadButton.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/ScanCodeTo13PLUButton.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/PLUToASINButton.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/DownloadButton.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/GetMerchantIDFromStoreCode.js
// @require      https://raw.githubusercontent.com/RynAgain/Work_Productivity_Experiments/refs/heads/main/CAM_Tools/JS/GetAllStoreInfo.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/MeatInventoryToUploadConverter.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/inventoryPFDS.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/MassUploaderButton.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/FileChunker.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/componentUploadBuilder.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/ExistingItemEditor.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/Settings.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/EmbedExcel.js

// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/auditHistoryPull.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/DesyncFinder.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/scratchpaper.js



// @run-at       document-end
// @updateURL    https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/MainScript.user.js
// @downloadURL  https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/MainScript.user.js
// ==/UserScript==

(function() {
    'use strict';
    console.log("MainScript Started - loading buttons");

    const eventListeners = [];

    function addEventListenerWithTracking(target, type, listener, options) {
        try {
            target.addEventListener(type, listener, options);
            eventListeners.push({ target, type, listener, options });
        } catch (error) {
            console.error(`Error adding event listener: ${error.message}`, { target, type, listener, options });
        }
    }

    function restoreEventListeners() {
        eventListeners.forEach(({ target, type, listener, options }) => {
            try {
                if (!target) return;
                target.addEventListener(type, listener, options);
            } catch (error) {
                console.error(`Error restoring event listener: ${error.message}`, { target, type, listener, options });
            }
        });
    }

    try {
        const observer = new MutationObserver((mutationsList) => {
            // Only restore event listeners for added nodes that match tracked targets
            for (const mutation of mutationsList) {
                for (const node of mutation.addedNodes) {
                    if (!(node instanceof HTMLElement)) continue;
                    eventListeners.forEach(({ target, type, listener, options }) => {
                        // If the added node is the target, or contains the target, restore the event listener
                        if (node === target || (node.contains && node.contains(target))) {
                            try {
                                target.addEventListener(type, listener, options);
                            } catch (error) {
                                console.error(`Error restoring event listener: ${error.message}`, { target, type, listener, options });
                            }
                        }
                    });
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    } catch (error) {
        console.error(`Error setting up MutationObserver: ${error.message}`);
    }

    // Example usage:
    // addEventListenerWithTracking(document.getElementById('someButton'), 'click', () => console.log('Clicked!'));

})();