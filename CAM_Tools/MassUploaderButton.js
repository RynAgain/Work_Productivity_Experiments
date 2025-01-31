(function() {
    'use strict';

    // Function to add the NIS File to CAM Upload button functionality
    function addNISFileToCAMUploadFunctionality() {
        console.log('NIS File to CAM Upload button clicked');
        // Create overlay
        var overlay = document.createElement('div');
        overlay.id = 'nisFileUploadOverlay';
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
            <h3>Mass Upload</h3>
            <input type="file" id="massFileInput" style="width: 100%; margin-bottom: 10px;" multiple>
            <button id="uploadButton" style="width: 100%;">Upload</button>
        `;

        formContainer.appendChild(closeButton);
        overlay.appendChild(formContainer);
        document.body.appendChild(overlay);

        // Add event listener to the "Upload" button
        // Add event listener to the "Upload" button
        document.getElementById('uploadButton').addEventListener('click', function() {
            const files = document.getElementById('massFileInput').files;
            if (files.length === 0) {
                alert('Please select files to upload.');
                return;
            }

            const uploadFile = async (file, index) => {
                console.log(`Uploading file ${index + 1} of ${files.length}: ${file.name}`);
                const conversionResult = await convertCsvToItemAvaialbilityList(file);
                const requestLength = conversionResult.availabilites.length;

                if (conversionResult.validatonError !== null) {
                    const { line, errorType, errorMessage } = conversionResult.validatonError;
                    onOpenToast({
                        type: "error",
                        message: `${errorType} occurred on line ${line}. ${errorMessage}`,
                    });
                } else {
                    const updateItemsAvailabilityRequest = {
                        itemsAvailability: conversionResult.availabilites,
                    };

                    try {
                        const response = await client.updateItemsAvailability(updateItemsAvailabilityRequest);
                        const failureMessages = response?.failedUpdatedItems;

                        if (failureMessages && failureMessages.length > 0) {
                            openPartialToasts(requestLength, failureMessages);
                        } else {
                            openSuccessToast(file.name);
                            console.log("success");
                        }
                    } catch (error) {
                        onOpenToast({
                            type: "error",
                            message: "A server error occurred, please try again later",
                            timeout: 5000,
                        });
                        console.log(error);
                    }
                }
            };

            Array.from(files).forEach((file, index) => {
                setTimeout(() => uploadFile(file, index), index * 30000);
            });
        });
    }

    // Use MutationObserver to detect when the button is added to the DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                const massUploaderButton = document.getElementById('massUploaderButton');
                if (massUploaderButton) {
                    massUploaderButton.addEventListener('click', addNISFileToCAMUploadFunctionality);
                    observer.disconnect(); // Stop observing once the button is found
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
