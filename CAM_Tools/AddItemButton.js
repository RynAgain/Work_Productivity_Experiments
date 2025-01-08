(function() {
    'use strict';

    // Function to add the add new item(s) button
    function addAddItemButton() {
        console.log('Attempting to add add new item(s) button');

        // Check if the button already exists
        if (document.getElementById('addItemButton')) {
            console.log('Add new item(s) button already exists');
            return;
        }

        // Create the add new item(s) button
        var addItemButton = document.createElement('button');
        addItemButton.id = 'addItemButton';
        addItemButton.innerHTML = 'Add New Item(s)';
        addItemButton.style.position = 'fixed';
        addItemButton.style.bottom = '0';
        addItemButton.style.left = '25%';
        addItemButton.style.width = '25%';
        addItemButton.style.height = '40px';
        addItemButton.style.zIndex = '1000 !important';
        addItemButton.style.fontSize = '14px !important';
        addItemButton.style.backgroundColor = '#28a745 !important';
        addItemButton.style.color = '#fff !important';
        addItemButton.style.border = 'none !important';
        addItemButton.style.borderRadius = '0';
        addItemButton.style.cursor = 'pointer !important';

        // Append the button to the body
        document.body.appendChild(addItemButton);
        console.log('Add new item(s) button added to the page');

        // Add click event to the add new item(s) button
        addItemButton.addEventListener('click', function() {
            console.log('Add New Item(s) button clicked');
            // Create overlay
            var overlay = document.createElement('div');
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
            var closeButton = document.createElement('span');
            closeButton.innerHTML = '&times;';
            closeButton.style.position = 'absolute';
            closeButton.style.top = '0';
            closeButton.style.left = '0';
            closeButton.style.fontSize = '24px';
            closeButton.style.cursor = 'pointer';
            closeButton.style.color = '#000';
            closeButton.addEventListener('click', function() {
                document.body.removeChild(overlay);
            });

            var formContainer = document.createElement('div');
            formContainer.style.backgroundColor = '#fff';
            formContainer.style.padding = '20px';
            formContainer.style.borderRadius = '5px';
            formContainer.style.width = '300px';

            // Create form elements
            formContainer.innerHTML = `
                <h3>Add New Item</h3>
                <label>Store - 3 Letter Code</label>
                <input type="text" id="storeCode" style="width: 100%; margin-bottom: 10px;">
                <label>PLU</label>
                <input type="text" id="plu" style="width: 100%; margin-bottom: 10px;">
                <label>Current Inventory</label>
                <input type="number" id="currentInventory" style="width: 100%; margin-bottom: 10px;">
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
                <button id="generateFileButton" style="width: 100%;">Generate File</button>
            `;

            formContainer.appendChild(closeButton);
            overlay.appendChild(formContainer);
            document.body.appendChild(overlay);

            // Append close button and form to overlay
            formContainer.appendChild(closeButton);
            overlay.appendChild(formContainer);
            document.body.appendChild(overlay);

            // Ensure elements exist before attaching event listeners
            var availabilityElement = document.getElementById('availability');
            var generateFileButton = document.getElementById('generateFileButton');

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

                    // Check if all fields are filled
                    if (!storeCode || !plu || !availability || !andonCord) {
                        alert('Please fill in all fields before generating the file.');
                        return;
                    }

                    var csvContent = "data:text/csv;charset=utf-8,Store - 3 Letter Code,Item Name,Item PLU/UPC,Availability,Current Inventory,Sales Floor Capacity,Andon Cord\n"
                        + `${storeCode},"Null",${plu},${availability},${currentInventory},,${andonCord}\n`;

                    // Create a download link
                    var encodedUri = encodeURI(csvContent);
                    var link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "new_item.csv");
                    document.body.appendChild(link);

                    // Trigger the download
                    link.click();
                    document.body.removeChild(link);

                    // Remove overlay
                    document.body.removeChild(overlay);
                });
            }
        });
    }

    // Use MutationObserver to detect changes in the DOM
    const observer = new MutationObserver(addAddItemButton);
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial attempt to add the add new item(s) button
    addAddItemButton();
})();
