(function() {
    'use strict';

    /**
     * This function shows an overlay to pick multiple files.
     * For each chosen file, we artificially set it on the *existing* <input type="file">
     * and dispatch a "change" event to fool the site into thinking the user clicked it.
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

        /**
         * On "Upload" click:
         * 1) We gather all chosen files
         * 2) For each one, we artificially set it on the real <input type="file"> the site uses
         * 3) We dispatch a "change" event so the site thinks it was user-chosen
         */
        document.getElementById('massUploadButton').addEventListener('click', () => {
            console.log('Mass Upload -> Upload button clicked');
            const files = document.getElementById('massFileInput').files;
            if (!files || files.length === 0) {
                alert('Please select files to upload.');
                return;
            }

            // Identify the existing file input used by the site.
            // Adjust this selector to match the real input the site listens to.
            // e.g. if it’s "input[type=file]", or "#hiddenFileInput", or whatever the app uses.
            const siteFileInput = document.querySelector('input[type="file"]');

            if (!siteFileInput) {
                console.error('Could not find the site’s file input. Aborting.');
                return;
            }

            // For each selected file, forcibly attach it & dispatch "change"
            Array.from(files).forEach((file, index) => {
                // We'll add a small delay so we don't spam everything at once.
                // (Remove or adjust if you want instant assignment.)
                setTimeout(() => {
                    // Create a new DataTransfer (modern approach)
                    const dt = new DataTransfer();
                    dt.items.add(file);

                    // 1) Programmatically set the .files property
                    siteFileInput.files = dt.files;

                    // 2) Dispatch a "change" event so the site sees the new file
                    const event = new Event('change', { bubbles: true });
                    siteFileInput.dispatchEvent(event);

                    console.log(`Injected file: ${file.name} [${index + 1}/${files.length}] via .files + "change" event`);
                }, index * 2000); // 2-second spacing
            });
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
