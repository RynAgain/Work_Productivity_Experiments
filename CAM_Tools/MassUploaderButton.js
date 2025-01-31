(function() {
    'use strict';

    /**
     * This function shows an overlay to pick multiple files (or an entire folder).
     * For each chosen file, we artificially set it on the *existing* <input type="file">
     * and dispatch a "change" event to fool the site into thinking the user clicked it.
     * We also track status (Waiting, Injecting, etc.) in a small status container.
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

        // === Inner HTML: folder input + button ===
        formContainer.innerHTML = `
            <h3>Mass Upload</h3>
            <input type="file" id="massFileInput" style="width: 100%; margin-bottom: 10px;" multiple webkitdirectory>
            <button id="massUploadButton" style="width: 100%;">Upload</button>
        `;
        formContainer.appendChild(closeButton);
        overlay.appendChild(formContainer);
        document.body.appendChild(overlay);

        // === Create a status container to display upload progress ===
        const statusContainer = document.createElement('div');
        statusContainer.id = 'statusContainer';
        statusContainer.style.marginTop = '10px';
        formContainer.appendChild(statusContainer);

        document.getElementById('massUploadButton').addEventListener('click', () => {
            console.log('Mass Upload -> Upload button clicked');
            const files = document.getElementById('massFileInput').files;
            if (!files || files.length === 0) {
                alert('Please select files to upload.');
                return;
            }

            // Function to split a CSV file into chunks of 1002 rows
            const splitCsvFile = (fileContent, fileName) => {
                const parsed = Papa.parse(fileContent, { header: true });
                const rows = parsed.data;
                const headers = parsed.meta.fields;
                const chunks = [];

                for (let i = 0; i < rows.length; i += 1002) {
                    const chunkRows = rows.slice(i, i + 1002);
                    const chunkContent = Papa.unparse([headers, ...chunkRows]);
                    const chunkFile = new File([chunkContent], `${fileName}_part${Math.floor(i / 1002) + 1}.csv`, { type: 'text/csv' });
                    chunks.push(chunkFile);
                }

                return chunks;
            };

            // Process files upon selection
            const processFiles = async (files) => {
                const allChunks = [];
                for (const file of files) {
                    const fileContent = await file.text();
                    const fileChunks = splitCsvFile(fileContent, file.name);
                    allChunks.push(...fileChunks);
                }
                return allChunks;
            };

            // Handle file selection and splitting
            document.getElementById('massFileInput').addEventListener('change', async (event) => {
                const files = event.target.files;
                if (!files || files.length === 0) {
                    alert('Please select files to upload.');
                    return;
                }

                const chunks = await processFiles(files);

                // Display chunk names and initial status
                chunks.forEach(chunk => {
                    const fileStatus = document.createElement('div');
                    fileStatus.id = `status-${CSS.escape(chunk.name)}`;
                    fileStatus.innerText = `${chunk.name} - Waiting`;
                    statusContainer.appendChild(fileStatus);
                });

                // Prepare for upload
                const siteFileInput = document.querySelector('input[type="file"]');
                if (!siteFileInput) {
                    console.error('Could not find the site’s file input. Aborting.');
                    return;
                }

                // Upload chunks
                chunks.forEach((chunk, index) => {
                    setTimeout(() => {
                        const fileStatusDiv = document.getElementById(`status-${CSS.escape(chunk.name)}`);
                        if (fileStatusDiv) {
                            fileStatusDiv.innerText = `${chunk.name} - Injecting...`;
                        }

                        const dt = new DataTransfer();
                        dt.items.add(chunk);
                        siteFileInput.files = dt.files;

                        const event = new Event('change', { bubbles: true });
                        siteFileInput.dispatchEvent(event);

                        if (fileStatusDiv) {
                            fileStatusDiv.innerText = `${chunk.name} - Injected`;
                        }

                        console.log(`Injected file: ${chunk.name} [${index + 1}/${chunks.length}]`);
                    }, index * 30000);
                });
            });
        });
    }

    // === Setup: attach click listener to #massUploaderButton if present ===
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
