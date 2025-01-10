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
        // Create the overlay
        var overlay = document.createElement('div');
        overlay.id = 'informationOverlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        overlay.style.color = '#fff';
        overlay.style.zIndex = '1001';
        overlay.style.display = 'none';
        overlay.style.overflow = 'auto';
        overlay.style.padding = '20px';
        overlay.style.boxSizing = 'border-box';
        overlay.innerHTML = `<pre>${`# Tampermonkey Script Breakdown

This repository contains a set of scripts designed for use with Tampermonkey. The scripts are split into separate files for better maintainability, each handling a specific button's functionality on the webpage.

## Files

1. **MainScript.js**: The main script that includes \`@require\` directives for the other scripts. This script should be installed in the Tampermonkey extension.

2. **DownloadButton.js**: Handles the creation and functionality of the "Download Data" button.

3. **AddItemButton.js**: Handles the creation and functionality of the "Add New Item(s)" button. 

4. **ActivateButton.js**: Handles the creation and functionality of the "Activate/Deactivate Item(s)" button.

5. **RedriveButton.js**: Handles the creation and functionality of the "Redrive" button.

## Usage

- **MainScript.js**: Install this script in Tampermonkey. It will automatically include the other scripts using the \`@require\` directive.
- **Button Scripts**: Host these scripts on a public GitHub repository. Update the \`@require\` URLs in \`MainScript.js\` to point to the raw GitHub URLs of these scripts.

## Installation

1. Install \`MainScript.js\` in Tampermonkey.
2. Check for updates peridocially in the tampermonkey dashboard.

## Random Issues
1. sometimes the download button just won't appear.  refresh the page.

## License

Not for public use.

## TODO

- [x] Implement the download functionality for the "Download Data" button. (needs testing now)
- [x] Add functionality for the "Add New Item(s)" button.
- [x] Implement the activation/deactivation logic for the "Activate/Deactivate Item(s)" button.
- [ ] Add functionality for the "Redrive" button.`}</pre>`;

        // Append the overlay to the body
        document.body.appendChild(overlay);

        // Add click event to the information button
        informationButton.addEventListener('click', function() {
            overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
        });

        // Add click event to the overlay to close it
        overlay.addEventListener('click', function() {
            overlay.style.display = 'none';
        });
    }

    // Initialize the information button
    addInformationButton();
})();
