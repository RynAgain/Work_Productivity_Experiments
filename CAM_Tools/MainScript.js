// ==UserScript==
// @name         CAM_Admin_Tools
// @namespace    http://tampermonkey.net/
// @version      2.5.097
// @description  Main script to include button functionalities
// @author       Ryan Satterfield
// @match        https://*.cam.wfm.amazon.dev/*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js
// @require https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.0/xlsx.full.min.js

// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/AddItemButton.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/ActivateButton.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/RedriveButton.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/GeneralHelpToolsButton.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/PLUDedupeListButton.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/NISFileToCAMUploadButton.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/ScanCodeTo13PLUButton.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/PLUToASINButton.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/DownloadButton.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/GetMerchantIDFromStoreCode.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/GetAllStoreInfo.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/MeatInventoryToUploadConverter.js


// @run-at       document-body
// @updateURL    https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/MainScript.js
// @downloadURL  https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/MainScript.js
// ==/UserScript==

(function() {
    'use strict';
    console.log("MainScript Started - loading buttons");
    // Wait for DOM or run immediately
    window.addEventListener('DOMContentLoaded', () => {
        console.log('Main script: DOMContentLoaded');

        if (typeof window.initDownloadDataFeature === 'function') {
            // Call the function from the required script
            window.initDownloadDataFeature();
            console.log('initDownloadDataFeature function called successfully.');
        } else {
            console.error('Required script not loaded or function is missing.');
        }
    });
})();
