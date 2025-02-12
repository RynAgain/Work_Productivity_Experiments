(function () {
    'use strict';

    // MAIN FUNCTION: adds our overlay and functionality for file chunking
    function addFileChunkerFunctionality() {
        console.log('File Chunker button clicked');
        try {
            // Create overlay
            var overlay = document.createElement('div');
            overlay.id = 'fileChunkerOverlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            overlay.style.zIndex = '1001';
            overlay.style.display = 'flex';
            overlay.style.flexDirection = 'column';
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

            // Create a container for form elements and messages
            var formContainer = document.createElement('div');
            formContainer.style.position = 'relative';
            formContainer.style.backgroundColor = '#fff';
            formContainer.style.padding = '20px';
            formContainer.style.borderRadius = '5px';
            formContainer.style.width = '320px';
            formContainer.style.textAlign = 'center';

            // Message element for progress and success
            var messageEl = document.createElement('div');
            messageEl.style.marginBottom = '10px';
            messageEl.style.fontSize = '14px';
            messageEl.style.color = '#333';

            // Create form elements inner HTML including the upload validation checkbox
            formContainer.innerHTML = `
                <h3>File Chunker</h3>
                <input type="file" id="fileChunkerInput" accept=".csv" style="width: 100%; margin-bottom: 10px;">
                <label for="rowsPerChunk">Rows Per File</label>
                <input type="number" id="rowsPerChunk" value="1000" min="1" style="width: 100%; margin-bottom: 10px;">
                <label for="uploadValidation" style="display: block; margin-bottom: 10px;">
                    <input type="checkbox" id="uploadValidation" checked> Upload Validation
                </label>
                <button id="chunkFileButton" style="width: 100%; margin-bottom: 10px;">Chunk File & Download Zip</button>
                <!-- Future section for additional CSV data validation can be added below. -->
            `;

            // Append message element and close button
            formContainer.insertBefore(messageEl, formContainer.firstChild);
            formContainer.appendChild(closeButton);
            overlay.appendChild(formContainer);
            document.body.appendChild(overlay);

            // Function to update message element
            function updateMessage(text) {
                messageEl.textContent = text;
            }

            // Event listener for "Chunk File & Download Zip" button
            document.getElementById('chunkFileButton').addEventListener('click', function() {
                var fileInput = document.getElementById('fileChunkerInput');
                if (fileInput.files.length === 0) {
                    alert('Please select a CSV file to upload.');
                    return;
                }
                var file = fileInput.files[0];
                var rowsPerFile = parseInt(document.getElementById('rowsPerChunk').value, 10);
                if (isNaN(rowsPerFile) || rowsPerFile < 1) {
                    alert('Please enter a valid number of rows per file.');
                    return;
                }
                console.log('File selected:', file.name, 'Rows per file:', rowsPerFile);

                // Disable button and show processing indicator
                var chunkButton = document.getElementById('chunkFileButton');
                chunkButton.disabled = true;
                updateMessage('Processing...');

                // Check if JSZip is available
                if (typeof JSZip === 'undefined') {
                    alert('JSZip library is required for zipping the files. Please include it on your page.');
                    chunkButton.disabled = false;
                    updateMessage('');
                    return;
                }

                var reader = new FileReader();
                reader.onload = function(event) {
                    try {
                        var csvData = event.target.result;
                        var header, dataRows;
                        var expectedHeader = "Store - 3 Letter Code,Item Name,Item PLU/UPC,Availability,Current Inventory,Sales Floor Capacity,Andon Cord,Tracking Start Date,Tracking End Date";
                        // Determine if header validation is enabled
                        var doValidation = document.getElementById('uploadValidation').checked;
                        
                        // Use PapaParse if available for robust CSV parsing
                        if (typeof Papa !== 'undefined') {
                            var result = Papa.parse(csvData, { header: false, skipEmptyLines: true });
                            if (result.errors.length > 0) {
                                throw new Error("Error parsing CSV: " + result.errors[0].message);
                            }
                            var parsedData = result.data;
                            if (parsedData.length === 0) {
                                alert('CSV file is empty.');
                                chunkButton.disabled = false;
                                updateMessage('');
                                return;
                            }
                            header = parsedData[0].join(',');
                            if (doValidation && header.trim() !== expectedHeader.trim()) {
                                alert("CSV header does not match expected format.\nExpected: " + expectedHeader);
                                chunkButton.disabled = false;
                                updateMessage('');
                                return;
                            }
                            dataRows = [];
                            for (var i = 1; i < parsedData.length; i++) {
                                dataRows.push(parsedData[i].join(','));
                            }
                        } else {
                            // Fallback: simple splitting by newlines
                            var lines = csvData.split('\n').filter(function(line) { return line.trim() !== ''; });
                            if (lines.length === 0) {
                                alert('CSV file is empty.');
                                chunkButton.disabled = false;
                                updateMessage('');
                                return;
                            }
                            header = lines[0];
                            if (doValidation && header.trim() !== expectedHeader.trim()) {
                                alert("CSV header does not match expected format.\nExpected: " + expectedHeader);
                                chunkButton.disabled = false;
                                updateMessage('');
                                return;
                            }
                            dataRows = lines.slice(1);
                        }
                        
                        var totalChunks = Math.ceil(dataRows.length / rowsPerFile);
                        console.log('Total chunks to create:', totalChunks);

                        var zip = new JSZip();
                        for (var i = 0; i < totalChunks; i++) {
                            try {
                                var chunkData = dataRows.slice(i * rowsPerFile, (i + 1) * rowsPerFile);
                                var chunkCsv = [header].concat(chunkData).join('\n');
                                zip.file('chunk_' + (i + 1) + '.csv', chunkCsv);
                            } catch (chunkError) {
                                console.error('Error processing chunk ' + (i + 1) + ':', chunkError);
                            }
                        }

                        // Generate zip file and trigger download
                        zip.generateAsync({ type: 'blob' }).then(function(content) {
                            var link = document.createElement('a');
                            link.href = window.URL.createObjectURL(content);
                            link.download = 'chunked_files.zip';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            updateMessage('Success: Files chunked and zip downloaded.');
                            chunkButton.disabled = false;
                        }).catch(function(error) {
                            console.error('Error generating zip file:', error);
                            alert('An error occurred while generating the zip file.');
                            chunkButton.disabled = false;
                            updateMessage('');
                        });
                    } catch (err) {
                        console.error('Error processing CSV:', err);
                        alert('An error occurred: ' + err.message);
                        chunkButton.disabled = false;
                        updateMessage('');
                    }
                };
                reader.readAsText(file);
            });
        } catch (error) {
            console.error('[FileChunker] File Chunker Failed', error);
        }
    }

    try {
        module.exports = {
            addFileChunkerFunctionality
        };
    } catch (e) {
        // Handle the error if needed
    }

    // Use MutationObserver to detect when the filechunker button is added to the DOM
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                var fileChunkerButton = document.getElementById('filechunker');
                if (fileChunkerButton) {
                    fileChunkerButton.addEventListener('click', addFileChunkerFunctionality);
                    observer.disconnect(); // Stop observing once the button is found
                }
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
