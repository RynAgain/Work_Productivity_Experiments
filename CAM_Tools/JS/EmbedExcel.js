(function () {
    'use strict';

    const BUTTON_ID = 'embed-excel-btn';
    const OVERLAY_ID = 'embed-excel-overlay';

    // Inject Luckysheet CSS/JS if not already present
    function injectLuckysheetAssets() {
        if (!document.getElementById('luckysheet-css')) {
            const link = document.createElement('link');
            link.id = 'luckysheet-css';
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/luckysheet@2.2.11/dist/plugins/css/pluginsCss.css';
            document.head.appendChild(link);

            const link2 = document.createElement('link');
            link2.rel = 'stylesheet';
            link2.href = 'https://cdn.jsdelivr.net/npm/luckysheet@2.2.11/dist/plugins/plugins.css';
            document.head.appendChild(link2);

            const link3 = document.createElement('link');
            link3.rel = 'stylesheet';
            link3.href = 'https://cdn.jsdelivr.net/npm/luckysheet@2.2.11/dist/css/luckysheet.css';
            document.head.appendChild(link3);
        }
        if (!window.luckysheet) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/luckysheet@2.2.11/dist/luckysheet.umd.js';
            document.body.appendChild(script);
        }
        if (!window.XLSX) {
            const xlsxScript = document.createElement('script');
            xlsxScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.0/xlsx.full.min.js';
            document.body.appendChild(xlsxScript);
        }
    }

    // Inject styles for button and overlay
    const style = document.createElement('style');
    style.textContent = `
        #${BUTTON_ID} {
            position: fixed;
            left: 0;
            top: 0;
            z-index: 3201;
            background: #004E36;
            color: #fff;
            border: none;
            border-radius: 0 5px 5px 0;
            padding: 0;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 2px 2px 8px rgba(0,0,0,0.2);
            cursor: pointer;
            font-size: 18px;
            transition: background 0.2s;
        }
        #${BUTTON_ID}:hover {
            background: #218838;
        }
        #${OVERLAY_ID} {
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        #embed-excel-modal {
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 1.5px 6px rgba(0,78,54,0.10);
            padding: 18px 18px 12px 18px;
            min-width: 900px;
            min-height: 600px;
            max-width: 98vw;
            max-height: 98vh;
            display: flex;
            flex-direction: column;
            position: relative;
        }
        #embed-excel-modal h3 {
            margin-top: 0;
            margin-bottom: 12px;
            color: #004E36;
        }
        #embed-excel-close {
            position: absolute;
            top: 10px; right: 10px;
            font-size: 24px;
            color: #888;
            background: none;
            border: none;
            cursor: pointer;
        }
        #embed-excel-controls {
            margin-bottom: 10px;
            display: flex;
            flex-direction: row;
            gap: 10px;
            align-items: center;
        }
        #embed-excel-upload {
            font-size: 15px;
        }
        #embed-excel-export-btn {
            background: #004E36;
            color: #fff;
            border: none;
            border-radius: 5px;
            padding: 8px 16px;
            font-size: 15px;
            cursor: pointer;
            transition: background 0.2s;
        }
        #embed-excel-export-btn:hover {
            background: #218838;
        }
        #luckysheet-container {
            width: 860px;
            height: 480px;
            min-width: 300px;
            min-height: 200px;
            max-width: 90vw;
            max-height: 60vh;
            margin-top: 8px;
            background: #f8f8f8;
            border-radius: 6px;
            overflow: hidden;
        }
        #embed-excel-status {
            color: #004E36;
            font-size: 14px;
            min-height: 18px;
            margin-top: 4px;
        }
    `;
    document.head.appendChild(style);

    function addEmbedExcelButton() {
        if (document.getElementById(BUTTON_ID)) return;
        const btn = document.createElement('button');
        btn.id = BUTTON_ID;
        btn.title = 'Embed Local Excel Editor (Luckysheet)';
        btn.innerHTML = `
            <svg width="22" height="22" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="16" rx="2" fill="#fff" stroke="none"/>
                <rect x="3" y="4" width="18" height="16" rx="2"/>
                <path d="M7 8h10M7 12h10M7 16h6"/>
                <rect x="5.5" y="6.5" width="3" height="11" rx="0.5" fill="#004E36" stroke="#004E36"/>
                <path d="M7 8v8" stroke="#fff" stroke-width="1.2"/>
                <path d="M5.5 10.5h3" stroke="#fff" stroke-width="1.2"/>
            </svg>
        `;
        btn.onclick = showEmbedExcelOverlay;
        document.body.appendChild(btn);
    }

    function showEmbedExcelOverlay() {
        if (document.getElementById(OVERLAY_ID)) return;
        injectLuckysheetAssets();

        const overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;

        overlay.innerHTML = `
            <div id="embed-excel-modal">
                <button id="embed-excel-close" title="Close">&times;</button>
                <h3>Local Excel Editor (Luckysheet)</h3>
                <div id="embed-excel-controls">
                    <input type="file" id="embed-excel-upload" accept=".xlsx,.xls,.csv" />
                    <button id="embed-excel-export-btn" disabled>Export as .xlsx</button>
                    <span style="font-size:13px;color:#666;">All editing is local. No data leaves your browser.</span>
                </div>
                <div id="luckysheet-container"></div>
                <div id="embed-excel-status"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Close logic
        document.getElementById('embed-excel-close').onclick = () => {
            // Destroy Luckysheet instance to free memory
            if (window.luckysheet) {
                try { window.luckysheet.destroy(); } catch (e) {}
            }
            document.body.removeChild(overlay);
        };
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                if (window.luckysheet) {
                    try { window.luckysheet.destroy(); } catch (e) {}
                }
                document.body.removeChild(overlay);
            }
        };

        const uploadInput = document.getElementById('embed-excel-upload');
        const exportBtn = document.getElementById('embed-excel-export-btn');
        const statusDiv = document.getElementById('embed-excel-status');
        const container = document.getElementById('luckysheet-container');

        // Wait for Luckysheet and XLSX to be loaded
        function waitForLibs(cb) {
            if (window.luckysheet && window.XLSX) {
                cb();
            } else {
                setTimeout(() => waitForLibs(cb), 100);
            }
        }

        // File upload logic
        uploadInput.addEventListener('change', function () {
            const file = uploadInput.files[0];
            if (!file) return;
            statusDiv.textContent = 'Reading file...';
            waitForLibs(() => {
                const reader = new FileReader();
                reader.onload = function (e) {
                    let data = e.target.result;
                    let workbook;
                    try {
                        if (file.name.endsWith('.csv')) {
                            // Parse CSV to workbook
                            workbook = window.XLSX.read(data, { type: 'string' });
                        } else {
                            workbook = window.XLSX.read(data, { type: 'array' });
                        }
                        // Convert workbook to Luckysheet data
                        const luckysheetData = window.luckysheet.transToLuckyBySheet(workbook.Sheets, workbook.SheetNames);
                        // Destroy previous instance if any
                        try { window.luckysheet.destroy(); } catch (e) {}
                        // Render Luckysheet
                        window.luckysheet.create({
                            container: 'luckysheet-container',
                            data: luckysheetData,
                            showinfobar: true,
                            lang: 'en',
                            allowEdit: true,
                            allowUpdate: true,
                            showtoolbar: true,
                            showstatbar: true,
                            showSheetbar: true,
                            enableAddRow: true,
                            enableAddCol: true,
                            enableAddBackTop: true,
                            enableAddBackBottom: true,
                        });
                        exportBtn.disabled = false;
                        statusDiv.textContent = 'File loaded. Edit and export as needed.';
                    } catch (err) {
                        statusDiv.textContent = 'Error reading file: ' + err.message;
                        exportBtn.disabled = true;
                    }
                };
                if (file.name.endsWith('.csv')) {
                    reader.readAsText(file);
                } else {
                    reader.readAsArrayBuffer(file);
                }
            });
        });

        // Export logic
        exportBtn.onclick = function () {
            waitForLibs(() => {
                try {
                    const luckysheetData = window.luckysheet.getAllSheets();
                    const wb = window.luckysheet.luckysheetToXlsx(luckysheetData);
                    const wbout = window.XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                    const blob = new Blob([wbout], { type: "application/octet-stream" });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = 'edited.xlsx';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    statusDiv.textContent = 'Exported as edited.xlsx';
                } catch (err) {
                    statusDiv.textContent = 'Export failed: ' + err.message;
                }
            });
        };
    }

    // Use MutationObserver to ensure button stays present
    const observer = new MutationObserver(addEmbedExcelButton);
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial attempt to add the button
    addEmbedExcelButton();

    // Expose for testing
    try {
        module.exports = { addEmbedExcelButton };
    } catch (e) {}
})();