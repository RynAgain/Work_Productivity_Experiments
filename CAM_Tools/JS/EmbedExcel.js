(function () {
    'use strict';

    // Only run on /editor or all pages? We'll show on all pages for now.
    // Position above the scratchpad button (which is at top: 10vh, left: 0)
    const BUTTON_ID = 'embed-excel-btn';
    const OVERLAY_ID = 'embed-excel-overlay';

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
            padding: 24px 28px 20px 28px;
            min-width: 420px;
            min-height: 320px;
            max-width: 90vw;
            max-height: 90vh;
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
        #embed-excel-upload {
            margin-bottom: 12px;
        }
        #embed-excel-table-container {
            overflow: auto;
            max-height: 45vh;
            margin-bottom: 12px;
        }
        #embed-excel-table {
            border-collapse: collapse;
            width: 100%;
            font-size: 15px;
        }
        #embed-excel-table th, #embed-excel-table td {
            border: 1px solid #ccc;
            padding: 4px 8px;
            min-width: 60px;
            text-align: left;
        }
        #embed-excel-table th {
            background: #f2f2f2;
        }
        #embed-excel-save {
            background: #004E36;
            color: #fff;
            border: none;
            border-radius: 5px;
            padding: 8px 0;
            font-size: 15px;
            cursor: pointer;
            transition: background 0.2s;
            width: 100%;
            margin-bottom: 6px;
        }
        #embed-excel-save:hover {
            background: #218838;
        }
    `;
    document.head.appendChild(style);

    // Add the button if not already present
    function addEmbedExcelButton() {
        if (document.getElementById(BUTTON_ID)) return;
        const btn = document.createElement('button');
        btn.id = BUTTON_ID;
        btn.title = 'Embed Excel Editor';
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

    // Show the overlay/modal
    function showEmbedExcelOverlay() {
        if (document.getElementById(OVERLAY_ID)) return;
        const overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;

        overlay.innerHTML = `
            <div id="embed-excel-modal">
                <button id="embed-excel-close" title="Close">&times;</button>
                <h3>Embedded Excel Editor</h3>
                <input type="file" id="embed-excel-upload" accept=".xlsx,.xls,.csv" />
                <div id="embed-excel-table-container"></div>
                <button id="embed-excel-save" disabled>Download Edited File</button>
                <div id="embed-excel-status" style="color:#004E36;font-size:14px;min-height:18px;"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Close logic
        document.getElementById('embed-excel-close').onclick = () => {
            document.body.removeChild(overlay);
        };
        overlay.onclick = (e) => {
            if (e.target === overlay) document.body.removeChild(overlay);
        };

        // File upload logic
        const uploadInput = document.getElementById('embed-excel-upload');
        const tableContainer = document.getElementById('embed-excel-table-container');
        const saveBtn = document.getElementById('embed-excel-save');
        const statusDiv = document.getElementById('embed-excel-status');
        let sheetData = [];
        let headers = [];
        let fileName = 'edited.xlsx';

        uploadInput.addEventListener('change', function () {
            const file = uploadInput.files[0];
            if (!file) return;
            statusDiv.textContent = 'Reading file...';
            fileName = file.name.replace(/\.(xlsx|xls|csv)$/i, '') + '_edited.xlsx';
            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    let data = e.target.result;
                    let wb;
                    if (file.name.endsWith('.csv')) {
                        wb = XLSX.read(data, { type: 'string' });
                    } else {
                        wb = XLSX.read(data, { type: 'array' });
                    }
                    // Use the first sheet
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    sheetData = XLSX.utils.sheet_to_json(ws, { defval: '' });
                    if (sheetData.length === 0) {
                        statusDiv.textContent = 'Sheet is empty.';
                        tableContainer.innerHTML = '';
                        saveBtn.disabled = true;
                        return;
                    }
                    headers = Object.keys(sheetData[0]);
                    renderTable();
                    saveBtn.disabled = false;
                    statusDiv.textContent = 'File loaded. Click any cell to edit.';
                } catch (err) {
                    statusDiv.textContent = 'Error reading file: ' + err.message;
                    tableContainer.innerHTML = '';
                    saveBtn.disabled = true;
                }
            };
            if (file.name.endsWith('.csv')) {
                reader.readAsText(file);
            } else {
                reader.readAsArrayBuffer(file);
            }
        });

        // Render editable table
        function renderTable() {
            let html = '<table id="embed-excel-table"><thead><tr>';
            headers.forEach(h => {
                html += `<th>${h}</th>`;
            });
            html += '</tr></thead><tbody>';
            sheetData.forEach((row, rowIdx) => {
                html += '<tr>';
                headers.forEach((h, colIdx) => {
                    html += `<td contenteditable="true" data-row="${rowIdx}" data-col="${h}">${row[h]}</td>`;
                });
                html += '</tr>';
            });
            html += '</tbody></table>';
            tableContainer.innerHTML = html;

            // Add cell edit listeners
            const cells = tableContainer.querySelectorAll('td[contenteditable]');
            cells.forEach(cell => {
                cell.addEventListener('input', function () {
                    const rowIdx = parseInt(cell.getAttribute('data-row'), 10);
                    const col = cell.getAttribute('data-col');
                    sheetData[rowIdx][col] = cell.textContent;
                });
            });
        }

        // Save/download logic
        saveBtn.onclick = function () {
            if (!sheetData.length) return;
            statusDiv.textContent = 'Preparing file...';
            try {
                const ws = XLSX.utils.json_to_sheet(sheetData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
                XLSX.writeFile(wb, fileName);
                statusDiv.textContent = 'File downloaded: ' + fileName;
            } catch (err) {
                statusDiv.textContent = 'Error saving file: ' + err.message;
            }
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