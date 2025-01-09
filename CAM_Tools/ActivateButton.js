(function() {
    'use strict';

    // Function to add the activate/deactivate item(s) button
    function addActivateButton() {
        console.log('Attempting to add activate/deactivate item(s) button');

        // Check if the button already exists
        if (document.getElementById('activateButton')) {
            console.log('Activate/Deactivate item(s) button already exists');
            return;
        }

        // Create the activate/deactivate item(s) button
        var activateButton = document.createElement('button');
        activateButton.id = 'activateButton';
        activateButton.innerHTML = 'Activate/Deactivate Item(s)';
        activateButton.style.position = 'fixed';
        activateButton.style.bottom = '0';
        activateButton.style.left = '40%';
        activateButton.style.width = '20%';
        activateButton.style.height = '40px';
        activateButton.style.zIndex = '1000';
        activateButton.style.fontSize = '14px';
        activateButton.style.backgroundColor = '#004E36';
        activateButton.style.color = '#fff';
        activateButton.style.border = 'none';
        activateButton.style.borderRadius = '0';
        activateButton.style.cursor = 'pointer !important';

        // Append the button to the body
        document.body.appendChild(activateButton);
        console.log('Activate/Deactivate item(s) button added to the page');

        // Add click event to the activate/deactivate item(s) button
        activateButton.addEventListener('click', function() {
            console.log('Activate/Deactivate Item(s) button clicked');
            alert('Coming Soon');
        });
    }

    // Use MutationObserver to detect changes in the DOM
    const observer = new MutationObserver(addActivateButton);
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial attempt to add the activate/deactivate item(s) button
    addActivateButton();
})();
