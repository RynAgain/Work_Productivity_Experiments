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
     * This function shows an overlay to pick multiple files (or an entire folder).
     * For each chosen file, we artificially set it on the *existing* <input type="file">
     * and dispatch a "change" event to fool the site into thinking the user clicked it.
     * We also track status (Waiting, Injecting, etc.) in a small status container.
     * Additionally, after processing each file, we poll for any toast/notification
     * message from the page during a 35-second window and include that in the status update.
     */
    function addMassUploaderFunctionality() {
        console.log('Mass Uploader button clicked');

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
                    width: 370px;
                    max-width: 98vw;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 2px 6px rgba(0,78,54,0.10);
                    font-family: 'Segoe UI', Arial, sans-serif;
                    position: relative;
                    padding: 0;
                    overflow: hidden;
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
                #selectedFolderLabel {
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
                .status-error { color: #c62828; }
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
        header.innerHTML = `<span>Mass Upload</span>`;
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

        // === Body ===
        const body = document.createElement('div');
        body.className = 'massUploader-body';

        // Instructions
        const instructions = document.createElement('div');
        instructions.className = 'massUploader-instructions';
        instructions.innerHTML = `Select a folder of files to mass upload. Each file will be injected in sequence. You can mark files as complete/incomplete.`;
        body.appendChild(instructions);

        // Folder picker label
        const folderLabel = document.createElement('label');
        folderLabel.className = 'massUploader-label';
        folderLabel.setAttribute('for', 'massFileInput');
        folderLabel.setAttribute('tabindex', '0');
        folderLabel.innerText = 'Choose Folder';
        body.appendChild(folderLabel);

        // Selected folder label
        const selectedFolderLabel = document.createElement('p');
        selectedFolderLabel.id = 'selectedFolderLabel';
        selectedFolderLabel.innerText = 'No folder selected';
        body.appendChild(selectedFolderLabel);

        // File input (hidden)
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'massFileInput';
        fileInput.style.display = 'none';
        fileInput.setAttribute('multiple', '');
        fileInput.setAttribute('webkitdirectory', '');
        body.appendChild(fileInput);

        // Upload button
        const uploadButton = document.createElement('button');
        uploadButton.id = 'massUploadButton';
        uploadButton.innerText = 'Upload';
        uploadButton.disabled = true;
        body.appendChild(uploadButton);

        // Status container
        const statusContainer = document.createElement('div');
        statusContainer.id = 'statusContainer';
        body.appendChild(statusContainer);

        card.appendChild(body);
        overlay.appendChild(card);
        document.body.appendChild(overlay);

        // === Accessibility: focus management ===
        setTimeout(() => {
            folderLabel.focus();
        }, 0);

        // === Folder input logic ===
        fileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                const folderName = this.files[0].webkitRelativePath
                    ? this.files[0].webkitRelativePath.split('/')[0]
                    : (this.files[0].name || 'Selected');
                selectedFolderLabel.textContent = "Selected folder: " + folderName;
                uploadButton.disabled = false;
            } else {
                selectedFolderLabel.textContent = "No folder selected";
                uploadButton.disabled = true;
            }
        });

        // Keyboard accessibility for folder label
        // Only trigger fileInput.click() on click, not on both click and keydown to avoid double prompt
        folderLabel.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInput.click();
            }
        });
        // Remove explicit click handler to avoid double prompt.
        // The label's default behavior (with "for" attribute) will trigger the file input.
        // Only keep the keydown handler for accessibility.

        // === Upload logic ===
        uploadButton.addEventListener('click', () => {
            const files = fileInput.files;
            if (!files || files.length === 0) {
                alert('Please select files to upload.');
                return;
            }
            uploadButton.disabled = true;

            // Clear previous status
            statusContainer.innerHTML = '';

            // Display file names and initial status
            // Add a header row for clarity
            statusContainer.innerHTML = `
                <div class="massUploader-statusHeader">
                    <span style="width:22px;flex-shrink:0;">Mark</span>
                    <span style="flex:1 1 auto;">File</span>
                </div>
            `;
            Array.from(files).forEach(file => {
                // Container for each file status
                const fileStatusRow = document.createElement('div');
                fileStatusRow.className = 'massUploader-statusRow';

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
                fileStates[file.name] = { state: 'waiting', error: null, checkboxState: 0 };

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
                fileStatus.id = `status-${CSS.escape(file.name)}`;
                fileStatus.className = 'massUploader-statusText status-waiting';
                fileStatus.innerText = `${file.name} - Waiting`;

                // TriBtn click cycles through states
                triBtn.addEventListener('click', function(e) {
                    cbState = (cbState + 1) % 4;
                    fileStates[file.name].checkboxState = cbState;
                    updateStatusRow(file, fileStates[file.name].state, fileStates[file.name].error);
                });

                fileStatusRow.appendChild(triBtn);
                fileStatusRow.appendChild(fileStatus);
                statusContainer.appendChild(fileStatusRow);

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

                // Patch updateStatusRow to update triBtn color
                if (!statusContainer._triPatch) {
                    const origUpdateStatusRow = typeof updateStatusRow === 'function' ? updateStatusRow : null;
                    window.updateStatusRow = function(file, state, errorMsg) {
                        if (origUpdateStatusRow) origUpdateStatusRow(file, state, errorMsg);
                        const cbState = fileStates[file.name]?.checkboxState ?? 0;
                        const row = document.getElementById(`status-${CSS.escape(file.name)}`)?.parentElement;
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
                    };
                    statusContainer._triPatch = true;
                }
                updateTriBtnColor(cbState);
                // Initial color
                updateStatusRow(file, 'waiting');
            });

            // Identify the site's existing file input (the one the page actually uses)
            const siteFileInput = document.querySelector('input[type="file"]');
            if (!siteFileInput) {
                Array.from(files).forEach(file => {
                    const fileStatusDiv = document.getElementById(`status-${CSS.escape(file.name)}`);
                    if (fileStatusDiv) {
                        fileStatusDiv.className = 'massUploader-statusText status-error';
                        fileStatusDiv.innerText = `${file.name} - Error: Could not find the site's file input.`;
                    }
                });
                uploadButton.disabled = false;
                return;
            }

            // For each selected file, forcibly attach it & dispatch "change"
            Array.from(files).forEach((file, index) => {
                setTimeout(() => {
                    // Update status to "Injecting"
                    const fileStatusDiv = document.getElementById(`status-${CSS.escape(file.name)}`);
                    if (fileStatusDiv) {
                        fileStatusDiv.className = 'massUploader-statusText status-injecting';
                        fileStatusDiv.innerText = `${file.name} - Injecting...`;
                    }

                    // 1) Programmatically set the .files property via DataTransfer
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    siteFileInput.files = dt.files;

                    // 2) Dispatch a "change" event so the site sees the new file
                    const event = new Event('change', { bubbles: true });
                    siteFileInput.dispatchEvent(event);

                    // After dispatching, start polling for toast/notification for up to 35 seconds
                    let elapsed = 0;
                    const pollingInterval = 1000; // poll every second
                    const maxPollingTime = 35000; // 35 seconds
                    const poll = setInterval(() => {
                        const toastElement = document.querySelector('.toast, .notification, .banner');
                        if (toastElement) {
                            const toastMessage = toastElement.innerText.trim();
                            if (fileStatusDiv) {
                                fileStatusDiv.className = 'massUploader-statusText status-success';
                                fileStatusDiv.innerText = `${file.name} - Injected. Status: ${toastMessage}`;
                            }
                            console.log(`Injected file: ${file.name} [${index + 1}/${files.length}] - ${toastMessage}`);
                            clearInterval(poll);
                        }
                        elapsed += pollingInterval;
                        if (elapsed >= maxPollingTime) {
                            if (fileStatusDiv && fileStatusDiv.innerText.indexOf("Status:") === -1) {
                                fileStatusDiv.className = 'massUploader-statusText status-success';
                                fileStatusDiv.innerText = `${file.name} - Injected.`;
                            }
                            clearInterval(poll);
                        }
                    }, pollingInterval);

                }, index * 30000); // 30-second spacing between files
            });

            // Re-enable upload button after all files are processed (rough estimate)
            setTimeout(() => {
                uploadButton.disabled = false;
            }, files.length * 30000 + 1000);
        });

        // Trap focus inside modal
        overlay.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                const focusable = overlay.querySelectorAll('button, [tabindex="0"], input[type="file"]');
                const focusableArr = Array.from(focusable).filter(el => el.offsetParent !== null);
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
