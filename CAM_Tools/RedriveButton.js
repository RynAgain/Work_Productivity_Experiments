(function() {
    'use strict';

    // Function to add the redrive button
    function addRedriveButton() {
        console.log('Attempting to add redrive button');

        // Check if the button already exists
        if (document.getElementById('redriveButton')) {
            console.log('Redrive button already exists');
            return;
        }

        // Create the redrive button
        var redriveButton = document.createElement('button');
        redriveButton.id = 'redriveButton';
        redriveButton.innerHTML = 'Redrive';
        redriveButton.style.position = 'fixed';
        redriveButton.style.bottom = '0';
        redriveButton.style.left = '75%';
        redriveButton.style.width = '25%';
        redriveButton.style.height = '40px';
        redriveButton.style.zIndex = '1000 !important';
        redriveButton.style.fontSize = '14px !important';
        redriveButton.style.backgroundColor = '#dc3545 !important';
        redriveButton.style.color = '#fff !important';
        redriveButton.style.border = 'none !important';
        redriveButton.style.borderRadius = '0';
        redriveButton.style.cursor = 'pointer !important';

        // Append the button to the body
        document.body.appendChild(redriveButton);
        console.log('Redrive button added to the page');

        // Add click event to the redrive button
        redriveButton.addEventListener('click', function() {
            console.log('Redrive button clicked');
            alert('Coming Soon');
        });
    }

    // Use MutationObserver to detect changes in the DOM
    const observer = new MutationObserver(addRedriveButton);
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial attempt to add the redrive button
    addRedriveButton();
})();
