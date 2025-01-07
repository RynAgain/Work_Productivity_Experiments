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
            alert('Coming Soon');
        });
    }

    // Use MutationObserver to detect changes in the DOM
    const observer = new MutationObserver(addAddItemButton);
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial attempt to add the add new item(s) button
    addAddItemButton();
})();
