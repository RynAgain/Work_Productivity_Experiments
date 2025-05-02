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
    function addMassUploaderFunctionality() {  // Added function declaration
        console.log('Mass Uploader button clicked');

        // === Overlay ===
        const overlay = document.createElement('div');
        overlay.id = 'massUploaderOverlay';
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: '1001',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        });

        // === Close button ===
        const closeButton = document.createElement('span');
        closeButton.innerHTML = '&times;';
        Object.assign(closeButton.style, {
            position: 'absolute',
            top: '10px',
            right: '10px',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#fff',
            backgroundColor: '#000',
            padding: '5px'
        });
        closeButton.addEventListener('click', () => document.body.removeChild(overlay));

        // === Form container ===
        const formContainer = document.createElement('div');
        Object.assign(formContainer.style, {
            position: 'relative',
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '5px',
            width: '300px'
        });

        // === Inner HTML: folder input + button ===
        formContainer.innerHTML = `
            <h3>Mass Upload</h3>
            <label for="massFileInput" style="display:block; margin-bottom: 10px; cursor:pointer; background-color: #ddd; padding: 8px; text-align: center;">Choose Folder</label>
            <p id="selectedFolderLabel" style="text-align: center; margin-bottom: 10px;">No folder selected</p>
            <input type="file" id="massFileInput" style="display: none;" multiple webkitdirectory>
            <button id="massUploadButton" style="width: 100%;">Upload</button>
        `;
        formContainer.appendChild(closeButton);
        overlay.appendChild(formContainer);
        document.body.appendChild(overlay);
        document.getElementById('massFileInput').addEventListener('change', function() {
            const folderLabel = document.getElementById('selectedFolderLabel');
            if (this.files.length > 0) {
                const folderName = this.files[0].webkitRelativePath.split('/')[0];
                folderLabel.textContent = "Selected folder: " + folderName;
            } else {
                folderLabel.textContent = "No folder selected";
            }
        });

        // === Create a status container to display upload progress ===
        const statusContainer = document.createElement('div');
        statusContainer.id = 'statusContainer';
        statusContainer.style.marginTop = '10px';
        statusContainer.style.maxHeight = '200px';
        statusContainer.style.overflowY = 'auto';
        statusContainer.style.border = '1px solid #eee';
        statusContainer.style.padding = '4px';
        formContainer.appendChild(statusContainer);

        document.getElementById('massUploadButton').addEventListener('click', () => {
            console.log('Mass Upload -> Upload button clicked');
            const files = document.getElementById('massFileInput').files;
            if (!files || files.length === 0) {
                alert('Please select files to upload.');
                return;
            }

            // Display file names and initial status
            Array.from(files).forEach(file => {
                // Container for each file status
                const fileStatusRow = document.createElement('div');
                fileStatusRow.style.display = 'flex';
                fileStatusRow.style.alignItems = 'center';
                fileStatusRow.style.marginBottom = '2px';
                fileStatusRow.style.gap = '6px';

                // Checkbox
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.title = 'Mark complete/incomplete';
                checkbox.style.margin = '0 4px 0 0';
                // No persistence, just UI toggle

                // Status text
                const fileStatus = document.createElement('div');
                fileStatus.id = `status-${CSS.escape(file.name)}`;
                fileStatus.innerText = `${file.name} - Waiting`;
                fileStatus.style.flex = '1 1 auto';
                fileStatus.style.fontSize = '13px';
                fileStatus.style.overflow = 'hidden';
                fileStatus.style.textOverflow = 'ellipsis';
                fileStatus.style.whiteSpace = 'nowrap';

                fileStatusRow.appendChild(checkbox);
                fileStatusRow.appendChild(fileStatus);
                statusContainer.appendChild(fileStatusRow);
            });

            // Identify the site's existing file input (the one the page actually uses)
            const siteFileInput = document.querySelector('input[type="file"]');
            if (!siteFileInput) {
                console.error("Could not find the site's file input. Aborting.");
                return;
            }

            // For each selected file, forcibly attach it & dispatch "change"
            Array.from(files).forEach((file, index) => {
                setTimeout(() => {
                    // Update status to "Injecting"
                    const fileStatusDiv = document.getElementById(`status-${CSS.escape(file.name)}`);
                    if (fileStatusDiv) {
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
                                fileStatusDiv.innerText = `${file.name} - Injected. Status: ${toastMessage}`;
                            }
                            console.log(`Injected file: ${file.name} [${index + 1}/${files.length}] - ${toastMessage}`);
                            clearInterval(poll);
                        }
                        elapsed += pollingInterval;
                        if (elapsed >= maxPollingTime) {
                            if (fileStatusDiv && fileStatusDiv.innerText.indexOf("Status:") === -1) {
                                fileStatusDiv.innerText = `${file.name} - Injected.`;
                            }
                            clearInterval(poll);
                        }
                    }, pollingInterval);

                }, index * 30000); // 30-second spacing between files
            });
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
