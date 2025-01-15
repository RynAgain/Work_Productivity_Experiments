// ==UserScript==
// @name         CAM_Admin_Tools
// @namespace    http://tampermonkey.net/
// @version      2.5.049
// @description  Main script to include button functionalities
// @author       Ryan Satterfield
// @match        https://*.cam.wfm.amazon.dev/*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js
// @require      https://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@github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/DownloadButton.js
// @require      https://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@github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/AddItemButton.js
// @require      https://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@github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/ActivateButton.js
// @require      https://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@github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/RedriveButton.js
// @require      https://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@github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/GeneralHelpToolsButton.js
// @require      https://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@github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/PLUDedupeListButton.js
// @require      https://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@github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/NISFileToCAMUploadButton.js
// @require      https://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@github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/ScanCodeTo13PLUButton.js
// @require      https://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@github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/PLUToASINButton.js
// @require      https://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@github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/GetMerchantIDFromStoreCode.js

// @run-at       document-body
// @updateURL    https://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@github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/MainScript.js
// @downloadURL  https://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@github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/MainScript.js
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
