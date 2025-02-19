(function() {
    'use strict';

    // Expose the function to the global scope for testing
    try {
        module.exports = {
            addATCPropagationToolButton
        };
    } catch (e) {
        // Handle the error if needed
    }

    function addATCPropagationToolButton() {
        console.log('ATC Propagation Tool button clicked');
        // Check if the button already exists
        if (document.getElementById('atcPropagationToolButton')) {
            console.log('ATC Propagation Tool button already exists');
            return;
        }

        // Create the ATC Propagation Tool button
        const atcButton = document.createElement('button');
        atcButton.id = 'atcPropagationToolButton';
        atcButton.innerHTML = 'ATC Propagation Tool';
        atcButton.className = 'button';
        atcButton.style.position = 'fixed';
        atcButton.style.bottom = '0';
        atcButton.style.left = '50%';
        atcButton.style.width = '20%';
        atcButton.style.height = '40px';
        atcButton.style.zIndex = '1000';

        // Append the button to the body
        document.body.appendChild(atcButton);
        console.log('ATC Propagation Tool button added to the page');
    }

    // Expose the function to the global scope for testing
    try {
        module.exports = {
            addATCPropagationToolButton
        };
    } catch (e) {
        // Handle the error if needed
    }
})();
