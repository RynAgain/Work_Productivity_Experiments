(function() {
    'use strict';

    // Expose the function to the global scope for testing
    try {
        module.exports = {
            addAddItemButton
        };
    } catch (e) {
        // Handle the error if needed
    }

    const style = document.createElement('style');
    style.innerHTML = `
        .input-field {
            font-family: inherit;
            font-size: 16px;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
            width: 100%;
            box-sizing: border-box;
            transition: border-color 0.3s, box-shadow 0.3s;
        }
        .input-field:focus {
            border-color: #007bff;
            box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
        }
        .button {
            font-family: inherit;
            font-size: 14px;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            background-color: #004E36;
            color: #fff;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        .button:hover {
            background-color: #218838;
        }
    `;
    document.head.appendChild(style);

    function addAddItemButton() {
        console.log('Attempting to add add new item(s) button');

        // Check if the button already exists
        if (document.getElementById('addItemButton')) {
            console.log('Add new item(s) button already exists');
            return;
        }

        // Create the add new item(s) button
        const addItemButton = document.createElement('button');
        addItemButton.className = 'button';
        addItemButton.id = 'addItemButton';
        addItemButton.innerHTML = 'Add New Item(s)';
        addItemButton.style.position = 'fixed';
        addItemButton.style.bottom = '0';
        addItemButton.style.left = '20%';
        addItemButton.style.width = '20%';
        addItemButton.style.height = '40px';
        addItemButton.style.zIndex = '1000';
        addItemButton.style.fontSize = '14px';
        addItemButton.style.backgroundColor = '#004E36';
        addItemButton.style.color = '#fff';
        addItemButton.style.border = 'none';
        addItemButton.style.borderRadius = '5px';
        addItemButton.style.cursor = 'pointer';

        // Append the button to the body
        document.body.appendChild(addItemButton);
        console.log('Add new item(s) button added to the page');
        addItemButton.addEventListener('mouseover', function(){
            addItemButton.style.backgroundColor = '#218838';
        });
        addItemButton.addEventListener('mouseout', function(){
            addItemButton.style.backgroundColor = '#004E36';
        });

        // Add click event to the add new item(s) button
        addItemButton.addEventListener('click', function() {
            console.log('Add New Item(s) button clicked');
            // Create overlay
            const overlay = document.createElement('div');
            overlay.id = 'addItemOverlay';
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
            const closeButton = document.createElement('span');
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
                <h3>Add New Item</h3>
                <label>Store - 3 Letter Code</label>
                <input type="text" id="storeCode" style="width: 100%; margin-bottom: 10px;" placeholder="AAA">
                <label><input type="checkbox" id="allStoresCheckbox"> All Stores<br></label>
                <label>PLU</label>
                <input type="text" id="plu" style="width: 100%; margin-bottom: 10px;" placeholder="Enter PLU(s) separated by commas">
                <label>Current Inventory</label>
                <input type="number" id="currentInventory" style="width: 100%; margin-bottom: 10px;" placeholder="0">
                <label>Availability</label>
                <select id="availability" style="width: 100%; margin-bottom: 10px;">
                    <option value="Limited">Limited</option>
                    <option value="Unlimited">Unlimited</option>
                </select>
                <label>Andon Cord</label>
                <select id="andonCord" style="width: 100%; margin-bottom: 10px;">
                    <option value="Enabled">Enabled</option>
                    <option value="Disabled">Disabled</option>
                </select>
                <label>Tracking Start Date</label>
                <input type="date" id="trackingStartDate" style="width: 100%; margin-bottom: 10px;">
                <label>Tracking End Date</label>
                <input type="date" id="trackingEndDate" style="width: 100%; margin-bottom: 10px;">
                <button id="generateFileButton" style="width: 100%;">Generate File</button>
            `;

            formContainer.appendChild(closeButton);
            overlay.appendChild(formContainer);
            document.body.appendChild(overlay);

            // Ensure elements exist before attaching event listeners
            var availabilityElement = document.getElementById('availability');
            var generateFileButton = document.getElementById('generateFileButton');

            // Add event listener to the "All Stores" checkbox
            document.getElementById('allStoresCheckbox').addEventListener('change', function() {
                const storeCodeInput = document.getElementById('storeCode');
                storeCodeInput.disabled = this.checked;
                if (this.checked) {
                    storeCodeInput.value = '';
                }
            });

            if (availabilityElement) {
                availabilityElement.addEventListener('change', function() {
                    var currentInventoryField = document.getElementById('currentInventory');
                    if (this.value === 'Unlimited') {
                        currentInventoryField.value = 0;
                        currentInventoryField.disabled = true;
                    } else {
                        currentInventoryField.disabled = false;
                    }

                });
            }

            if (generateFileButton) {
                generateFileButton.addEventListener('click', function() {
                    // Collect input values
                    var storeCode = document.getElementById('storeCode').value;
                    var plu = document.getElementById('plu').value;
                    var currentInventory = document.getElementById('currentInventory').value;
                    var availability = document.getElementById('availability').value;
                    var andonCord = document.getElementById('andonCord').value;

                    // Check if all required fields are filled
                    if ((!storeCode && !document.getElementById('allStoresCheckbox').checked) || !plu || !availability || !andonCord) {
                        alert('Please fill in all required fields before generating the file.');
                        return;
                    }

                    // Check if both tracking dates are filled if one is provided
                    var trackingStartDate = document.getElementById('trackingStartDate').value;
                    var trackingEndDate = document.getElementById('trackingEndDate').value;

                    if ((trackingStartDate && !trackingEndDate) || (!trackingStartDate && trackingEndDate)) {
                        alert('Please provide both Tracking Start Date and Tracking End Date.');
                        return;
                    }

                    // Split store codes and PLUs by commas
                    var storeCodes = Array.from(new Set(storeCode.split(',').map(code => code.trim())));
                    var plus = Array.from(new Set(plu.split(',').map(p => p.trim())));

                    // Create CSV content
                    var csvContent = 'Store - 3 Letter Code,Item Name,Item PLU/UPC,Availability,Current Inventory,Sales Floor Capacity,Andon Cord,Tracking Start Date,Tracking End Date\n';
                    
                    // Generate a row for each combination of store code and PLU
                    storeCodes.forEach(store => {
                        plus.forEach(plu => {
                            csvContent += `${store},Name_Does_Not_Matter,${plu},${availability},${currentInventory},,${andonCord},${trackingStartDate},${trackingEndDate}\n`;
                        });
                    });

                    // Create a Blob from the CSV string
                    var blob = new Blob([csvContent], { type: 'text/csv' });

                    // Create a link element
                    var link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = 'add_item_data.csv';

                    // Append the link to the body
                    document.body.appendChild(link);

                    // Trigger the download
                    link.click();

                    // Remove the link from the document
                    document.body.removeChild(link);
                });
            }
        });
    }

    // Expose the function to the global scope for testing
    try {
        module.exports = {
            addAddItemButton
        };
    } catch (e) {
        // Handle the error if needed
    }
    // Initialize the add item button
    addAddItemButton();
})();
