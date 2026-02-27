(function() {
    'use strict';

    // ------------------------------------------------------------------
    //  HELPER: Generate CSV for add-item data
    // ------------------------------------------------------------------
    function generateCSV(storeCodes, plu, currentInventory, availability, andonCord, trackingStartDate, trackingEndDate) {
        let csvContent = 'Store - 3 Letter Code,Item Name,Item PLU/UPC,Availability,Current Inventory,Sales Floor Capacity,Andon Cord,Tracking Start Date,Tracking End Date\n';

        storeCodes.forEach(store => {
            plu.forEach(pluCode => {
                csvContent += `${store},Name_Does_Not_Matter,${pluCode},${availability},${currentInventory},,${andonCord},${trackingStartDate},${trackingEndDate}\n`;
            });
        });

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'add_item_data.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // ------------------------------------------------------------------
    //  HELPER: Fetch all store TLCs from the CAM API
    // ------------------------------------------------------------------
    function fetchAllStoreCodes() {
        return new Promise((resolve, reject) => {
            const environment = window.location.hostname.includes('gamma') ? 'gamma' : 'prod';
            const apiUrlBase = `https://${environment}.cam.wfm.amazon.dev/api/`;

            const headersStores = {
                'accept': '*/*',
                'accept-encoding': 'gzip, deflate, br',
                'accept-language': 'en-US,en;q=0.9',
                'content-type': 'application/x-amz-json-1.0',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'x-amz-target': 'WfmCamBackendService.GetStoresInformation'
            };

            fetch(apiUrlBase, {
                method: 'POST',
                headers: headersStores,
                body: JSON.stringify({}),
                credentials: 'include'
            })
            .then(response => response.json())
            .then(storeData => {
                if (!storeData || !storeData.storesInformation) {
                    throw new Error('Invalid store data received');
                }

                const storeCodes = [];
                for (const region in storeData.storesInformation) {
                    const states = storeData.storesInformation[region];
                    for (const st in states) {
                        const stores = states[st];
                        stores.forEach(store => {
                            storeCodes.push(store.storeTLC);
                        });
                    }
                }
                resolve(storeCodes);
            })
            .catch(error => {
                console.error('[AddItem] Error fetching store codes:', error);
                reject(error);
            });
        });
    }

    // ------------------------------------------------------------------
    //  STYLES  (styles are now provided by globalPieces.js / tm-theme.js;
    //           only module-specific overrides go here)
    // ------------------------------------------------------------------

    function addAddItemButton() {
        console.log('[AddItem] Attempting to add button');

        // Check if the button already exists
        if (document.getElementById('addItemButton')) {
            console.log('[AddItem] Button already exists');
            return;
        }

        // Create the add new item(s) button
        const addItemButton = document.createElement('button');
        addItemButton.className = 'button';
        addItemButton.id = 'addItemButton';
        addItemButton.innerHTML = 'Add New Item(s)';
        addItemButton.style.position = 'fixed';
        addItemButton.style.bottom = '0';
        addItemButton.style.left = '20%';
        addItemButton.style.width = '20%';
        addItemButton.style.height = '40px';
        addItemButton.style.zIndex = '1000';
        addItemButton.style.fontSize = '14px';
        addItemButton.style.backgroundColor = '#1a1a1a';
        addItemButton.style.color = '#f1f1f1';
        addItemButton.style.border = '1px solid #303030';
        addItemButton.style.borderRadius = '4px';
        addItemButton.style.cursor = 'pointer';
        addItemButton.style.transition = 'background 150ms ease';
        addItemButton.style.fontFamily = "'Roboto', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif";

        // Append the button to the body
        document.body.appendChild(addItemButton);
        console.log('[AddItem] Button added');
        addItemButton.addEventListener('mouseover', function(){
            addItemButton.style.backgroundColor = '#242424';
        });
        addItemButton.addEventListener('mouseout', function(){
            addItemButton.style.backgroundColor = '#1a1a1a';
        });

        // Add click event to the add new item(s) button
        addItemButton.addEventListener('click', function() {
            // Password requirement before opening overlay
            var pw = prompt('Enter password to access Add New Item(s):');
            if (pw !== 'Leeloo') {
                alert('Incorrect password. Access denied.');
                return;
            }
            console.log('[AddItem] Button clicked');
            // Create overlay
            const overlay = document.createElement('div');
            overlay.id = 'addItemOverlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100vw';
            overlay.style.height = '100vh';
            overlay.style.background = 'rgba(0,0,0,0.6)';
            overlay.style.zIndex = '9995';
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';

            // Card container
            var formContainer = document.createElement('div');
            formContainer.style.position = 'relative';
            formContainer.style.background = '#1a1a1a';
            formContainer.style.padding = '0';
            formContainer.style.borderRadius = '12px';
            formContainer.style.width = '360px';
            formContainer.style.maxWidth = '95vw';
            formContainer.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)';
            formContainer.style.border = '1px solid #303030';
            formContainer.style.fontFamily = "'Roboto', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif";
            formContainer.style.overflow = 'hidden';
            formContainer.style.color = '#f1f1f1';

            // Header bar
            var headerBar = document.createElement('div');
            headerBar.style.background = '#242424';
            headerBar.style.color = '#f1f1f1';
            headerBar.style.padding = '10px 16px 8px 16px';
            headerBar.style.fontSize = '17px';
            headerBar.style.fontWeight = 'bold';
            headerBar.style.letterSpacing = '0.5px';
            headerBar.style.display = 'flex';
            headerBar.style.alignItems = 'center';
            headerBar.style.justifyContent = 'space-between';
            headerBar.innerHTML = `<span>Add New Item</span>`;

            // Close button
            const closeButton = document.createElement('span');
            closeButton.innerHTML = '&times;';
            closeButton.id = 'addItemOverlayCloseButton';
            closeButton.style.fontSize = '22px';
            closeButton.style.cursor = 'pointer';
            closeButton.style.marginLeft = '8px';
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
infoBox.id = 'addItemOverlayInfoBox';
infoBox.style.display = 'none';
infoBox.style.position = 'absolute';
infoBox.style.top = '48px';
infoBox.style.left = '16px';
infoBox.style.background = '#242424';
infoBox.style.color = '#f1f1f1';
infoBox.style.borderLeft = '4px solid #004E36';
infoBox.style.padding = '14px 18px 14px 16px';
infoBox.style.borderRadius = '7px';
infoBox.style.fontSize = '15px';
infoBox.style.lineHeight = '1.7';
infoBox.style.boxShadow = '0 2px 12px rgba(0,0,0,0.10)';
infoBox.style.zIndex = '2002';
infoBox.style.minWidth = '240px';
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
            <div style="font-weight:600;margin-bottom:2px;">Add New Item(s)</div>
            Use this tool to generate upload files for adding new items to selected stores.<br>
            <div style="margin:7px 0 0 0;font-weight:600;">How to use:</div>
            <ol style="margin:7px 0 0 18px;padding:0 0 0 0;">
                <li>Enter a store code or check "All Stores" to include all stores.</li>
                <li>Enter one or more PLU codes (comma-separated) for the items to add.</li>
                <li>Fill in the current inventory, availability, andon cord state, and tracking dates as needed.</li>
                <li>Click <b>Generate File</b> to compile the data. Progress will be shown.</li>
                <li>When complete, a CSV file will be downloaded to your computer.</li>
            </ol>
            <div style="margin:7px 0 0 0;font-weight:600;">Tips:</div>
            <ul style="margin:4px 0 0 18px;padding:0 0 0 0;">
                <li>Use "All Stores" to add items to every store in the system.</li>
                <li>Both tracking dates must be filled if one is provided.</li>
                <li>If you encounter issues, check that all required fields are filled and try again.</li>
            </ul>
            <div style="margin:7px 0 0 0;font-weight:600;">Disclaimer:</div>
            The downloaded file <b>can cause extreme damage to the data integrity of CAM's catalog use with caution.</b>
        </div>
        <button id="closeAddItemInfoBoxBtn" aria-label="Close information" style="background:transparent;border:none;color:#aaaaaa;font-size:20px;font-weight:bold;cursor:pointer;line-height:1;padding:0 4px;margin-left:8px;border-radius:4px;transition:color 150ms ease;">&times;</button>
    </div>
`;
formContainer.style.position = 'relative';
formContainer.appendChild(infoBox);

// Add info icon to headerBar
var infoIcon = document.createElement('span');
infoIcon.id = 'addItemOverlayInfoIcon';
infoIcon.tabIndex = 0;
infoIcon.setAttribute('aria-label', 'Show information');
infoIcon.style.display = 'inline-flex';
infoIcon.style.alignItems = 'center';
infoIcon.style.justifyContent = 'center';
infoIcon.style.width = '20px';
infoIcon.style.height = '20px';
infoIcon.style.borderRadius = '50%';
infoIcon.style.background = '#e0e0e0';
infoIcon.style.color = '#004E36';
infoIcon.style.fontWeight = 'bold';
infoIcon.style.fontSize = '15px';
infoIcon.style.cursor = 'pointer';
infoIcon.style.marginLeft = '8px';
infoIcon.style.transition = 'background 0.2s';
infoIcon.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style="display:block;">
        <circle cx="10" cy="10" r="10" fill="#e0e0e0"/>
        <text x="10" y="14" text-anchor="middle" font-size="12" font-family="Segoe UI, Arial, sans-serif" fill="#004E36" font-weight="bold">i</text>
    </svg>
`;
headerBar.querySelector('span').appendChild(infoIcon);

// Info icon click logic
setTimeout(function() {
    var infoIcon = document.getElementById('addItemOverlayInfoIcon');
    var infoBox = document.getElementById('addItemOverlayInfoBox');
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
                    infoBox.style.left = Math.max(16, vpW - rect.width - pad) + 'px';
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
        var closeBtn = document.getElementById('closeAddItemInfoBoxBtn');
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
            contentArea.style.padding = '12px 16px';
            contentArea.style.display = 'flex';
            contentArea.style.flexDirection = 'column';
            contentArea.style.gap = '6px';
            contentArea.style.maxHeight = '80vh';
            contentArea.style.overflowY = 'auto';

            // Main content HTML
            contentArea.innerHTML = `
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="flex:1;">
                        <label style="margin-bottom:2px;display:block;">Store - 3 Letter Code</label>
                        <input type="text" id="storeCode" style="width:100%;padding:6px 8px;border:1px solid #ccc;border-radius:5px;font-size:14px;" placeholder="AAA">
                    </div>
                    <label style="font-weight:500;display:flex;align-items:center;gap:4px;margin-top:18px;">
                        <input type="checkbox" id="allStoresCheckbox" style="margin-right:4px;"> All Stores
                    </label>
                </div>
                <label style="margin-bottom:2px;">PLU</label>
                <input type="text" id="plu" style="width:100%;padding:6px 8px;border:1px solid #ccc;border-radius:5px;font-size:14px;" placeholder="Enter PLU(s) separated by commas">
                <label style="margin-bottom:2px;">Current Inventory</label>
                <input type="number" id="currentInventory" style="width:100%;padding:6px 8px;border:1px solid #ccc;border-radius:5px;font-size:14px;" placeholder="0">
                <label style="margin-bottom:2px;">Availability</label>
                <select id="availability" style="width:100%;padding:6px 8px;border:1px solid #ccc;border-radius:5px;font-size:14px;">
                    <option value="Limited">Limited</option>
                    <option value="Unlimited">Unlimited</option>
                </select>
                <label style="margin-bottom:2px;">Andon Cord</label>
                <select id="andonCord" style="width:100%;padding:6px 8px;border:1px solid #ccc;border-radius:5px;font-size:14px;">
                    <option value="Enabled">Enabled</option>
                    <option value="Disabled">Disabled</option>
                </select>
                <label style="margin-bottom:2px;">Tracking Start Date</label>
                <input type="date" id="trackingStartDate" style="width:100%;padding:6px 8px;border:1px solid #ccc;border-radius:5px;font-size:14px;">
                <label style="margin-bottom:2px;">Tracking End Date</label>
                <input type="date" id="trackingEndDate" style="width:100%;padding:6px 8px;border:1px solid #ccc;border-radius:5px;font-size:14px;">
                <button id="generateFileButton" style="width:100%;margin-top:10px;background:var(--tm-accent-primary, #3ea6ff);color:#0f0f0f;border:none;border-radius:4px;padding:8px 0;font-size:14px;font-weight:500;cursor:pointer;transition:background 150ms ease;">Generate File</button>
            `;
            formContainer.appendChild(contentArea);
            overlay.appendChild(formContainer);
            document.body.appendChild(overlay);

            // Ensure elements exist before attaching event listeners
            var availabilityElement = document.getElementById('availability');
            var generateFileButton = document.getElementById('generateFileButton');

            // Add event listener to the "All Stores" checkbox
            document.getElementById('allStoresCheckbox').addEventListener('change', function() {
                const storeCodeInput = document.getElementById('storeCode');
                storeCodeInput.disabled = this.checked;
                if (this.checked) {
                    storeCodeInput.value = '';
                }
            });

            if (availabilityElement) {
                availabilityElement.addEventListener('change', function() {
                    var currentInventoryField = document.getElementById('currentInventory');
                    if (this.value === 'Unlimited') {
                        currentInventoryField.value = 0;
                        currentInventoryField.disabled = true;
                    } else {
                        currentInventoryField.disabled = false;
                    }

                });
            }

            if (generateFileButton) {
                generateFileButton.addEventListener('click', function() {
                    // Collect input values
                    var storeCode = document.getElementById('storeCode').value;
                    if (document.getElementById('allStoresCheckbox').checked) {
                        // Fetch all store codes
                        fetchAllStoreCodes().then(allStoreCodes => {
                            console.log('All Store Codes:', allStoreCodes);
                            if (!Array.isArray(allStoreCodes)) {
                                console.error('Error: storeCodes is not an array');
                                return;
                            }
                            // Extract all values from the DOM inside the .then() callback to ensure correct context
                            const plu = Array.from(new Set((document.getElementById('plu').value || '').split(',').map(p => p.trim())));
                            const currentInventory = document.getElementById('currentInventory') ? document.getElementById('currentInventory').value : '';
                            const availability = document.getElementById('availability') ? document.getElementById('availability').value : '';
                            const andonCord = document.getElementById('andonCord') ? document.getElementById('andonCord').value : '';
                            const trackingStartDate = document.getElementById('trackingStartDate') ? document.getElementById('trackingStartDate').value : '';
                            const trackingEndDate = document.getElementById('trackingEndDate') ? document.getElementById('trackingEndDate').value : '';

                            // Debug log for all values
                            console.log('PLU Array:', plu);
                            console.log('Current Inventory:', currentInventory);
                            console.log('Availability:', availability);
                            console.log('Andon Cord:', andonCord);
                            console.log('Tracking Start Date:', trackingStartDate);
                            console.log('Tracking End Date:', trackingEndDate);

                            if (!Array.isArray(plu)) {
                                console.error('Error: plu is not an array');
                                return;
                            }
                            generateCSV(allStoreCodes, plu, currentInventory, availability, andonCord, trackingStartDate, trackingEndDate);
                        }).catch(error => {
                            console.error('Error fetching store codes:', error);
                        });
                        return;
                    }
                    var plu = document.getElementById('plu').value;
                    var currentInventory = document.getElementById('currentInventory').value;
                    var availability = document.getElementById('availability').value;
                    var andonCord = document.getElementById('andonCord').value;
                    
                    console.log('PLU:', plu);
                    console.log('Current Inventory:', currentInventory);
                    console.log('Availability:', availability);
                    console.log('Andon Cord:', andonCord);

                    // Check if all required fields are filled
                    if ((!storeCode && !document.getElementById('allStoresCheckbox').checked) || !plu || !availability || !andonCord) {
                        alert('Please fill in all required fields before generating the file.');
                        return;
                    }

                    // Check if both tracking dates are filled if one is provided
                    const trackingStartDate = document.getElementById('trackingStartDate').value;
                    const trackingEndDate = document.getElementById('trackingEndDate').value;

                    if ((trackingStartDate && !trackingEndDate) || (!trackingStartDate && trackingEndDate)) {
                        if (window.TmTheme && window.TmTheme.showToast) {
                            window.TmTheme.showToast('Please provide both Tracking Start Date and Tracking End Date.', 'warning', 4000);
                        } else {
                            alert('Please provide both Tracking Start Date and Tracking End Date.');
                        }
                        return;
                    }

                    // Split store codes and PLUs by commas
                    const storeCodes = Array.from(new Set(storeCode.split(',').map(code => code.trim())));
                    const plus = Array.from(new Set(plu.split(',').map(p => p.trim())));

                    generateCSV(storeCodes, plus, currentInventory, availability, andonCord, trackingStartDate, trackingEndDate);
                });
            }
        });
    }

    // Initialize the add item button
    addAddItemButton();

    // Module export for testing (at end of IIFE)
    try {
        module.exports = {
            addAddItemButton,
            generateCSV,
            fetchAllStoreCodes
        };
    } catch (e) {
        // Browser environment
    }
})();
