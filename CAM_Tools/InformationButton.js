(function() {
    'use strict';

    // Function to add the information button
    function addInformationButton() {
        console.log('Attempting to add information button');

        // Check if the button already exists
        if (document.getElementById('informationButton')) {
            console.log('Information button already exists');
            return;
        }

        // Create the information button
        var informationButton = document.createElement('button');
        informationButton.id = 'informationButton';
        informationButton.innerHTML = 'Information';
        informationButton.style.position = 'fixed';
        informationButton.style.bottom = '0';
        informationButton.style.left = '75%';
        informationButton.style.width = '20%';
        informationButton.style.height = '40px';
        informationButton.style.zIndex = '1000';
        informationButton.style.fontSize = '14px';
        informationButton.style.backgroundColor = '#004E36';
        informationButton.style.color = '#fff';
        informationButton.style.border = 'none';
        informationButton.style.borderRadius = '0';
        informationButton.style.cursor = 'pointer';

        // Append the button to the body
        document.body.appendChild(informationButton);
        console.log('Information button added to the page');

        // Add click event to the information button
        informationButton.addEventListener('click', function() {
            alert('Coming soon');
        });
    }

    // Initialize the information button
    addInformationButton();
})();
