// ==UserScript==
// @name         Main Script
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Main script to include button functionalities
// @author       Ryan Satterfield
// @match        https://*.cam.wfm.amazon.dev/*
// @grant        none
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/DownloadButton.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/AddItemButton.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/ActivateButton.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/RedriveButton.js
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';
    console.log("MainScript Started");
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
