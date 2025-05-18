(function () {
    'use strict';

    // SVG icon for the quick tools menu
    const editorIcon = `
        <svg width="22" height="22" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <polygon points="12,2 19,8 19,16 12,22 5,16 5,8" fill="#004E36" stroke="#fff" stroke-width="1.5"/>
            <path d="M12 6v12M9 9l6 6M15 9l-6 6" stroke="#fff" stroke-width="1.5"/>
        </svg>
    `;

    // Function to open the Existing Item Editor
    function openExistingItemEditor() {
        console.log('Opening Existing Item Editor');

        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'editorOverlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.background = 'rgba(0,0,0,0.5)';
        overlay.style.zIndex = '1001';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';

        // Container for x-spreadsheet
        const container = document.createElement('div');
        container.style.width = '80vw';
        container.style.height = '80vh';
        container.style.background = '#fff';
        container.style.borderRadius = '12px';
        container.style.overflow = 'hidden';
        container.style.boxShadow = '0 8px 32px rgba(0,0,0,0.18), 0 1.5px 6px rgba(0,78,54,0.10)';

        // Initialize x-spreadsheet
        const sheet = new Spreadsheet(container, {
            showToolbar: true,
            showGrid: true,
            showContextmenu: true,
            view: {
                height: () => document.documentElement.clientHeight - 100,
                width: () => document.documentElement.clientWidth - 100,
            },
        });

        // Load data into spreadsheet
        fetchData().then(data => {
            sheet.loadData(data);
        });

        // Append container to overlay
        overlay.appendChild(container);
        document.body.appendChild(overlay);

        // Close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '&times;';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '10px';
        closeButton.style.fontSize = '24px';
        closeButton.style.cursor = 'pointer';
        closeButton.onclick = () => document.body.removeChild(overlay);
        container.appendChild(closeButton);

        // Download button
        const downloadButton = document.createElement('button');
        downloadButton.innerHTML = 'Download CSV';
        downloadButton.style.position = 'absolute';
        downloadButton.style.bottom = '10px';
        downloadButton.style.right = '10px';
        downloadButton.style.fontSize = '16px';
        downloadButton.style.cursor = 'pointer';
        downloadButton.onclick = () => downloadCSV(sheet.getData());
        container.appendChild(downloadButton);

        // Upload button
        const uploadButton = document.createElement('button');
        uploadButton.innerHTML = 'Upload';
        uploadButton.style.position = 'absolute';
        uploadButton.style.bottom = '10px';
        uploadButton.style.right = '100px';
        uploadButton.style.fontSize = '16px';
        uploadButton.style.cursor = 'pointer';
        uploadButton.onclick = () => uploadData(sheet.getData());
        container.appendChild(uploadButton);
    }

    // Function to fetch data (similar to RedriveButton but without flipping values)
    function fetchData() {
        return new Promise((resolve, reject) => {
            // Simulate data fetching
            setTimeout(() => {
                const data = [
                    { 'Column 1': 'Data 1', 'Column 2': 'Data 2' },
                    { 'Column 1': 'Data 3', 'Column 2': 'Data 4' },
                ];
                resolve(data);
            }, 1000);
        });
    }

    // Function to download data as CSV
    function downloadCSV(data) {
        console.log('Downloading CSV', data);
        // Implement CSV download logic
    }

    // Function to upload data
    function uploadData(data) {
        console.log('Uploading data', data);
        // Implement data upload logic
    }

    // Expose for Settings.js quick tools integration
    try {
        module.exports = { openExistingItemEditor, editorIcon };
    } catch (e) {
        window.openExistingItemEditor = openExistingItemEditor;
        window.editorIcon = editorIcon;
    }
})();