// ==UserScript==
// @name         CAM_Admin_Tools - Meat Edition
// @namespace    http://tampermonkey.net/
// @version      2.5.135
// @description  Main script to include button functionalities
// @author       Ryan Satterfield
// @match        https://*.cam.wfm.amazon.dev/*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.0/xlsx.full.min.js
// @require      https://cdn.jsdelivr.net/npm/papaparse@5.3.2/papaparse.min.js



// @require      https://raw.githubusercontent.com/RynAgain/Work_Productivity_Experiments/refs/heads/main/CAM_Tools/JS/GeneralHelpToolsButton.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/PLUDedupeListButton.js

// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/AddItemButton.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/ScanCodeTo13PLUButton.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/PLUToASINButton.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/DownloadButton.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/GetMerchantIDFromStoreCode.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/GetAllStoreInfo.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/MeatInventoryToUploadConverter.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/MassUploaderButton.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/JS/FileChunker.js


// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/RynAgain/Work_Productivity_Experiments/refs/heads/main/Meat%20Tools/MeatMainScript.js
// @downloadURL  https://raw.githubusercontent.com/RynAgain/Work_Productivity_Experiments/refs/heads/main/Meat%20Tools/MeatMainScript.js
// ==/UserScript==

(function() {
    'use strict';
    console.log("MainScript Started - loading buttons");
    var style = document.createElement('style');
    style.innerHTML = `
    body, * {
      cursor: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' height='32' width='32'><text y='24' font-size='24'>🍗</text></svg>") 0 0, auto;
    }
    `;
    document.head.appendChild(style);

})();
