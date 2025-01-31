(function() {
    'use strict';

    /**
     * Main function that displays the "Mass Upload" overlay.
     * When the user clicks "Upload", it queues each selected file 
     * through the existing app's upload flow.
     */
    function addMassUploaderFunctionality() {
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

        // === Inner HTML: multiple file input + button ===
        formContainer.innerHTML = `
            <h3>Mass Upload</h3>
            <input type="file" id="massFileInput" style="width: 100%; margin-bottom: 10px;" multiple>
            <button id="massUploadButton" style="width: 100%;">Upload</button>
        `;
        formContainer.appendChild(closeButton);
        overlay.appendChild(formContainer);
        document.body.appendChild(overlay);

        // === On click "Upload" ===
        document.getElementById('massUploadButton').addEventListener('click', () => {
            console.log('Mass Upload -> Upload button clicked');
            const files = document.getElementById('massFileInput').files;
            if (!files || files.length === 0) {
                alert('Please select files to upload.');
                return;
            }

            /**
             * For each file:
             * 1) Click the existing “Upload file” button in the app
             * 2) Find the file <input> that the app spawns
             * 3) Inject our file
             * 4) Wait 30 seconds
             */
            const existingUploadButtonSelector = 'button[aria-label="Upload file"]';
            const uploadEachFile = (file, index) => {
                console.log(`Queuing file ${index + 1} of ${files.length}: ${file.name}`);

                // Use a small delay so each file processes sequentially
                setTimeout(() => {
                    const existingUploadButton = document.querySelector(existingUploadButtonSelector);
                    if (!existingUploadButton) {
                        console.error('Could not find the existing "Upload file" button in the page.');
                        return;
                    }

                    // 1) Trigger the app's native "upload" flow
                    existingUploadButton.click();

                    // 2) The app presumably spawns an <input type="file">. Let's find it:
                    const fileInput = document.querySelector('input[type="file"]');
                    if (!fileInput) {
                        console.error('No file input found after clicking the existing Upload button.');
                        return;
                    }

                    // 3) Inject our file
                    // NOTE: Setting .files is not always straightforward in real browsers,
                    // but typically works in Chrome-based dev/test scenarios.
                    // If the site checks for events or read-only file inputs, it might not accept this approach.
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    fileInput.files = dt.files;

                    console.log(`Injected file: ${file.name} (${index + 1}/${files.length}). Waiting 30s before next file...`);
                }, index * 30000);
            };

            Array.from(files).forEach(uploadEachFile);
        });
    }

    /**
     * If there's a button with id="massUploaderButton", wire it to open the overlay.
     */
    function wireUpMassUploaderButton() {
        const massUploaderButton = document.getElementById('massUploaderButton');
        if (massUploaderButton) {
            massUploaderButton.addEventListener('click', addMassUploaderFunctionality);
            return true;
        }
        return false;
    }

    // === Try immediately ===
    if (!wireUpMassUploaderButton()) {
        // === Fall back: watch for the #massUploaderButton if it's added later ===
        const observer = new MutationObserver(() => {
            if (wireUpMassUploaderButton()) {
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
})();
