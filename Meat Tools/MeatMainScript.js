// ==UserScript==
// @name         CAM_Admin_Tools - Meat Edition
// @namespace    http://tampermonkey.net/
// @version      2.5.133
// @description  Main script to include button functionalities
// @author       Ryan Satterfield
// @match        https://*.cam.wfm.amazon.dev/*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.0/xlsx.full.min.js
// @require      https://cdn.jsdelivr.net/npm/papaparse@5.3.2/papaparse.min.js



// @require      https://raw.githubusercontent.com/RynAgain/Work_Productivity_Experiments/refs/heads/main/Meat%20Tools/GeneralHelpToolsButton.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/PLUDedupeListButton.js

// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/ScanCodeTo13PLUButton.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/PLUToASINButton.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/DownloadButton.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/GetMerchantIDFromStoreCode.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/GetAllStoreInfo.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/MeatInventoryToUploadConverter.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/MassUploaderButton.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CAM_Tools/FileChunker.js

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
