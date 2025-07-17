(function() {
    'use strict';

    // Expose the function to the global scope for testing
    try {
        module.exports = {
            addMassUploaderFunctionality
        };
    } catch (e) {
        // Handle the error if needed
    }

    /**
     * Enhanced Mass Uploader with integrated file chunking functionality.
     * Users can either upload individual files/folders OR chunk a large CSV file and upload the chunks.
     * Includes an information button with detailed instructions.
     */
    function addMassUploaderFunctionality() {
        console.log('Enhanced Mass Uploader button clicked');

        // Inject helper script for file assignment (bypass userscript sandbox restrictions)
        if (!window.__MU_injected) {
            window.__MU_injected = true;
            const s = document.createElement('script');
            s.textContent = `
                window.addEventListener('message', e => {
                    if (e.data?.type === 'MU_SET_FILE') {
                        const file = e.data.file;
                        const input = [...document.querySelectorAll('input[type=file]')]
                            .find(el => !el.id || !['massFileInput', 'csvFileInput'].includes(el.id));
                        if (input) {
                            const dt = new DataTransfer();
                            dt.items.add(file);
                            input.files = dt.files;
                            input.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    }
                });
            `;
            document.documentElement.appendChild(s);
            s.remove();
        }

        // Make fileStates accessible to all handlers
        let fileStates = {};

        // === Inject modal styles if not already present ===
        if (!document.getElementById('massUploaderModalStyles')) {
            const style = document.createElement('style');
            style.id = 'massUploaderModalStyles';
            style.textContent = `
                #massUploaderOverlay {
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    background: rgba(0,0,0,0.5); z-index: 1001;
                    display: flex; justify-content: center; align-items: center;
                }
                .massUploader-card {
                    background: #fff;
                    border-radius: 12px;
                    width: 420px;
                    max-width: 98vw;
                    max-height: 90vh;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 2px 6px rgba(0,78,54,0.10);
                    font-family: 'Segoe UI', Arial, sans-serif;
                    position: relative;
                    padding: 0;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                .massUploader-header {
                    background: #004E36;
                    color: #fff;
                    padding: 16px 24px 12px 24px;
                    font-size: 19px;
                    font-weight: bold;
                    letter-spacing: 0.5px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-shrink: 0;
                }
                .massUploader-close {
                    font-size: 26px;
                    cursor: pointer;
                    color: #fff;
                    background: transparent;
                    border: none;
                    padding: 0 4px;
                    border-radius: 4px;
                    transition: background 0.2s;
                }
                .massUploader-close:hover {
                    background: rgba(0,0,0,0.12);
                }
                .massUploader-body {
                    padding: 18px 22px 18px 22px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    overflow-y: auto;
                    flex: 1;
                }
                .massUploader-instructions {
                    font-size: 15px;
                    color: #222;
                    margin-bottom: 6px;
                }
                .massUploader-label {
                    display: block;
                    margin-bottom: 10px;
                    cursor: pointer;
                    background-color: #e0e0e0;
                    padding: 8px;
                    text-align: center;
                    border-radius: 5px;
                    font-weight: 500;
                    color: #004E36;
                    transition: background 0.2s;
                }
                .massUploader-label:hover, .massUploader-label:focus {
                    background: #c8e6c9;
                }
                .massUploader-section {
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 12px;
                    background: #fafbfc;
                }
                .massUploader-section-title {
                    font-weight: 600;
                    font-size: 16px;
                    color: #004E36;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .massUploader-radio-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-bottom: 12px;
                }
                .massUploader-radio-option {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    padding: 4px;
                }
                .massUploader-chunking-options {
                    display: none;
                    margin-top: 12px;
                    padding-top: 12px;
                    border-top: 1px solid #e0e0e0;
                }
                .massUploader-chunking-options.active {
                    display: block;
                }
                .massUploader-input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    margin-bottom: 10px;
                }
                .massUploader-input-group label {
                    font-weight: 500;
                    font-size: 14px;
                    color: #333;
                }
                .massUploader-input-group input, .massUploader-input-group select {
                    padding: 8px 10px;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                    font-size: 14px;
                }
                #selectedFolderLabel, #selectedFileLabel {
                    text-align: center;
                    margin-bottom: 10px;
                    color: #444;
                    font-size: 14px;
                }
                #massUploadButton {
                    width: 100%;
                    background: #004E36;
                    color: #fff;
                    border: none;
                    border-radius: 5px;
                    padding: 10px 0;
                    font-size: 16px;
                    cursor: pointer;
                    transition: background 0.2s;
                    margin-bottom: 4px;
                }
                #massUploadButton:disabled {
                    background: #bdbdbd;
                    cursor: not-allowed;
                }
                #statusContainer {
                    margin-top: 10px;
                    max-height: 220px;
                    overflow-y: auto;
                    border: 1px solid #e0e0e0;
                    padding: 0;
                    background: #fafbfc;
                    border-radius: 7px;
                    font-size: 14px;
                    display: block;
                    visibility: visible;
                }
                .massUploader-statusHeader {
                    display: flex;
                    align-items: center;
                    font-weight: 600;
                    font-size: 13px;
                    color: #004E36;
                    background: #f2f7f4;
                    border-bottom: 1px solid #e0e0e0;
                    padding: 6px 10px 6px 10px;
                    gap: 8px;
                }
                .massUploader-statusRow {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 7px 10px 7px 10px;
                    border-bottom: 1px solid #e0e0e0;
                    min-height: 32px;
                    background: #fff;
                    transition: background 0.2s;
                }
                .massUploader-statusRow:last-child {
                    border-bottom: none;
                }
                .massUploader-statusText {
                    flex: 1 1 auto;
                    font-size: 13px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    text-align: left;
                    display: flex;
                    align-items: center;
                    min-height: 18px;
                }
                .status-waiting { color: #888; }
                .status-injecting { color: #e67e22; }
                .status-success { color: #388e3c; }
                .status-warning { color: #ff9800; font-weight: 500; }
                .status-error { color: #c62828; }
                .status-chunking { color: #2196f3; }
                
                /* Info box styles */
                .massUploader-infoBox {
                    display: none;
                    position: absolute;
                    top: 54px;
                    left: 24px;
                    background: #f5f7fa;
                    color: #222;
                    border-left: 4px solid #004E36;
                    padding: 16px 22px 16px 18px;
                    border-radius: 7px;
                    font-size: 15px;
                    line-height: 1.7;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.10);
                    z-index: 2002;
                    min-width: 320px;
                    max-width: 380px;
                    max-height: 60vh;
                    overflow-y: auto;
                    transition: opacity 0.2s;
                }
                
                /* Fix for status container visibility */
                .massUploader-body {
                    flex: 1 1 auto;
                    overflow-y: auto;
                }
                #statusContainer {
                    flex: 1 1 auto;
                    min-height: 120px;
                    max-height: 50vh;
                }
                
                /* Summary styling */
                .massUploader-summary {
                    margin-top: 15px;
                    padding: 12px;
                    border: 2px solid #004E36;
                    border-radius: 6px;
                    background: #f8f9fa;
                }
                .massUploader-summary h4 {
                    margin: 0 0 8px 0;
                    color: #004E36;
                    font-size: 16px;
                }
                .massUploader-summary p {
                    margin: 4px 0;
                    font-size: 14px;
                }
                .massUploader-summary details {
                    margin-top: 8px;
                }
                .massUploader-summary summary {
                    cursor: pointer;
                    font-weight: bold;
                    color: #c62828;
                    font-size: 14px;
                }
                .massUploader-summary ul {
                    margin: 8px 0;
                    padding-left: 20px;
                }
                .massUploader-summary li {
                    margin: 4px 0;
                    font-size: 13px;
                }
            `;
            document.head.appendChild(style);
        }

        // === Overlay ===
        const overlay = document.createElement('div');
        overlay.id = 'massUploaderOverlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.tabIndex = -1;

        // === Card container ===
        const card = document.createElement('div');
        card.className = 'massUploader-card';

        // === Header ===
        const header = document.createElement('div');
        header.className = 'massUploader-header';
        header.innerHTML = `
            <span style="display:flex;align-items:center;gap:8px;">
                Mass Upload & Chunker
                <span id="massUploaderInfoIcon" tabindex="0" aria-label="Show information" style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#e0e0e0;color:#004E36;font-weight:bold;font-size:15px;cursor:pointer;outline:none;transition:background 0.2s;">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style="display:block;">
                        <circle cx="10" cy="10" r="10" fill="#e0e0e0"/>
                        <text x="10" y="14" text-anchor="middle" font-size="12" font-family="Arial" fill="#004E36" font-weight="bold">i</text>
                    </svg>
                </span>
            </span>
        `;
        
        // Close button
        const closeButton = document.createElement('button');
        closeButton.className = 'massUploader-close';
        closeButton.setAttribute('aria-label', 'Close Mass Upload dialog');
        closeButton.innerHTML = '&times;';
        closeButton.onclick = () => {
            document.body.removeChild(overlay);
            if (window._massUploaderTrigger) window._massUploaderTrigger.focus();
        };
        header.appendChild(closeButton);
        card.appendChild(header);

        // === Info Box ===
        const infoBox = document.createElement('div');
        infoBox.id = 'massUploaderInfoBox';
        infoBox.className = 'massUploader-infoBox';
        infoBox.setAttribute('role', 'dialog');
        infoBox.setAttribute('aria-modal', 'false');
        infoBox.tabIndex = -1;
        infoBox.innerHTML = `
            <div style="display:flex;align-items:flex-start;gap:12px;">
                <svg width="22" height="22" fill="#004E36" viewBox="0 0 20 20" style="flex-shrink:0;margin-top:2px;">
                    <circle cx="10" cy="10" r="10" fill="#e0e0e0"/>
                    <text x="10" y="15" text-anchor="middle" font-size="13" font-family="Arial" fill="#004E36" font-weight="bold">i</text>
                </svg>
                <div style="flex:1;">
                    <div style="font-weight:600;margin-bottom:2px;">Mass Upload & File Chunker</div>
                    Upload multiple files or chunk large CSV files for batch processing.<br>
                    <div style="margin:7px 0 0 0;font-weight:600;">Upload Options:</div>
                    <ul style="margin:7px 0 0 18px;padding:0 0 0 0;">
                        <li><b>Upload Files/Folder</b>: Select multiple files or an entire folder to upload sequentially.</li>
                        <li><b>Chunk & Upload CSV</b>: Split a large CSV file into smaller chunks and upload them automatically.</li>
                    </ul>
                    <div style="margin:7px 0 0 0;font-weight:600;">Chunking Process:</div>
                    <ol style="margin:7px 0 0 18px;padding:0 0 0 0;">
                        <li>Select "Chunk & Upload CSV" option</li>
                        <li>Choose your large CSV file</li>
                        <li>Set rows per chunk (default: 1000)</li>
                        <li>Enable/disable upload validation</li>
                        <li>Click "Process & Upload" - the system will automatically chunk the file and upload each piece</li>
                    </ol>
                    <div style="margin:7px 0 0 0;font-weight:600;">Features:</div>
                    <ul style="margin:4px 0 0 18px;padding:0 0 0 0;">
                        <li>Automatic CSV validation and header checking</li>
                        <li>Progress tracking for each file/chunk</li>
                        <li>Manual status marking (grey/red/yellow/green)</li>
                        <li>30-second spacing between uploads to prevent overload</li>
                        <li>Toast message capture for upload status</li>
                    </ul>
                    <div style="margin:7px 0 0 0;font-weight:600;">Requirements:</div>
                    <ul style="margin:4px 0 0 18px;padding:0 0 0 0;">
                        <li>JSZip library must be loaded for chunking functionality</li>
                        <li>CSV files should follow the expected format for validation</li>
                    </ul>
                </div>
                <button id="closeMassUploaderInfoBoxBtn" aria-label="Close information" style="background:transparent;border:none;color:#004E36;font-size:20px;font-weight:bold;cursor:pointer;line-height:1;padding:0 4px;margin-left:8px;border-radius:4px;transition:background 0.2s;">&times;</button>
            </div>
        `;
        card.appendChild(infoBox);

        // === Body ===
        const body = document.createElement('div');
        body.className = 'massUploader-body';

        // Instructions
        const instructions = document.createElement('div');
        instructions.className = 'massUploader-instructions';
        instructions.innerHTML = `Choose your upload method: upload multiple files/folders OR chunk a large CSV file and upload the pieces automatically.`;
        body.appendChild(instructions);

        // Upload method selection
        const methodSection = document.createElement('div');
        methodSection.className = 'massUploader-section';
        methodSection.innerHTML = `
            <div class="massUploader-section-title">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                </svg>
                Upload Method
            </div>
            <div class="massUploader-radio-group">
                <label class="massUploader-radio-option">
                    <input type="radio" name="uploadMethod" value="files" checked>
                    <span>Upload Files/Folder</span>
                </label>
                <label class="massUploader-radio-option">
                    <input type="radio" name="uploadMethod" value="chunk">
                    <span>Chunk & Upload CSV</span>
                </label>
            </div>
        `;
        body.appendChild(methodSection);

        // Files upload section
        const filesSection = document.createElement('div');
        filesSection.id = 'filesUploadSection';
        filesSection.className = 'massUploader-section';
        filesSection.innerHTML = `
            <div class="massUploader-section-title">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M4 0h5.293A1 1 0 0 1 10 .293L13.707 4a1 1 0 0 1 .293.707V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm5.5 1.5v2a1 1 0 0 0 1 1h2l-3-3z"/>
                </svg>
                Select Files/Folder
            </div>
            <label class="massUploader-label" for="massFileInput" tabindex="0">Choose Folder</label>
            <p id="selectedFolderLabel">No folder selected</p>
            <input type="file" id="massFileInput" style="display: none;" multiple webkitdirectory>
        `;
        body.appendChild(filesSection);

        // CSV chunking section
        const chunkingSection = document.createElement('div');
        chunkingSection.id = 'csvChunkingSection';
        chunkingSection.className = 'massUploader-section';
        chunkingSection.style.display = 'none';
        chunkingSection.innerHTML = `
            <div class="massUploader-section-title">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
                    <path d="M8.646 6.646a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1 0 .708l-2 2a.5.5 0 0 1-.708-.708L10.293 9 8.646 7.354a.5.5 0 0 1 0-.708zM5.354 7.354a.5.5 0 0 0-.708 0l-2 2a.5.5 0 0 0 0 .708l2 2a.5.5 0 0 0 .708-.708L3.707 9l1.647-1.646a.5.5 0 0 0 0-.708z"/>
                </svg>
                CSV File & Chunking Options
            </div>
            <label class="massUploader-label" for="csvFileInput" tabindex="0">Choose CSV File</label>
            <p id="selectedFileLabel">No file selected</p>
            <input type="file" id="csvFileInput" style="display: none;" accept=".csv">
            
            <div class="massUploader-input-group">
                <label for="rowsPerChunk">Rows Per Chunk</label>
                <input type="number" id="rowsPerChunk" value="1000" min="1" max="10000">
            </div>
            
            <label class="massUploader-radio-option">
                <input type="checkbox" id="uploadValidation" checked>
                <span>Enable Upload Validation</span>
            </label>
        `;
        body.appendChild(chunkingSection);

        // Upload button
        const uploadButton = document.createElement('button');
        uploadButton.id = 'massUploadButton';
        uploadButton.innerText = 'Upload';
        uploadButton.disabled = true;
        body.appendChild(uploadButton);

        // Status container
        console.log('[MassUploader] Creating status container');
        const statusContainer = document.createElement('div');
        statusContainer.id = 'statusContainer';
        body.appendChild(statusContainer);
        console.log('[MassUploader] Status container created and appended:', statusContainer);

        card.appendChild(body);
        overlay.appendChild(card);
        document.body.appendChild(overlay);

        // === Info icon functionality ===
        setTimeout(() => {
            const infoIcon = document.getElementById('massUploaderInfoIcon');
            const infoBox = document.getElementById('massUploaderInfoBox');
            if (infoIcon && infoBox) {
                function showInfoBox() {
                    infoBox.style.display = 'block';
                    setTimeout(() => {
                        const rect = infoBox.getBoundingClientRect();
                        const pad = 8;
                        const vpW = window.innerWidth, vpH = window.innerHeight;
                        if (rect.right > vpW - pad) {
                            infoBox.style.left = Math.max(24, vpW - rect.width - pad) + 'px';
                        }
                        if (rect.left < pad) {
                            infoBox.style.left = pad + 'px';
                        }
                        if (rect.bottom > vpH - pad) {
                            const newTop = Math.max(8, vpH - rect.height - pad);
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
                infoIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showInfoBox();
                });
                infoIcon.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        showInfoBox();
                    }
                });
                const closeBtn = document.getElementById('closeMassUploaderInfoBoxBtn');
                if (closeBtn) {
                    closeBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        hideInfoBox();
                    });
                }
                infoBox.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        hideInfoBox();
                    }
                });
                document.addEventListener('mousedown', function handler(e) {
                    if (infoBox.style.display === 'block' && !infoBox.contains(e.target) && !infoIcon.contains(e.target)) {
                        hideInfoBox();
                    }
                });
            }
        }, 0);

        // === Upload method radio button logic ===
        const methodRadios = document.querySelectorAll('input[name="uploadMethod"]');
        const filesSection_el = document.getElementById('filesUploadSection');
        const chunkingSection_el = document.getElementById('csvChunkingSection');
        
        methodRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.value === 'files') {
                    filesSection_el.style.display = 'block';
                    chunkingSection_el.style.display = 'none';
                    uploadButton.innerText = 'Upload';
                    // Reset file selections
                    document.getElementById('selectedFolderLabel').textContent = 'No folder selected';
                    document.getElementById('massFileInput').value = '';
                    uploadButton.disabled = true;
                } else if (this.value === 'chunk') {
                    filesSection_el.style.display = 'none';
                    chunkingSection_el.style.display = 'block';
                    uploadButton.innerText = 'Process & Upload';
                    // Reset file selections
                    document.getElementById('selectedFileLabel').textContent = 'No file selected';
                    document.getElementById('csvFileInput').value = '';
                    uploadButton.disabled = true;
                }
            });
        });

        // === Accessibility: focus management ===
        setTimeout(() => {
            const folderLabel = document.querySelector('label[for="massFileInput"]');
            if (folderLabel) folderLabel.focus();
        }, 0);

        // Function to update status row display and styling
        function updateStatusRow(file, state, errorMsg = '') {
            const fileKey = file.webkitRelativePath || file.name;
            const fileId = `status-${btoa(fileKey).replace(/[=+/]/g, '')}`;
            const fileStatusDiv = document.getElementById(fileId);
            if (!fileStatusDiv) {
                console.warn('[MassUploader] Status row not found for file:', fileKey);
                return;
            }

            if (!fileStates[fileKey]) {
                fileStates[fileKey] = { state: 'waiting', error: null, checkboxState: 0 };
            }
            fileStates[fileKey].state = state;
            fileStates[fileKey].error = errorMsg || null;

            switch (state) {
                case 'waiting':
                    fileStatusDiv.className = 'massUploader-statusText status-waiting';
                    fileStatusDiv.innerText = `${file.name} - Waiting`;
                    break;
                case 'injecting':
                    fileStatusDiv.className = 'massUploader-statusText status-injecting';
                    fileStatusDiv.innerText = `${file.name} - Injecting...`;
                    break;
                case 'success':
                    fileStatusDiv.className = 'massUploader-statusText status-success';
                    fileStatusDiv.innerText = `${file.name} - Injected${errorMsg ? '. Status: ' + errorMsg : '.'}`;
                    break;
                case 'warning':
                    fileStatusDiv.className = 'massUploader-statusText status-warning';
                    fileStatusDiv.innerText = `${file.name} - Partial Success: ${errorMsg}`;
                    break;
                case 'error':
                    fileStatusDiv.className = 'massUploader-statusText status-error';
                    fileStatusDiv.innerText = `${file.name} - Error: ${errorMsg}`;
                    break;
                default:
                    fileStatusDiv.className = 'massUploader-statusText';
                    fileStatusDiv.innerText = `${file.name} - ${state.charAt(0).toUpperCase() + state.slice(1)}`;
            }

            // Update tri-button color based on current checkbox state
            const cbState = fileStates[fileKey]?.checkboxState ?? 0;
            const row = fileStatusDiv.parentElement;
            if (row) {
                const btn = row.querySelector('button');
                const circ = btn && btn.querySelector('span');
                if (circ) {
                    switch (cbState) {
                        case 0: circ.style.background = '#ccc'; circ.style.borderColor = '#888'; break;
                        case 1: circ.style.background = '#c62828'; circ.style.borderColor = '#c62828'; break;
                        case 2: circ.style.background = '#fbc02d'; circ.style.borderColor = '#fbc02d'; break;
                        case 3: circ.style.background = '#388e3c'; circ.style.borderColor = '#388e3c'; break;
                    }
                }
            }
        }

        // Function to create individual file tracking row
        function createFileTrackingRow(file) {
            console.log('[MassUploader] createFileTrackingRow called for file:', file.name);
            const fileKey = file.webkitRelativePath || file.name;
            const fileId = `status-${btoa(fileKey).replace(/[=+/]/g, '')}`;
            console.log('[MassUploader] fileKey:', fileKey, 'fileId:', fileId);
            
            // Container for each file status
            const fileStatusRow = document.createElement('div');
            fileStatusRow.className = 'massUploader-statusRow';
            console.log('[MassUploader] Created fileStatusRow:', fileStatusRow);

            // Tri-state/quad-state indicator (custom button)
            const triBtn = document.createElement('button');
            triBtn.type = 'button';
            triBtn.title = 'Toggle status: grey → red → yellow → green → grey';
            triBtn.style.margin = '0 8px 0 0';
            triBtn.style.width = '22px';
            triBtn.style.height = '22px';
            triBtn.style.border = 'none';
            triBtn.style.background = 'none';
            triBtn.style.padding = '0';
            triBtn.style.cursor = 'pointer';
            triBtn.style.display = 'flex';
            triBtn.style.alignItems = 'center';
            triBtn.style.justifyContent = 'center';

            // Custom state: 0=grey, 1=red, 2=yellow, 3=green
            let cbState = 0;
            fileStates[fileKey] = { state: 'waiting', error: null, checkboxState: 0 };

            // Visual indicator (circle)
            const circle = document.createElement('span');
            circle.style.display = 'inline-block';
            circle.style.width = '16px';
            circle.style.height = '16px';
            circle.style.borderRadius = '50%';
            circle.style.border = '2px solid #888';
            circle.style.background = '#ccc';
            circle.style.transition = 'background 0.2s, border 0.2s';

            triBtn.appendChild(circle);

            // Status text
            const fileStatus = document.createElement('div');
            fileStatus.id = fileId;
            fileStatus.className = 'massUploader-statusText status-waiting';
            fileStatus.innerText = `${file.name} - Waiting`;

            // TriBtn click cycles through states
            triBtn.addEventListener('click', function(e) {
                cbState = (cbState + 1) % 4;
                fileStates[fileKey].checkboxState = cbState;
                updateStatusRow(file, fileStates[fileKey].state, fileStates[fileKey].error);
            });

            fileStatusRow.appendChild(triBtn);
            fileStatusRow.appendChild(fileStatus);
            console.log('[MassUploader] About to append fileStatusRow to statusContainer');
            console.log('[MassUploader] statusContainer before append:', statusContainer);
            console.log('[MassUploader] fileStatusRow to append:', fileStatusRow);
            statusContainer.appendChild(fileStatusRow);
            console.log('[MassUploader] fileStatusRow appended successfully');
            
            // Auto-scroll to keep the newest row in view
            fileStatusRow.scrollIntoView({block: 'nearest'});
            console.log('[MassUploader] statusContainer after append:', statusContainer.innerHTML);

            // Helper to update triBtn color
            function updateTriBtnColor(cbState) {
                switch (cbState) {
                    case 0: // grey
                        circle.style.background = '#ccc';
                        circle.style.borderColor = '#888';
                        break;
                    case 1: // red
                        circle.style.background = '#c62828';
                        circle.style.borderColor = '#c62828';
                        break;
                    case 2: // yellow
                        circle.style.background = '#fbc02d';
                        circle.style.borderColor = '#fbc02d';
                        break;
                    case 3: // green
                        circle.style.background = '#388e3c';
                        circle.style.borderColor = '#388e3c';
                        break;
                }
            }

            // Set initial tri-button color and status
            updateTriBtnColor(cbState);
            updateStatusRow(file, 'waiting');
        }

        // Function to display files and create status tracking immediately when files are selected
        function displayFilesWithStatus(files) {
            console.log('[MassUploader] displayFilesWithStatus called with files:', files);
            console.log('[MassUploader] statusContainer:', statusContainer);
            console.log('[MassUploader] statusContainer exists:', !!statusContainer);
            console.log('[MassUploader] statusContainer in DOM:', !!document.getElementById('statusContainer'));
            
            if (!statusContainer) {
                console.error('[MassUploader] statusContainer not found!');
                return;
            }
            
            // Clear previous status
            statusContainer.innerHTML = '';
            console.log('[MassUploader] statusContainer cleared');

            // Display file names and initial status
            // Add a header row for clarity
            statusContainer.innerHTML = `
                <div class="massUploader-statusHeader">
                    <span style="width:22px;flex-shrink:0;">Mark</span>
                    <span style="flex:1 1 auto;">File</span>
                </div>
            `;
            console.log('[MassUploader] Header added to statusContainer');
            console.log('[MassUploader] statusContainer innerHTML after header:', statusContainer.innerHTML);
            
            Array.from(files).forEach((file, index) => {
                console.log(`[MassUploader] Processing file ${index + 1}:`, file.name);
                createFileTrackingRow(file);
            });
            
            console.log('[MassUploader] displayFilesWithStatus completed');
            console.log('[MassUploader] Final statusContainer innerHTML:', statusContainer.innerHTML);
        }

        // === Files upload logic ===
        const fileInput = document.getElementById('massFileInput');
        const folderLabel = document.querySelector('label[for="massFileInput"]');
        
        fileInput.addEventListener('change', function() {
            console.log('[MassUploader] File input change event fired, files count:', this.files.length);
            if (this.files.length > 0) {
                const folderName = this.files[0].webkitRelativePath
                    ? this.files[0].webkitRelativePath.split('/')[0]
                    : (this.files[0].name || 'Selected');
                document.getElementById('selectedFolderLabel').textContent = "Selected folder: " + folderName;
                uploadButton.disabled = false;
                
                console.log('[MassUploader] About to call displayFilesWithStatus');
                console.log('[MassUploader] statusContainer exists:', !!statusContainer);
                console.log('[MassUploader] statusContainer in DOM:', !!document.getElementById('statusContainer'));
                
                // Display files with status tracking immediately
                displayFilesWithStatus(this.files);
            } else {
                console.log('[MassUploader] No files selected');
                document.getElementById('selectedFolderLabel').textContent = "No folder selected";
                uploadButton.disabled = true;
                // Clear status container
                statusContainer.innerHTML = '';
            }
        });

        folderLabel.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInput.click();
            }
        });

        // === CSV file upload logic ===
        const csvFileInput = document.getElementById('csvFileInput');
        const csvLabel = document.querySelector('label[for="csvFileInput"]');
        
        csvFileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                document.getElementById('selectedFileLabel').textContent = "Selected file: " + this.files[0].name;
                uploadButton.disabled = false;
            } else {
                document.getElementById('selectedFileLabel').textContent = "No file selected";
                uploadButton.disabled = true;
            }
        });

        csvLabel.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                csvFileInput.click();
            }
        });

        // === File chunking function (from FileChunker.js) ===
        function chunkCSVFile(file, rowsPerFile, doValidation) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = function(event) {
                    try {
                        const csvData = event.target.result;
                        const expectedHeader = "Store - 3 Letter Code,Item Name,Item PLU/UPC,Availability,Current Inventory,Sales Floor Capacity,Andon Cord,Tracking Start Date,Tracking End Date";
                        
                        // Custom CSV parser
                        function customParseCSV(data) {
                            const lines = data.split('\n');
                            const parsedData = [];
                            const expectedColumns = 9;
                        
                            lines.forEach(line => {
                                let fields = line.split(',');
                                for (let i = 0; i < fields.length - 1; i++) {
                                    if (fields[i].endsWith(',') && fields[i + 1].startsWith(' ')) {
                                        fields[i] = fields[i] + fields[i + 1];
                                        fields.splice(i + 1, 1);
                                    }
                                }
                                while (fields.length < expectedColumns) {
                                    fields.push('');
                                }
                                parsedData.push(fields);
                            });
                        
                            return parsedData;
                        }
                        
                        const parsedData = customParseCSV(csvData);
                        if (parsedData.length === 0) {
                            reject(new Error('CSV file is empty.'));
                            return;
                        }
                        
                        const header = parsedData[0].join(',');
                        if (doValidation && header.trim() !== expectedHeader.trim()) {
                            reject(new Error("CSV header does not match expected format.\nExpected: " + expectedHeader));
                            return;
                        }
                        
                        // Filter out blank rows
                        const dataRows = [];
                        for (let i = 1; i < parsedData.length; i++) {
                            const isBlank = parsedData[i].every(field => field.trim() === "");
                            const joined = parsedData[i].join(',').replace(/[\s,]/g, "");
                            if (!isBlank && joined.length > 0) {
                                dataRows.push(parsedData[i].join(','));
                            }
                        }

                        const totalChunks = Math.ceil(dataRows.length / rowsPerFile);
                        const chunks = [];
                        
                        for (let i = 0; i < totalChunks; i++) {
                            const chunkData = dataRows.slice(i * rowsPerFile, (i + 1) * rowsPerFile);
                            const chunkCsv = [header].concat(chunkData).join('\n');
                            const chunkBlob = new Blob([chunkCsv], { type: 'text/csv' });
                            const chunkFile = new File([chunkBlob], `chunk_${i + 1}.csv`, { type: 'text/csv' });
                            chunks.push(chunkFile);
                        }
                        
                        resolve(chunks);
                    } catch (err) {
                        reject(err);
                    }
                };
                reader.readAsText(file);
            });
        }

        /**
         * Centralized polling manager to prevent race conditions
         * Ensures only one polling instance is active at a time
         */
        class PollingManager {
            constructor() {
                this.activePolling = null;
                this.processedAlerts = new Map(); // fileId -> Set of alert IDs
                this.pollingInterval = null;
                this.maxPollingTime = 45000; // 45 seconds
                this.pollingFrequency = 100; // Poll every 100ms
                this.alertCleanupDelay = 100; // Small delay for cleanup
                this.errorFileData = []; // Store error file data
            }
            
            /**
             * Start polling for a specific file
             * @param {File} file - The file being processed
             * @param {number} fileIndex - Index of the file in the upload queue
             * @returns {Promise} Promise that resolves with polling result
             */
            async startPolling(file, fileIndex) {
                console.log(`[PollingManager] Starting polling for file: ${file.name} (index: ${fileIndex})`);
                
                // Ensure no active polling
                if (this.activePolling) {
                    console.log('[PollingManager] Waiting for existing polling to complete...');
                    await this.waitForCompletion();
                }
                
                // Clean up previous alerts to prevent cross-contamination
                this.cleanupPreviousAlerts();
                
                // Start new polling session
                const fileId = `file_${fileIndex}_${Date.now()}`;
                return new Promise((resolve, reject) => {
                    this.activePolling = {
                        file,
                        fileIndex,
                        fileId,
                        resolve,
                        reject,
                        startTime: Date.now(),
                        alertsDetected: [],
                        completed: false,
                        finalOutcome: null
                    };
                    
                    console.log(`[PollingManager] Created polling session: ${fileId}`);
                    this.startPollingLoop();
                });
            }
            
            /**
             * Start the main polling loop
             */
            startPollingLoop() {
                let elapsed = 0;
                
                this.pollingInterval = setInterval(() => {
                    if (!this.activePolling || this.activePolling.completed) {
                        this.stopPolling();
                        return;
                    }
                    
                    this.checkForAlerts();
                    
                    elapsed += this.pollingFrequency;
                    if (elapsed >= this.maxPollingTime) {
                        console.log(`[PollingManager] Polling timeout for ${this.activePolling.file.name}`);
                        this.completePolling('timeout');
                    }
                }, this.pollingFrequency);
            }
            
            /**
             * Check for new alerts and process them
             */
            checkForAlerts() {
                const alertElements = document.querySelectorAll('div[mdn-alert-message]');
                
                alertElements.forEach(alertElement => {
                    if (this.shouldProcessAlert(alertElement)) {
                        this.processAlert(alertElement);
                    }
                });
            }
            
            /**
             * Determine if an alert should be processed by current polling session
             * @param {Element} alertElement - The alert DOM element
             * @returns {boolean} Whether to process this alert
             */
            shouldProcessAlert(alertElement) {
                const fileId = this.activePolling.fileId;
                
                // Skip if already processed by this file
                if (alertElement.dataset.muProcessedBy === fileId) {
                    return false;
                }
                
                // Skip if processed by any file (prevent cross-contamination)
                if (alertElement.dataset.muProcessed === 'true') {
                    return false;
                }
                
                return true;
            }
            
            /**
             * Process a single alert element
             * @param {Element} alertElement - The alert DOM element to process
             */
            async processAlert(alertElement) {
                const fileId = this.activePolling.fileId;
                const file = this.activePolling.file;
                
                // Mark as processed by this file to prevent reprocessing
                alertElement.dataset.muProcessedBy = fileId;
                alertElement.dataset.muProcessed = 'true';
                alertElement.dataset.muFileIndex = this.activePolling.fileIndex;
                
                const alertText = alertElement.innerText.trim();
                console.log(`[PollingManager] Processing alert for ${file.name}: ${alertText.substring(0, 100)}...`);
                
                try {
                    const classification = await classifyAlert(alertElement, alertText, file.name, this);
                    this.activePolling.alertsDetected.push(classification);
                    
                    // Update UI based on classification
                    this.updateFileStatus(classification);
                    
                    // Check if this alert indicates completion
                    if (this.shouldCompletePolling(classification)) {
                        console.log(`[PollingManager] Completing polling with outcome: ${classification.type}`);
                        this.completePolling(classification.type);
                    }
                } catch (error) {
                    console.error(`[PollingManager] Error processing alert for ${file.name}:`, error);
                }
            }
            
            /**
             * Update file status in UI based on alert classification
             * @param {Object} classification - Alert classification result
             */
            updateFileStatus(classification) {
                const file = this.activePolling.file;
                
                switch (classification.type) {
                    case 'success_file':
                        updateStatusRow(file, 'success', classification.message);
                        this.activePolling.finalOutcome = 'success';
                        break;
                    case 'partial_failure':
                        updateStatusRow(file, 'warning', classification.message);
                        this.activePolling.finalOutcome = 'partial_failure';
                        break;
                    case 'validation_error':
                    case 'server_error':
                        updateStatusRow(file, 'error', classification.message);
                        this.activePolling.finalOutcome = 'error';
                        break;
                    case 'partial_success':
                        // Partial success usually comes with partial failure, don't override outcome
                        if (!this.activePolling.finalOutcome) {
                            console.log('[PollingManager] Partial success detected, waiting for more alerts...');
                        }
                        break;
                    default:
                        if (classification.severity === 'success') {
                            updateStatusRow(file, 'success', classification.message);
                            this.activePolling.finalOutcome = 'success';
                        }
                }
            }
            
            /**
             * Determine if polling should complete based on alert classification
             * @param {Object} classification - Alert classification result
             * @returns {boolean} Whether to complete polling
             */
            shouldCompletePolling(classification) {
                // Complete on definitive outcomes
                if (['success_file', 'validation_error', 'server_error'].includes(classification.type)) {
                    return true;
                }
                
                // Handle partial failure + partial success combination
                const hasPartialFailure = this.activePolling.alertsDetected.some(alert => alert.type === 'partial_failure');
                const hasPartialSuccess = this.activePolling.alertsDetected.some(alert => alert.type === 'partial_success');
                
                if (hasPartialFailure && hasPartialSuccess) {
                    return true;
                }
                
                // Wait for potential partial_success after partial_failure
                if (hasPartialFailure && !hasPartialSuccess) {
                    const elapsed = Date.now() - this.activePolling.startTime;
                    return elapsed >= 3000; // 3 second wait
                }
                
                return false;
            }
            
            /**
             * Complete the current polling session
             * @param {string} outcome - Final outcome of the polling
             */
            completePolling(outcome) {
                if (!this.activePolling || this.activePolling.completed) {
                    return;
                }
                
                console.log(`[PollingManager] Completing polling for ${this.activePolling.file.name} with outcome: ${outcome}`);
                
                this.activePolling.completed = true;
                this.stopPolling();
                
                const result = {
                    outcome: outcome || this.activePolling.finalOutcome || 'success',
                    alerts: this.activePolling.alertsDetected,
                    file: this.activePolling.file,
                    fileIndex: this.activePolling.fileIndex,
                    fileId: this.activePolling.fileId
                };
                
                // Small delay to ensure all DOM updates complete
                setTimeout(() => {
                    this.activePolling.resolve(result);
                    this.activePolling = null;
                }, this.alertCleanupDelay);
            }
            
            /**
             * Stop the polling interval
             */
            stopPolling() {
                if (this.pollingInterval) {
                    clearInterval(this.pollingInterval);
                    this.pollingInterval = null;
                }
            }
            
            /**
             * Clean up alerts from previous polling sessions
             */
            cleanupPreviousAlerts() {
                console.log('[PollingManager] Cleaning up previous alerts');
                
                // Remove old processed markers to prevent buildup
                const oldAlerts = document.querySelectorAll('div[mdn-alert-message][data-mu-processed="true"]');
                let cleanedCount = 0;
                
                oldAlerts.forEach(alert => {
                    // Only clean up alerts that are not from the current session
                    if (this.activePolling && alert.dataset.muProcessedBy === this.activePolling.fileId) {
                        return; // Skip current session alerts
                    }
                    
                    delete alert.dataset.muProcessed;
                    delete alert.dataset.muProcessedBy;
                    delete alert.dataset.muFileIndex;
                    cleanedCount++;
                });
                
                console.log(`[PollingManager] Cleaned up ${cleanedCount} old alert markers`);
            }
            
            /**
             * Wait for current polling to complete
             * @returns {Promise} Promise that resolves when polling is complete
             */
            async waitForCompletion() {
                if (!this.activePolling) {
                    return;
                }
                
                return new Promise((resolve) => {
                    const checkCompletion = () => {
                        if (!this.activePolling || this.activePolling.completed) {
                            resolve();
                        } else {
                            setTimeout(checkCompletion, 50);
                        }
                    };
                    checkCompletion();
                });
            }
            
            /**
             * Check if polling is currently active
             * @returns {boolean} Whether polling is active
             */
            isPollingActive() {
                return this.activePolling !== null && !this.activePolling.completed;
            }
        }

        // Function to download and save error file data
        async function downloadErrorFile(downloadLink, fileName, pollingManager) {
            try {
                console.log(`[MassUploader] Downloading error file for ${fileName}:`, downloadLink);
                const response = await fetch(downloadLink);
                if (response.ok) {
                    const csvText = await response.text();
                    const errorData = {
                        fileName: fileName,
                        downloadedAt: new Date().toISOString(),
                        csvData: csvText,
                        recordCount: csvText.split('\n').length - 1 // Subtract header
                    };
                    // Store in polling manager's error file data
                    if (pollingManager) {
                        pollingManager.errorFileData.push(errorData);
                    }
                    console.log(`[MassUploader] Error file data saved for ${fileName}, ${errorData.recordCount} failed records`);
                    return errorData;
                } else {
                    console.error(`[MassUploader] Failed to download error file for ${fileName}:`, response.status);
                    return null;
                }
            } catch (error) {
                console.error(`[MassUploader] Error downloading file for ${fileName}:`, error);
                return null;
            }
        }

        // Function to classify alerts based on content and visual cues
        async function classifyAlert(alertElement, alertText, fileName, pollingManager) {
            const alertStyle = window.getComputedStyle(alertElement);
            const backgroundColor = alertStyle.backgroundColor;
            const color = alertStyle.color;
            
            // Check for download links and capture them
            const downloadLinkElement = alertElement.querySelector('a[href*="download"], a[href*="error"], button[onclick*="download"], [class*="download"]');
            const hasDownloadLink = downloadLinkElement !== null || alertText.toLowerCase().includes('download error file');
            
            // Normalize text for pattern matching
            const normalizedText = alertText.toLowerCase().trim();
            
            console.log('[MassUploader] Classifying alert:', {
                text: alertText,
                backgroundColor,
                color,
                hasDownloadLink,
                normalizedText
            });
            
            console.log('[MassUploader] Alert text analysis:', {
                includesRecordsFailed: normalizedText.includes('records failed to upload'),
                includesFailed: normalizedText.includes('failed'),
                includesUpload: normalizedText.includes('upload'),
                includesRecordsSuccess: normalizedText.includes('records successfully uploaded'),
                includesCSV: normalizedText.includes('.csv'),
                includesSuccessfullyUploaded: normalizedText.includes('successfully uploaded')
            });
            
            // Success patterns - CSV file successfully uploaded
            if (normalizedText.includes('successfully uploaded') && normalizedText.includes('.csv')) {
                const result = {
                    type: 'success_file',
                    severity: 'success',
                    message: alertText,
                    shouldProceed: true
                };
                console.log('[MassUploader] Classification: success_file', result);
                return result;
            }
            
            // Partial failure - records failed to upload (with or without download link)
            if (normalizedText.includes('records failed to upload') ||
                (normalizedText.includes('failed') && normalizedText.includes('upload'))) {
                
                // If there's a download link, immediately download the error file
                let errorFileDownloaded = null;
                if (downloadLinkElement && downloadLinkElement.href) {
                    try {
                        errorFileDownloaded = await downloadErrorFile(downloadLinkElement.href, fileName, pollingManager);
                    } catch (error) {
                        console.error('[MassUploader] Failed to download error file:', error);
                    }
                }
                
                const result = {
                    type: 'partial_failure',
                    severity: 'warning',
                    message: alertText,
                    shouldProceed: true, // Can proceed but mark as partial failure
                    hasErrorFile: hasDownloadLink,
                    errorFileData: errorFileDownloaded
                };
                console.log('[MassUploader] Classification: partial_failure', result);
                return result;
            }
            
            // Partial success (usually paired with failure)
            if (normalizedText.includes('records successfully uploaded') && !normalizedText.includes('.csv')) {
                const result = {
                    type: 'partial_success',
                    severity: 'info',
                    message: alertText,
                    shouldProceed: true
                };
                console.log('[MassUploader] Classification: partial_success', result);
                return result;
            }
            
            // Validation errors
            if (normalizedText.includes('validation error') || normalizedText.includes('headers must be')) {
                const result = {
                    type: 'validation_error',
                    severity: 'error',
                    message: alertText,
                    shouldProceed: false // Stop processing
                };
                console.log('[MassUploader] Classification: validation_error', result);
                return result;
            }
            
            // Server errors
            if (normalizedText.includes('server error') || normalizedText.includes('try again later')) {
                const result = {
                    type: 'server_error',
                    severity: 'error',
                    message: alertText,
                    shouldProceed: false // Stop processing
                };
                console.log('[MassUploader] Classification: server_error', result);
                return result;
            }
            
            // Generic success (fallback)
            if (normalizedText.includes('success')) {
                const result = {
                    type: 'generic_success',
                    severity: 'success',
                    message: alertText,
                    shouldProceed: true
                };
                console.log('[MassUploader] Classification: generic_success', result);
                return result;
            }
            
            // Unknown alert type
            const result = {
                type: 'unknown',
                severity: 'info',
                message: alertText,
                shouldProceed: true // Default to proceed unless explicitly an error
            };
            
            console.log('[MassUploader] Classification result:', result);
            return result;
        }


        // === Upload logic ===
        uploadButton.addEventListener('click', async () => {
            const selectedMethod = document.querySelector('input[name="uploadMethod"]:checked').value;
            let filesToUpload = [];

            if (selectedMethod === 'files') {
                // Regular file/folder upload
                const files = fileInput.files;
                if (!files || files.length === 0) {
                    alert('Please select files to upload.');
                    return;
                }
                filesToUpload = Array.from(files);
            } else if (selectedMethod === 'chunk') {
                // CSV chunking and upload
                const csvFile = csvFileInput.files[0];
                if (!csvFile) {
                    alert('Please select a CSV file to chunk and upload.');
                    return;
                }

                const rowsPerFile = parseInt(document.getElementById('rowsPerChunk').value, 10);
                if (isNaN(rowsPerFile) || rowsPerFile < 1) {
                    alert('Please enter a valid number of rows per file.');
                    return;
                }

                const doValidation = document.getElementById('uploadValidation').checked;


                uploadButton.disabled = true;
                statusContainer.innerHTML = '';

                // Add status header for chunking
                statusContainer.innerHTML = `
                    <div class="massUploader-statusHeader">
                        <span style="width:22px;flex-shrink:0;">Mark</span>
                        <span style="flex:1 1 auto;">Processing</span>
                    </div>
                `;

                // Add chunking status row
                const chunkingStatusRow = document.createElement('div');
                chunkingStatusRow.className = 'massUploader-statusRow';
                chunkingStatusRow.innerHTML = `
                    <span style="width:22px;flex-shrink:0;"></span>
                    <div class="massUploader-statusText status-chunking">Chunking CSV file...</div>
                `;
                statusContainer.appendChild(chunkingStatusRow);

                try {
                    // Chunk the CSV file
                    const chunks = await chunkCSVFile(csvFile, rowsPerFile, doValidation);
                    
                    // Update status
                    chunkingStatusRow.querySelector('.massUploader-statusText').innerHTML = `Created ${chunks.length} chunks from ${csvFile.name}`;
                    chunkingStatusRow.querySelector('.massUploader-statusText').className = 'massUploader-statusText status-success';
                    
                    // Add file tracking header for chunk files
                    const fileTrackingHeader = document.createElement('div');
                    fileTrackingHeader.className = 'massUploader-statusHeader';
                    fileTrackingHeader.innerHTML = `
                        <span style="width:22px;flex-shrink:0;">Mark</span>
                        <span style="flex:1 1 auto;">Chunk Files</span>
                    `;
                    statusContainer.appendChild(fileTrackingHeader);
                    
                    // Create individual file tracking rows for chunks
                    chunks.forEach(file => {
                        createFileTrackingRow(file);
                    });
                    
                    // Set filesToUpload to chunks for the upload process
                    filesToUpload = chunks;
                    
                } catch (error) {
                    console.error('Error chunking CSV:', error);
                    chunkingStatusRow.querySelector('.massUploader-statusText').innerHTML = `Error: ${error.message}`;
                    chunkingStatusRow.querySelector('.massUploader-statusText').className = 'massUploader-statusText status-error';
                    uploadButton.disabled = false;
                    return;
                }
            }

            // Ensure status rows exist before proceeding with upload
            if (filesToUpload.length > 0) {
                // Check if status rows already exist, if not create them
                const firstFileKey = filesToUpload[0].webkitRelativePath || filesToUpload[0].name;
                const firstFileId = `status-${btoa(firstFileKey).replace(/[=+/]/g, '')}`;
                if (!document.getElementById(firstFileId)) {
                    // Status rows don't exist, create them now
                    displayFilesWithStatus(filesToUpload);
                }
            }

            // Identify the site's existing file input (the one the page actually uses)
            // Exclude our own internal file inputs
            const siteFileInput = [...document.querySelectorAll('input[type="file"]')]
                .find(el => !['massFileInput', 'csvFileInput'].includes(el.id));
            if (!siteFileInput) {
                filesToUpload.forEach(file => {
                    updateStatusRow(file, 'error', 'Could not find the site\'s file input.');
                });
                uploadButton.disabled = false;
                return;
            }

            // Create skip wait button
            const skipWaitButton = document.createElement('button');
            skipWaitButton.id = 'skipWaitButton';
            skipWaitButton.innerText = 'Skip Wait (Next File)';
            skipWaitButton.style.cssText = `
                background: #ff9800;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                margin-top: 10px;
                display: none;
            `;
            skipWaitButton.addEventListener('mouseover', () => {
                skipWaitButton.style.background = '#f57c00';
            });
            skipWaitButton.addEventListener('mouseout', () => {
                skipWaitButton.style.background = '#ff9800';
            });
            
            // Insert skip button after upload button
            uploadButton.parentNode.insertBefore(skipWaitButton, uploadButton.nextSibling);

            // Track timeouts and current upload state
            let uploadTimeouts = [];
            let countdownIntervals = [];
            let currentUploadIndex = 0;
            let isUploading = false;
            let failedFiles = []; // Track files that failed to upload
            let processedAlerts = new Set(); // Avoid processing duplicate alerts
            
            // Initialize polling manager for centralized alert handling
            const pollingManager = new PollingManager();
            
            /**
             * Process the next file in the upload queue
             * Uses managed polling to prevent race conditions
             */
            async function processNextFile() {
                console.log(`[MassUploader] processNextFile() called - Index: ${currentUploadIndex}/${filesToUpload.length}`);
                
                if (currentUploadIndex >= filesToUpload.length) {
                    // All files processed - show summary
                    console.log('[MassUploader] All files processed, showing summary');
                    showUploadSummary();
                    uploadButton.disabled = false;
                    skipWaitButton.style.display = 'none';
                    isUploading = false;
                    return;
                }

                const file = filesToUpload[currentUploadIndex];
                console.log(`[MassUploader] Processing file ${currentUploadIndex + 1}/${filesToUpload.length}: ${file.name}`);
                
                // Update status to "Injecting"
                updateStatusRow(file, 'injecting');

                // Send file to page context via postMessage (bypasses userscript sandbox restrictions)
                window.postMessage({ type: 'MU_SET_FILE', file }, '*');

                try {
                    // Use managed polling instead of direct pollForAlerts call
                    const result = await pollingManager.startPolling(file, currentUploadIndex);
                    console.log(`[MassUploader] File ${file.name} completed with result:`, result);
                    
                    // Handle the completion result
                    await handleFileCompletion(file, result);
                    
                } catch (error) {
                    console.error(`[MassUploader] Error processing file ${file.name}:`, error);
                    updateStatusRow(file, 'error', error.message);
                    
                    // Handle error completion
                    await handleFileCompletion(file, {
                        outcome: 'error',
                        alerts: [{ message: error.message, type: 'error' }],
                        file: file,
                        fileIndex: currentUploadIndex
                    });
                }
            }

            /**
             * Handle completion of a file upload
             * @param {File} file - The completed file
             * @param {Object} result - Result from polling manager
             */
            async function handleFileCompletion(file, result) {
                const { outcome, alerts } = result;
                
                console.log(`[MassUploader] Handling completion for ${file.name} with outcome: ${outcome}`);
                
                // Handle different outcomes
                if (outcome === 'error') {
                    // For critical errors, ask user if they want to continue
                    const alertMessage = alerts[alerts.length - 1]?.message || 'Unknown error';
                    const shouldContinue = confirm(
                        `Critical error occurred with file "${file.name}":\n\n${alertMessage}\n\nDo you want to continue with the remaining files?`
                    );
                    
                    if (!shouldContinue) {
                        // Stop processing
                        console.log('[MassUploader] User chose to stop processing after error');
                        showUploadSummary();
                        uploadButton.disabled = false;
                        skipWaitButton.style.display = 'none';
                        isUploading = false;
                        return;
                    }
                }
                
                // Update failed files tracking
                if (outcome === 'partial_failure' || outcome === 'error') {
                    const alertMessage = alerts[alerts.length - 1]?.message || 'Unknown error';
                    if (!failedFiles.some(f => f.file === file && f.reason === alertMessage)) {
                        failedFiles.push({
                            file: file,
                            reason: alertMessage,
                            type: outcome
                        });
                    }
                }
                
                // Increment index only after processing is complete
                currentUploadIndex++;
                
                // Schedule next file (if not the last one)
                if (currentUploadIndex < filesToUpload.length) {
                    skipWaitButton.style.display = 'block';
                    
                    // Determine wait time based on outcome
                    let waitTime = 30000; // Default 30 seconds
                    if (outcome === 'error' || outcome === 'partial_failure') {
                        waitTime = 10000; // Shorter wait for failed files
                    }
                    
                    // Start countdown timer
                    let timeRemaining = Math.floor(waitTime / 1000);
                    const nextFileName = filesToUpload[currentUploadIndex].name;
                    
                    // Update button text immediately
                    skipWaitButton.innerText = `Skip Wait (${timeRemaining}s) - Next: ${nextFileName}`;
                    
                    // Countdown interval
                    const countdownInterval = setInterval(() => {
                        timeRemaining--;
                        if (timeRemaining > 0) {
                            skipWaitButton.innerText = `Skip Wait (${timeRemaining}s) - Next: ${nextFileName}`;
                        } else {
                            clearInterval(countdownInterval);
                        }
                    }, 1000);
                    
                    countdownIntervals.push(countdownInterval);
                    
                    const nextTimeout = setTimeout(() => {
                        clearInterval(countdownInterval);
                        skipWaitButton.style.display = 'none';
                        processNextFile();
                    }, waitTime);
                    
                    uploadTimeouts.push(nextTimeout);
                } else {
                    // Last file, show summary and re-enable upload
                    setTimeout(() => {
                        showUploadSummary();
                        uploadButton.disabled = false;
                        skipWaitButton.style.display = 'none';
                        isUploading = false;
                    }, 1000);
                }
            }

            // Function to compile master error file
            function compileMasterErrorFile() {
                const errorFileData = pollingManager.errorFileData;
                if (errorFileData.length === 0) {
                    return null;
                }
                
                console.log('[MassUploader] Compiling master error file from', errorFileData.length, 'error files');
                
                // Combine all error CSV data
                let masterCSV = '';
                let totalFailedRecords = 0;
                
                errorFileData.forEach((errorFile, index) => {
                    const lines = errorFile.csvData.split('\n');
                    if (index === 0) {
                        // Include header from first file
                        masterCSV += lines.join('\n');
                    } else {
                        // Skip header for subsequent files, just add data rows
                        const dataRows = lines.slice(1);
                        if (dataRows.length > 0) {
                            masterCSV += '\n' + dataRows.join('\n');
                        }
                    }
                    totalFailedRecords += errorFile.recordCount;
                });
                
                return {
                    csvData: masterCSV,
                    totalRecords: totalFailedRecords,
                    sourceFiles: errorFileData.map(ef => ef.fileName),
                    compiledAt: new Date().toISOString()
                };
            }
            
            // Function to download master error file
            function downloadMasterErrorFile(masterErrorData) {
                const blob = new Blob([masterErrorData.csvData], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `master_failed_records_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                console.log('[MassUploader] Master error file downloaded:', link.download);
            }

            // Function to show upload summary
            function showUploadSummary() {
                const totalFiles = filesToUpload.length;
                const failedCount = failedFiles.length;
                const successCount = Math.max(0, totalFiles - failedCount);
                const masterErrorData = compileMasterErrorFile();
                
                console.log('[MassUploader] Upload Summary:', {
                    total: totalFiles,
                    successful: successCount,
                    failed: failedCount,
                    failedFiles: failedFiles,
                    errorFileData: pollingManager.errorFileData,
                    masterErrorData: masterErrorData
                });
                
                // Create summary in status container
                const summaryDiv = document.createElement('div');
                summaryDiv.className = 'massUploader-summary';
                summaryDiv.style.cssText = `
                    margin-top: 15px;
                    padding: 12px;
                    border: 2px solid #004E36;
                    border-radius: 6px;
                    background: #f8f9fa;
                `;
                
                let summaryHTML = `
                    <h4 style="margin: 0 0 8px 0; color: #004E36;">Upload Summary</h4>
                    <p style="margin: 4px 0;"><strong>Total Files:</strong> ${totalFiles}</p>
                    <p style="margin: 4px 0; color: #388e3c;"><strong>Successful:</strong> ${successCount}</p>
                `;
                
                if (failedCount > 0) {
                    summaryHTML += `<p style="margin: 4px 0; color: #c62828;"><strong>Failed:</strong> ${failedCount}</p>`;
                    summaryHTML += `<details style="margin-top: 8px;">
                        <summary style="cursor: pointer; font-weight: bold; color: #c62828;">Failed Files Details</summary>
                        <ul style="margin: 8px 0; padding-left: 20px;">`;
                    
                    failedFiles.forEach(failed => {
                        summaryHTML += `<li style="margin: 4px 0;">
                            <strong>${failed.file.name}</strong><br>
                            <small style="color: #666;">${failed.reason}</small>
                        </li>`;
                    });
                    
                    summaryHTML += `</ul></details>`;
                }
                
                // Add master error file section if we have error data
                if (masterErrorData) {
                    summaryHTML += `
                        <div style="margin-top: 12px; padding: 8px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px;">
                            <h5 style="margin: 0 0 6px 0; color: #856404;">📄 Failed Records Compilation</h5>
                            <p style="margin: 2px 0; font-size: 13px;"><strong>Total Failed Records:</strong> ${masterErrorData.totalRecords}</p>
                            <p style="margin: 2px 0; font-size: 13px;"><strong>Source Files:</strong> ${masterErrorData.sourceFiles.length}</p>
                            <button id="downloadMasterErrorFile" style="
                                margin-top: 6px;
                                background: #ff9800;
                                color: white;
                                border: none;
                                padding: 6px 12px;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 12px;
                                font-weight: bold;
                            ">📥 Download Master Error File</button>
                        </div>
                    `;
                }
                
                summaryDiv.innerHTML = summaryHTML;
                
                const statusContainer = document.getElementById('statusContainer');
                if (statusContainer) {
                    statusContainer.appendChild(summaryDiv);
                    summaryDiv.scrollIntoView({block: 'nearest'});
                    
                    // Add event listener for master error file download
                    if (masterErrorData) {
                        const downloadButton = document.getElementById('downloadMasterErrorFile');
                        if (downloadButton) {
                            downloadButton.addEventListener('click', () => {
                                downloadMasterErrorFile(masterErrorData);
                            });
                        }
                    }
                }
            }

            // Enhanced skip wait button functionality with race condition prevention
            skipWaitButton.addEventListener('click', async () => {
                console.log('[MassUploader] Skip button clicked');
                
                // Clear any pending timeouts and countdown intervals
                uploadTimeouts.forEach(timeout => clearTimeout(timeout));
                countdownIntervals.forEach(interval => clearInterval(interval));
                uploadTimeouts = [];
                countdownIntervals = [];
                
                // Ensure any active polling completes before proceeding
                if (pollingManager.isPollingActive()) {
                    console.log('[MassUploader] Waiting for active polling to complete before skip...');
                    skipWaitButton.innerText = 'Waiting for completion...';
                    skipWaitButton.disabled = true;
                    
                    await pollingManager.waitForCompletion();
                    
                    skipWaitButton.disabled = false;
                }
                
                skipWaitButton.style.display = 'none';
                
                // Small delay to ensure cleanup completes
                setTimeout(() => {
                    processNextFile();
                }, 100);
            });

            // Start the upload process
            isUploading = true;
            processNextFile();
        });

        // Trap focus inside modal
        overlay.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                const focusable = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]');
                const focusableArr = Array.from(focusable).filter(el => el.offsetParent !== null && !el.disabled);
                if (!focusableArr.length) return;
                const first = focusableArr[0], last = focusableArr[focusableArr.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    last.focus();
                    e.preventDefault();
                } else if (!e.shiftKey && document.activeElement === last) {
                    first.focus();
                    e.preventDefault();
                }
            }
            if (e.key === 'Escape') {
                closeButton.click();
            }
        });
    }

    function wireUpMassUploaderButton() {
        const massUploaderButton = document.getElementById('massUploaderButton');
        if (massUploaderButton) {
            massUploaderButton.addEventListener('click', addMassUploaderFunctionality);
            return true;
        }
        return false;
    }

    // Try hooking up immediately
    if (!wireUpMassUploaderButton()) {
        // If the button isn't in the DOM yet, watch for changes
        const observer = new MutationObserver(() => {
            if (wireUpMassUploaderButton()) {
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
})();
