(function() {
    'use strict';

    // Function to convert CSV to Item Availability List
    async function convertCsvToItemAvaialbilityList(file) {
        const fileText = await file.text();
        const parsedFile = Papa.parse(fileText, {
            header: true,
            dynamicTyping: true,
            delimiter: ",",
            skipEmptyLines: true,
        });

        if (parsedFile.errors.length) {
            return { availabilites: [], validatonError: parsedFile.errors[0] };
        }

        return { availabilites: parsedFile.data, validatonError: null };
    }

    // Function to display toast notifications
    function onOpenToast(toast) {
        const toastContainer = document.getElementById('toastContainer') || createToastContainer();
        const toastElement = document.createElement('div');
        toastElement.className = `toast ${toast.type}`;
        toastElement.innerText = toast.message;
        toastContainer.appendChild(toastElement);

        setTimeout(() => {
            toastContainer.removeChild(toastElement);
        }, toast.timeout || 5000);
    }

    function createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.position = 'fixed';
        container.style.bottom = '10px';
        container.style.right = '10px';
        container.style.zIndex = '1002';
        document.body.appendChild(container);
        return container;
    }

    function addMassUploaderFunctionality() {
        console.log('Mass Uploader button clicked');
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
            <button id="newuploadButton" style="width: 100%;">Upload</button>
        `;

        formContainer.appendChild(closeButton);
        overlay.appendChild(formContainer);
        document.body.appendChild(overlay);

        // Add event listener to the "Upload" button
        document.getElementById('newuploadButton').addEventListener('click', async function() {
            console.log('Upload button clicked');
            const files = document.getElementById('massFileInput').files;
            if (files.length === 0) {
                alert('Please select files to upload.');
                return;
            }

            const uploadFile = async (file, index) => {
                console.log(`Preparing to upload file ${index + 1} of ${files.length}: ${file.name}`);
                // Replace with your own CSV conversion logic:
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

            // Stagger uploads 30s each (custom logic)
            Array.from(files).forEach((file, index) => {
                setTimeout(() => uploadFile(file, index), index * 30000);
            });
        });
    }

    /**
     * Attempt to find #massUploaderButton and attach the click listener
     * @returns {boolean} true if found and attached, false otherwise
     */
    function wireUpMassUploaderButton() {
        const massUploaderButton = document.getElementById('massUploaderButton');
        if (massUploaderButton) {
            massUploaderButton.addEventListener('click', addMassUploaderFunctionality);
            return true;
        }
        return false;
    }

    // 1) Try to wire up immediately, in case the button is already in the DOM:
    if (!wireUpMassUploaderButton()) {

        // 2) If not found, use MutationObserver to detect when it appears later:
        const observer = new MutationObserver(function(mutations) {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length > 0 && wireUpMassUploaderButton()) {
                    observer.disconnect(); // Stop once we've found the button
                    break;
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

})();
