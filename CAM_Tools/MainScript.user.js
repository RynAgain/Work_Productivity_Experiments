// ==UserScript==
// @name         CAM_Admin_Tools
// @namespace    http://tampermonkey.net/
// @version      3.1.0
// @description  Main script to include button functionalities
// @author       Ryan Satterfield
// @match        https://*.cam.wfm.amazon.dev/*
// @grant        none

// --- External Libraries ---
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.0/xlsx.full.min.js
// @require      https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/react/17.0.2/umd/react.production.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/react-dom/17.0.2/umd/react-dom.production.min.js
// @require      https://code.jquery.com/jquery-3.7.1.min.js
// @require      https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js
// @require      https://unpkg.com/x-data-spreadsheet@1.1.5/dist/xspreadsheet.js

// --- Theme Engine (must load before all other CAM modules) ---
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/tm-theme.js?v=3.1.0

// --- CAM Tool Modules ---
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/AddItemButton.js?v=3.1.0
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/activateButton.js?v=3.1.0
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/RedriveButton.js?v=3.1.0
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/GeneralHelpToolsButton.js?v=3.1.0
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/PLUDedupeListButton.js?v=3.1.0
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/NISFileToCAMUploadButton.js?v=3.1.0
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/ScanCodeTo13PLUButton.js?v=3.1.0
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/PLUToASINButton.js?v=3.1.0
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/DownloadButton.js?v=3.1.0
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/GetMerchantIDFromStoreCode.js?v=3.1.0
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/GetAllStoreInfo.js?v=3.1.0
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/MeatInventoryToUploadConverter.js?v=3.1.0
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/inventoryPFDS.js?v=3.1.0
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/MassUploaderButton.js?v=3.1.0
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/FileChunker.js?v=3.1.0
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/componentUploadBuilder.js?v=3.1.0
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/ExistingItemEditor.js?v=3.1.0
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/Settings.js?v=3.1.0
// --- Removed: EmbedExcel.js (CAM Excel editor button -- deprecated) ---
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/auditHistoryPull.js?v=3.1.0
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/DesyncFinder.js?v=3.1.0
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/scratchpaper.js?v=3.1.0
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/GroceryCentralConnect.js?v=3.1.0

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