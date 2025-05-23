(function() {
    'use strict';
    var xssLink = document.createElement('link');
    xssLink.rel = 'stylesheet';
    xssLink.href = 'https://unpkg.com/x-data-spreadsheet@1.1.5/dist/xspreadsheet.css';
    document.head.appendChild(xssLink);
    // Expose the function to the global scope for testing
    try {
        module.exports = {
            addExistingItemEditorButton
        };
    } catch (e) {
        // Handle the error if needed
    }

    function addExistingItemEditorButton() {
        console.log('Attempting to add Existing Item Editor button');

        // Check if the button already exists
        if (document.getElementById('existingItemEditorButton')) {
            console.log('Existing Item Editor button already exists');
            return;
        }

        // Create the button using shared button styling
        var editorButton = document.createElement('button');
        editorButton.id = 'existingItemEditorButton';
        editorButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706l-1 1a.5.5 0 0 1-.708 0l-1-1a.5.5 0 0 1 0-.708l1-1a.5.5 0 0 1 .708 0l1 1zm-1.75 2.456-1-1L4 11.146V12h.854l8.898-8.898z"/><path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-7a.5.5 0 0 0-1 0v7a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/></svg> Edit Existing Item`;
        editorButton.className = 'button'; // Use common button class for consistent styling

        // Set positioning to align with other UI elements
        editorButton.style.position = 'fixed';
        editorButton.style.bottom = '50px';
        editorButton.style.left = '0';
        editorButton.style.width = '20%';
        editorButton.style.height = '40px';
        editorButton.style.zIndex = '1000';

        document.body.appendChild(editorButton);
        console.log('Existing Item Editor button added to the page');

        // Add click event to show options overlay
        editorButton.addEventListener('click', function() {
            console.log('Existing Item Editor button clicked');

            // Create overlay for editor options
            var overlay = document.createElement('div');
            overlay.id = 'existingItemEditorOverlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100vw';
            overlay.style.height = '100vh';
            overlay.style.background = 'rgba(0, 0, 0, 0.5)';
            overlay.style.zIndex = '1001';
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';

            // Create form container for options
            var formContainer = document.createElement('div');
            formContainer.style.position = 'relative';
            formContainer.style.background = '#fff';
            formContainer.style.padding = '0';
            formContainer.style.borderRadius = '12px';
            formContainer.style.width = '360px';
            formContainer.style.boxShadow = '0 8px 32px rgba(0,0,0,0.18), 0 1.5px 6px rgba(0,78,54,0.10)';
            formContainer.style.border = '1.5px solid #e0e0e0';
            formContainer.style.fontFamily = 'Segoe UI, Arial, sans-serif';
            formContainer.style.overflow = 'hidden';

            // Header bar
            var headerBar = document.createElement('div');
            headerBar.style.background = '#004E36';
            headerBar.style.color = '#fff';
            headerBar.style.padding = '16px 24px 12px 24px';
            headerBar.style.fontSize = '20px';
            headerBar.style.fontWeight = 'bold';
            headerBar.style.letterSpacing = '0.5px';
            headerBar.style.display = 'flex';
            headerBar.style.alignItems = 'center';
            headerBar.style.justifyContent = 'space-between';

            headerBar.innerHTML = `
                <span style="display:flex;align-items:center;gap:8px;">
                    Edit Existing Item
                    <span id="existingItemEditorInfoIcon" tabindex="0" aria-label="Show information" style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#e0e0e0;color:#004E36;font-weight:bold;font-size:15px;cursor:pointer;outline:none;transition:background 0.2s;">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style="display:block;">
                            <circle cx="10" cy="10" r="10" fill="#e0e0e0"/>
                            <text x="10" y="14" text-anchor="middle" font-size="12" font-family="Segoe UI, Arial, sans-serif" fill="#004E36" font-weight="bold">i</text>
                        </svg>
                    </span>
                </span>
            `;

            // Close button
            var closeButton = document.createElement('span');
            closeButton.innerHTML = '&times;';
            closeButton.id = 'existingItemEditorOverlayCloseButton';
            closeButton.style.fontSize = '28px';
            closeButton.style.cursor = 'pointer';
            closeButton.style.marginLeft = '16px';
            closeButton.style.color = '#fff';
            closeButton.style.background = 'transparent';
            closeButton.style.border = 'none';
            closeButton.style.padding = '0 4px';
            closeButton.style.borderRadius = '4px';
            closeButton.style.transition = 'background 0.2s';
            closeButton.addEventListener('mouseenter', function() {
                closeButton.style.background = 'rgba(0,0,0,0.12)';
            });
            closeButton.addEventListener('mouseleave', function() {
                closeButton.style.background = 'transparent';
            });
            closeButton.addEventListener('click', function() {
                document.body.removeChild(overlay);
            });
            headerBar.appendChild(closeButton);
            formContainer.appendChild(headerBar);

            // Info/disclaimer box (hidden by default, shown when info icon is clicked)
            var infoBox = document.createElement('div');
            infoBox.id = 'existingItemEditorInfoBox';
            infoBox.style.display = 'none';
            infoBox.style.position = 'absolute';
            infoBox.style.top = '54px';
            infoBox.style.left = '24px';
            infoBox.style.background = '#f5f7fa';
            infoBox.style.color = '#222';
            infoBox.style.borderLeft = '4px solid #004E36';
            infoBox.style.padding = '16px 22px 16px 18px';
            infoBox.style.borderRadius = '7px';
            infoBox.style.fontSize = '15px';
            infoBox.style.lineHeight = '1.7';
            infoBox.style.boxShadow = '0 2px 12px rgba(0,0,0,0.10)';
            infoBox.style.zIndex = '2002';
            infoBox.style.minWidth = '270px';
            infoBox.style.maxWidth = '340px';
            infoBox.style.maxHeight = '60vh';
            infoBox.style.overflowY = 'auto';
            infoBox.style.transition = 'opacity 0.2s';
            infoBox.setAttribute('role', 'dialog');
            infoBox.setAttribute('aria-modal', 'false');
            infoBox.tabIndex = -1;
            infoBox.innerHTML = `
                <div style="display:flex;align-items:flex-start;gap:12px;">
                    <svg width="22" height="22" fill="#004E36" viewBox="0 0 20 20" style="flex-shrink:0;margin-top:2px;">
                        <circle cx="10" cy="10" r="10" fill="#e0e0e0"/>
                        <text x="10" y="15" text-anchor="middle" font-size="13" font-family="Segoe UI, Arial, sans-serif" fill="#004E36" font-weight="bold">i</text>
                    </svg>
                    <div style="flex:1;">
                        <div style="font-weight:600;margin-bottom:2px;">Edit Existing Item (In Development)</div>
                        Use this tool to fetch and edit item data for a specific PLU and Store/Region.<br>
                        <div style="margin:7px 0 0 0;font-weight:600;">How to use:</div>
                        <ol style="margin:7px 0 0 18px;padding:0 0 0 0;">
                            <li>Enter the PLU code of the item you wish to edit.</li>
                            <li>Enter the Store or Region code where the item exists.</li>
                            <li>Click <b>Edit Item</b> to fetch the current data for that item.</li>
                            <li>Once loaded, you can implement further logic to edit and save changes.</li>
                        </ol>
                        <div style="margin:7px 0 0 0;font-weight:600;">Tips:</div>
                        <ul style="margin:4px 0 0 18px;padding:0 0 0 0;">
                            <li>Ensure the PLU and Store/Region codes are correct for best results.</li>
                            <li>If no item is found, double-check your input values.</li>
                        </ul>
                        <div style="margin:7px 0 0 0;font-weight:600;">Disclaimer:</div>
                        Editing functionality must be implemented as needed for your workflow.
                    </div>
                    <button id="closeEditorInfoBoxBtn" aria-label="Close information" style="background:transparent;border:none;color:#004E36;font-size:20px;font-weight:bold;cursor:pointer;line-height:1;padding:0 4px;margin-left:8px;border-radius:4px;transition:background 0.2s;">&times;</button>
                </div>
            `;
            formContainer.style.position = 'relative';
            formContainer.appendChild(infoBox);

            // Info icon click logic
            setTimeout(function() {
                var infoIcon = document.getElementById('existingItemEditorInfoIcon');
                var infoBox = document.getElementById('existingItemEditorInfoBox');
                if (infoIcon && infoBox) {
                    function showInfoBox() {
                        infoBox.style.display = 'block';
                        // Clamp position to viewport
                        setTimeout(function() {
                            var rect = infoBox.getBoundingClientRect();
                            var pad = 8;
                            var vpW = window.innerWidth, vpH = window.innerHeight;
                            // Clamp left/right
                            if (rect.right > vpW - pad) {
                                infoBox.style.left = Math.max(24, vpW - rect.width - pad) + 'px';
                            }
                            if (rect.left < pad) {
                                infoBox.style.left = pad + 'px';
                            }
                            // Clamp top/bottom
                            if (rect.bottom > vpH - pad) {
                                var newTop = Math.max(8, vpH - rect.height - pad);
                                infoBox.style.top = newTop + 'px';
                            }
                            if (rect.top < pad) {
                                infoBox.style.top = pad + 'px';
                            }
                        }, 0);
                        infoBox.focus();
                    }
                    function hideInfoBox() {
                        infoBox.style.display = 'none';
                        infoIcon.focus();
                    }
                    infoIcon.addEventListener('click', function(e) {
                        e.stopPropagation();
                        showInfoBox();
                    });
                    infoIcon.addEventListener('keydown', function(e) {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            showInfoBox();
                        }
                    });
                    // Close button inside infoBox
                    var closeBtn = document.getElementById('closeEditorInfoBoxBtn');
                    if (closeBtn) {
                        closeBtn.addEventListener('click', function(e) {
                            e.stopPropagation();
                            hideInfoBox();
                        });
                    }
                    // Dismiss infoBox on Escape key
                    infoBox.addEventListener('keydown', function(e) {
                        if (e.key === 'Escape') {
                            hideInfoBox();
                        }
                    });
                    // Optional: clicking outside infoBox closes it
                    document.addEventListener('mousedown', function handler(e) {
                        if (infoBox.style.display === 'block' && !infoBox.contains(e.target) && !infoIcon.contains(e.target)) {
                            hideInfoBox();
                        }
                    });
                }
            }, 0);

            // Content area
            var contentArea = document.createElement('div');
            contentArea.style.padding = '20px 24px 18px 24px';
            contentArea.style.display = 'flex';
            contentArea.style.flexDirection = 'column';
            contentArea.style.gap = '10px';

            // Main content HTML (example fields for editing an item)
            contentArea.innerHTML = `
                <label style="margin-top:2px;">PLU Code</label>
                <input type="text" id="editPluInput" style="width:100%;margin-bottom:2px;padding:8px 10px;border:1px solid #ccc;border-radius:5px;font-size:15px;" placeholder="Enter PLU code">
                <label style="margin-top:2px;">Store/Region</label>
                <input type="text" id="editStoreRegionInput" style="width:100%;margin-bottom:2px;padding:8px 10px;border:1px solid #ccc;border-radius:5px;font-size:15px;" placeholder="Enter Store/Region code">
                <button id="executeEditButton" class="button" style="width:100%;margin-top:12px;background:#004E36;color:#fff;border:none;border-radius:5px;padding:10px 0;font-size:16px;cursor:pointer;transition:background 0.2s;">Edit Item</button>
                <div id="editProgress" style="display:none;margin-top:10px;text-align:center;font-size:16px;color:#004E36;">Waiting...</div>
                <button id="cancelEditButton" class="button" style="width:100%;margin-top:10px;background:#e74c3c;color:#fff;border:none;border-radius:5px;padding:10px 0;font-size:16px;cursor:pointer;transition:background 0.2s;">Cancel</button>
            `;
            formContainer.appendChild(contentArea);

            // Cancel edit: remove overlay
            formContainer.querySelector('#cancelEditButton').addEventListener('click', function() {
                document.body.removeChild(overlay);
            });

            overlay.appendChild(formContainer);
            document.body.appendChild(overlay);

            // Execute edit button event (API logic)
            formContainer.querySelector('#executeEditButton').addEventListener('click', function() {
                var progress = document.getElementById('editProgress');
                progress.style.display = 'block';
                progress.innerHTML = 'Processing...';

                const pluCode = document.getElementById('editPluInput').value.trim();
                const storeRegion = document.getElementById('editStoreRegionInput').value.trim();

                if (!pluCode || !storeRegion) {
                    progress.innerHTML = 'PLU and Store/Region required.';
                    return;
                }

                // Determine the environment (prod or gamma)
                const environment = window.location.hostname.includes('gamma') ? 'gamma' : 'prod';
                const apiUrlBase = `https://${environment}.cam.wfm.amazon.dev/api/`;

                // Example: Fetch item data for editing (adapt as needed)
                const headers = {
                    'accept': '*/*',
                    'accept-encoding': 'gzip, deflate, br',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/x-amz-json-1.0',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    'x-amz-target': 'WfmCamBackendService.GetItemsAvailability'
                };

                const payload = {
                    "filterContext": {
                        "storeIds": [storeRegion],
                        "pluCodes": [pluCode]
                    },
                    "paginationContext": {
                        "pageNumber": 0,
                        "pageSize": 100
                    }
                };

                fetch(apiUrlBase, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(payload),
                    credentials: 'include'
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Item data received:', data);
                    if (data && data.itemsAvailability && data.itemsAvailability.length > 0) {
                        progress.innerHTML = 'Item data loaded.';

                        // --- Best Practices: Constants and Helpers ---
                        const SPREADSHEET_CONTAINER_ID = 'existingItemSpreadsheetContainer';
                        const DOWNLOAD_BTN_ID = 'downloadExistingItemCsvButton';
                        const SHEET_WIDTH = 'min(95vw, 900px)';
                        const SHEET_HEIGHT = '420px';
                        const DESIRED_HEADERS = [
                            'Store - 3 Letter Code',
                            'Item Name',
                            'Item PLU/UPC',
                            'Availability',
                            'Current Inventory',
                            'Sales Floor Capacity',
                            'Andon Cord',
                            'Tracking Start Date',
                            'Tracking End Date'
                        ];

                        function transformItemToRow(item, storeId) {
                            return [
                                storeId,
                                item.itemName || '',
                                item.wfmScanCode || '',
                                item.inventoryStatus || '',
                                (item.inventoryStatus === 'Unlimited' ? "0" : (Math.max(0, Math.min(10000, parseInt(item.currentInventoryQuantity) || 0))).toString()),
                                '',
                                item.andonCordState ? 'Enabled' : 'Disabled',
                                '',
                                ''
                            ];
                        }

                        function toXSheetData(arr) {
                            return {
                                name: 'Sheet1',
                                rows: arr.reduce((rows, row, rIdx) => {
                                    rows[rIdx] = { cells: row.reduce((cells, val, cIdx) => {
                                        cells[cIdx] = { text: val };
                                        return cells;
                                    }, {}) };
                                    return rows;
                                }, {})
                            };
                        }

                        function removeElementById(id) {
                            const el = document.getElementById(id);
                            if (el) el.remove();
                        }

                        // --- Remove any previous spreadsheet container and download button ---
                        removeElementById(SPREADSHEET_CONTAINER_ID);
                        removeElementById(DOWNLOAD_BTN_ID);

                        // --- Create region/store selector container ---
                        const selectorContainer = document.createElement('div');
                        selectorContainer.style.display = 'flex';
                        selectorContainer.style.alignItems = 'center';
                        selectorContainer.style.justifyContent = 'flex-start';
                        selectorContainer.style.gap = '12px';
                        selectorContainer.style.margin = '24px 0 8px 0';
                        selectorContainer.style.width = '100%';

                        // Store/Region dropdown
                        const storeRegionLabel = document.createElement('label');
                        storeRegionLabel.textContent = 'Store/Region:';
                        storeRegionLabel.style.fontWeight = '500';
                        storeRegionLabel.style.marginRight = '6px';

                        const storeRegionInput = document.createElement('input');
                        storeRegionInput.type = 'text';
                        storeRegionInput.id = 'editStoreRegionInputLive';
                        storeRegionInput.value = storeRegion;
                        storeRegionInput.placeholder = 'Enter Store/Region code';
                        storeRegionInput.style.padding = '6px 10px';
                        storeRegionInput.style.border = '1px solid #ccc';
                        storeRegionInput.style.borderRadius = '5px';
                        storeRegionInput.style.fontSize = '15px';
                        storeRegionInput.style.width = '180px';

                        selectorContainer.appendChild(storeRegionLabel);
                        selectorContainer.appendChild(storeRegionInput);

                        // Insert selector above spreadsheet
                        progress.parentNode.insertBefore(selectorContainer, progress.nextSibling);

                        // --- Create spreadsheet container ---
                        const sheetContainer = document.createElement('div');
                        sheetContainer.id = SPREADSHEET_CONTAINER_ID;
                        sheetContainer.style.width = '100%';
                        sheetContainer.style.height = 'auto';
                        sheetContainer.style.minHeight = '420px';
                        sheetContainer.style.margin = '0 auto 0 auto';
                        sheetContainer.style.background = '#fff';
                        sheetContainer.style.border = '1.5px solid #e0e0e0';
                        sheetContainer.style.borderRadius = '8px';
                        sheetContainer.style.overflow = 'auto';
                        sheetContainer.setAttribute('aria-label', 'Editable spreadsheet of item data');
                        sheetContainer.setAttribute('tabindex', '0');
                        sheetContainer.style.maxWidth = '98vw';
                        sheetContainer.style.minWidth = '320px';
                        // Insert after selector
                        selectorContainer.parentNode.insertBefore(sheetContainer, selectorContainer.nextSibling);

                        // --- Prepare data for x-spreadsheet ---
                        const items = data.itemsAvailability;
                        const storeId = storeRegion;
                        const sheetData = [
                            DESIRED_HEADERS,
                            ...items.map(item => transformItemToRow(item, storeId))
                        ];
                        const xsData = toXSheetData(sheetData);

                        // --- Initialize x-spreadsheet ---
                        let xs = null;
                        if (window.x_spreadsheet) {
                            // Calculate numeric width based on container or fallback
                            let containerWidth = sheetContainer.offsetWidth;
                            if (!containerWidth || containerWidth < 600) containerWidth = Math.min(window.innerWidth * 0.95, 900);
                            let containerHeight = Math.max(sheetData.length * 28 + 40, 420); // 28px per row + header

                            xs = window.x_spreadsheet(sheetContainer, {
                                showToolbar: true,
                                showGrid: true,
                                view: { height: Math.floor(containerHeight), width: Math.floor(containerWidth) },
                                row: { len: sheetData.length, height: 28 },
                                col: { len: DESIRED_HEADERS.length, width: 120 }
                            });
                            xs.loadData(xsData);

                            // Responsive: update spreadsheet size on window resize
                            window.addEventListener('resize', function () {
                                let newWidth = sheetContainer.offsetWidth;
                                if (!newWidth || newWidth < 600) newWidth = Math.min(window.innerWidth * 0.95, 900);
                                let newHeight = Math.max(sheetData.length * 28 + 40, 420);
                                xs.sheet.data.view = { width: Math.floor(newWidth), height: Math.floor(newHeight) };
                                xs.reload();
                            });
                        } else {
                            sheetContainer.innerHTML = '<div style="color:red;padding:20px;">x-spreadsheet library not loaded.</div>';
                        }

                        // --- Add Download CSV button ---
                        const downloadBtn = document.createElement('button');
                        downloadBtn.id = DOWNLOAD_BTN_ID;
                        downloadBtn.textContent = 'Download CSV';
                        downloadBtn.className = 'button';
                        downloadBtn.style.width = '100%';
                        downloadBtn.style.marginTop = '10px';
                        downloadBtn.style.background = '#004E36';
                        downloadBtn.style.color = '#fff';
                        downloadBtn.style.border = 'none';
                        downloadBtn.style.borderRadius = '5px';
                        downloadBtn.style.padding = '10px 0';
                        downloadBtn.style.fontSize = '16px';
                        downloadBtn.style.cursor = 'pointer';
                        downloadBtn.style.transition = 'background 0.2s';
                        downloadBtn.setAttribute('aria-label', 'Download the current spreadsheet as CSV');
                        downloadBtn.addEventListener('mouseenter', function() {
                            downloadBtn.style.background = '#218838';
                        });
                        downloadBtn.addEventListener('mouseleave', function() {
                            downloadBtn.style.background = '#004E36';
                        });

                        // Insert after spreadsheet
                        sheetContainer.parentNode.insertBefore(downloadBtn, sheetContainer.nextSibling);

                        downloadBtn.onclick = function() {
                            if (!window.x_spreadsheet || !xs) {
                                alert('Spreadsheet not loaded.');
                                return;
                            }
                            const data = xs.getData();
                            const rows = data.rows;
                            // Find max column count for header
                            let maxCol = 0;
                            Object.values(rows).forEach(r => {
                                const cLen = r.cells ? Math.max(...Object.keys(r.cells).map(Number)) + 1 : 0;
                                if (cLen > maxCol) maxCol = cLen;
                            });
                            // Build CSV rows
                            const csvRows = [];
                            for (let r = 0; r < Object.keys(rows).length; r++) {
                                const row = [];
                                for (let c = 0; c < maxCol; c++) {
                                    const cell = rows[r] && rows[r].cells && rows[r].cells[c] ? rows[r].cells[c].text : '';
                                    row.push('"' + String(cell).replace(/"/g, '""') + '"');
                                }
                                csvRows.push(row.join(','));
                            }
                            const csvContent = csvRows.join('\n');
                            const blob = new Blob([csvContent], { type: "text/csv" });
                            const link = document.createElement("a");
                            link.href = URL.createObjectURL(blob);
                            link.download = "ExistingItemEdit.csv";
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        };

                        // (Removed duplicate Download CSV button creation block to prevent redeclaration errors)
                    } else {
                        progress.innerHTML = 'No item found for given PLU and Store/Region.';
                    }
                })
                .catch(error => {
                    console.error('Error fetching item data:', error);
                    progress.innerHTML = 'An error occurred.';
                });
            });
        });
    }

    // Use MutationObserver to detect changes and add the button when needed
    const observer = new MutationObserver(addExistingItemEditorButton);
    observer.observe(document.body, { childList: true, subtree: true });

    // Expose for testing
    try {
        module.exports = {
            addExistingItemEditorButton
        };
    } catch (e) {
        // Handle the error if needed
    }
    // Initial attempt to add the button
    addExistingItemEditorButton();
})();
