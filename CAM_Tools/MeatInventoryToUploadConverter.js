(function() {
    'use strict';

    try {
        // Functionality for the Meat Inventory to Upload Converter
        function addMeatInventoryToUploadConverter() {
            console.log('Meat Inventory to Upload Converter initialized');
            // Function to add the Meat Inventory to Upload Converter button functionality
            function addMeatInventoryToUploadConverterFunctionality() {
                console.log('Meat Inventory to Upload Converter button clicked');
                // Create overlay
                var overlay = document.createElement('div');
                overlay.id = 'meatInventoryUploadOverlay';
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                overlay.style.zIndex = '1001';
                overlay.style.display = 'flex';
                overlay.style.justifyContent = 'center';
                overlay.style.alignItems = 'center';

                // Create close button
                var closeButton = document.createElement('span');
                closeButton.innerHTML = '&times;';
                closeButton.style.position = 'absolute';
                closeButton.style.top = '10px';
                closeButton.style.right = '10px';
                closeButton.style.fontSize = '24px';
                closeButton.style.cursor = 'pointer';
                closeButton.style.color = '#fff';
                closeButton.style.backgroundColor = '#000';
                closeButton.style.padding = '5px';
                closeButton.style.borderRadius = '0';
                closeButton.addEventListener('click', function() {
                    document.body.removeChild(overlay);
                });

                var formContainer = document.createElement('div');
                formContainer.style.position = 'relative';
                formContainer.style.backgroundColor = '#fff';
                formContainer.style.padding = '20px';
                formContainer.style.borderRadius = '5px';
                formContainer.style.width = '300px';

                // Create form elements
                formContainer.innerHTML = `
                    <h3>Meat Inventory to Upload Converter</h3>
                    <input type="file" id="meatInventoryFileInput" style="width: 100%; margin-bottom: 10px;">
                    <label>Andon Cord</label>
                    <select id="andonCordSelect" style="width: 100%; margin-bottom: 10px;">
                        <option value="Enabled">Enabled</option>
                        <option value="Disabled">Disabled</option>
                    </select>
                    <label>Start Date</label>
                    <input type="date" id="startDate" style="width: 100%; margin-bottom: 10px;">
                    <label>End Date</label>
                    <input type="date" id="endDate" style="width: 100%; margin-bottom: 10px;">
                    <button id="convertButton" style="width: 100%;">Convert & Download</button>
                `;

                formContainer.appendChild(closeButton);
                overlay.appendChild(formContainer);
                document.body.appendChild(overlay);

                // Add event listener to the "Convert & Download" button
                document.getElementById('convertButton').addEventListener('click', function() {
                    const fileInput = document.getElementById('meatInventoryFileInput');
                    if (fileInput.files.length === 0) {
                        alert('Please select a file to upload.');
                        return;
                    }

                    const file = fileInput.files[0];
                    console.log('File selected:', file.name);
                    // Logic to handle file upload goes here
                });
            }

            // Use MutationObserver to detect when the button is added to the DOM
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.addedNodes.length) {
                        const meatInventoryToUploadConverterButton = document.getElementById('meatInventoryToUploadConverterButton');
                        if (meatInventoryToUploadConverterButton) {
                            meatInventoryToUploadConverterButton.addEventListener('click', addMeatInventoryToUploadConverterFunctionality);
                            observer.disconnect(); // Stop observing once the button is found
                        }
                    }
                });
            });

            observer.observe(document.body, { childList: true, subtree: true });
        }

        // Expose the function to the global scope
        window.addMeatInventoryToUploadConverter = addMeatInventoryToUploadConverter;
    } catch (error) {
        console.error('Error initializing Meat Inventory to Upload Converter:', error);
    }
})();

//version 1