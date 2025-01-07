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
// ==/UserScript==

(function() {
    'use strict';
    console.log('Main script is running');
    // Ensure all scripts are loaded before calling initialization functions
    window.addEventListener('load', function() {
        if (typeof addDownloadButton === 'function') addDownloadButton();
        if (typeof addAddItemButton === 'function') addAddItemButton();
        if (typeof addActivateButton === 'function') addActivateButton();
        if (typeof addRedriveButton === 'function') addRedriveButton();
    });
})();
