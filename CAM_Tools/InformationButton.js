(function() {
    'use strict';

    // Function to add the information button
    // This function creates a button on the webpage that, when clicked, displays an overlay with information about the scripts.
    function addInformationButton() {
        console.log('Attempting to add information button');

        // Check if the button already exists
        // This prevents multiple buttons from being added if the function is called multiple times.
        if (document.getElementById('informationButton')) {
            console.log('Information button already exists');
            return;
        }

        // Create the information button
        // The button is styled and positioned at the bottom left of the page.
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
        // This makes the button visible on the webpage.
        document.body.appendChild(informationButton);
        console.log('Information button added to the page');

        // Add click event to the information button
        // Create the overlay
        // The overlay contains detailed information and is initially hidden.
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

 a set of scripts designed for use with Tampermonkey. The scripts are split into separate files for better maintainability, each handling a specific button's functionality on the webpage.

## Files

1. **MainScript.js**:  This script should be installed in the Tampermonkey extension.

2. **DownloadButton.js**: Handles the creation and functionality of the "Download Data" button. It initiates a download process, tracks progress, and allows cancellation.

3. **AddItemButton.js**: Handles the creation and functionality of the "Add New Item(s)" button. It allows users to input multiple store codes and PLUs, generating a CSV file with the combinations.

4. **ActivateButton.js**: Handles the creation and functionality of the "Activate/Deactivate Item(s)" button. It toggles the activation state of items.

5. **RedriveButton.js**: Handles the creation and functionality of the "Redrive" button. It triggers a redrive process for selected items.

6. **InformationButton.js**: Provides additional information about the items or processes. It displays detailed breakdowns and usage instructions.

## Usage

- **MainScript.js**: Install this script in Tampermonkey. It will automatically include the other scripts using the \`@require\` directive.
- **Button Scripts**: Host these scripts on a public GitHub repository. Update the \`@require\` URLs in \`MainScript.js\` to point to the raw GitHub URLs of these scripts.

## Installation

1. Install \`MainScript.js\` in Tampermonkey.
2. Check for updates periodically in the Tampermonkey dashboard.

## Random Issues
1. Sometimes the download button just won't appear. Refresh the page.

## License

Not for public use.

## TODO

- [x] Implement the download functionality for the "Download Data" button. (needs testing now)
- [x] Add functionality for the "Add New Item(s)" button.
- [x] Implement the activation/deactivation logic for the "Activate/Deactivate Item(s)" button.
- [ ] Add functionality for the "Redrive" button.`}</pre>
        <button id="darkModeToggleButton" style="width: 100%; margin-top: 10px;">Customize Dark Mode</button>
        `;

        // Add CSS styles for dark mode
        var style = document.createElement('style');
        style.innerHTML = `
            /* Target stable IDs/classes and Tailwind utilities */
            #root, .a-page, .text-white {
                background-color: #121212;
                color: #e0e0e0;
            }

            .bg-\\[\\#004E36\\] {
                background-color: #1a1a1a;
            }

            /* Broad .dark-mode overrides for ephemeral classes */
            .dark-mode * {
                background-color: #444444 !important;
                color: #e0e0e0 !important;
            }

            /* Include css-15arxp in dark mode */
            .css-15arxp {
                background-color: #444444 !important;
                color: #e0e0e0 !important;
            }

            /* Adjust padding for css-zgj7rd */
            .css-zgj7rd {
                padding: 10px !important; /* Adjust as needed */
            }

            svg {
                fill: #e0e0e0;
                stroke: #e0e0e0;
            }
        `;
        document.head.appendChild(style);

        // Add click event to the dark mode toggle button
        var darkModeToggleButton = overlay.querySelector('#darkModeToggleButton');
        var darkModeOverlay = document.createElement('div');
        darkModeOverlay.style.position = 'fixed';
        darkModeOverlay.style.top = '0';
        darkModeOverlay.style.left = '0';
        darkModeOverlay.style.width = '100%';
        darkModeOverlay.style.height = '100%';
        darkModeOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        darkModeOverlay.style.color = '#fff';
        darkModeOverlay.style.zIndex = '1002';
        darkModeOverlay.style.display = 'none';
        darkModeOverlay.style.overflow = 'auto';
        darkModeOverlay.style.padding = '20px';
        darkModeOverlay.style.boxSizing = 'border-box';
        function updateElementList() {
            const elementTypes = [...new Set(Array.from(document.body.querySelectorAll('*'))
                .filter(el => !el.closest('#informationOverlay') && !el.closest('#darkModeOverlay') && (el.id || el.className))
                .map(el => el.id || el.className))];
            darkModeOverlay.innerHTML = '<h3>Customize Dark Mode</h3>';
            elementTypes.forEach(type => {
                darkModeOverlay.innerHTML += `<label><input type="checkbox" class="toggleElement" data-type="${type}" checked> ${type}</label><br>`;
            });
            darkModeOverlay.innerHTML += '<button id="deselectAll" style="margin-top: 10px;">Deselect All</button>';
            darkModeOverlay.innerHTML += '<button id="applyDarkModeSettings" style="margin-top: 10px;">Apply</button>';
            darkModeOverlay.innerHTML += '<button id="resetDarkModeSettings" style="margin-top: 10px;">Reset</button>';
            darkModeOverlay.innerHTML += '<button id="exportSelection" style="margin-top: 10px;">Export Selection</button>';
        }

        document.body.appendChild(darkModeOverlay);

        var deselectAllButton = darkModeOverlay.querySelector('#deselectAll');
deselectAllButton.addEventListener('click', function() {
    document.querySelectorAll('.toggleElement').forEach(function(checkbox) {
        checkbox.checked = false;
        const type = checkbox.getAttribute('data-type');
        const elements = document.querySelectorAll(type);
        elements.forEach(function(el) {
            el.classList.remove('dark-mode');
            el.style.outline = ''; // Remove highlight
        });
    });
});

        document.querySelectorAll('.toggleElement').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const type = checkbox.getAttribute('data-type');
                const elements = document.querySelectorAll(type);
                if (checkbox.checked) {
                    elements.forEach(el => {
                        el.classList.add('dark-mode');
                        el.style.outline = '2px solid red'; // Highlight element
                    });
                } else {
                    elements.forEach(el => {
                        el.classList.remove('dark-mode');
                        el.style.outline = ''; // Remove highlight
                    });
                }
            });
        });

        var applyDarkModeSettings = darkModeOverlay.querySelector('#applyDarkModeSettings');
        applyDarkModeSettings.addEventListener('click', function() {
            document.querySelectorAll('.toggleElement').forEach(checkbox => {
                const type = checkbox.getAttribute('data-type');
                const elements = document.querySelectorAll(type);
                if (checkbox.checked) {
                    elements.forEach(el => {
                        el.classList.add('dark-mode');
                        el.style.outline = '2px solid red'; // Highlight element
                    });
                } else {
                    elements.forEach(el => {
                        el.classList.remove('dark-mode');
                        el.style.outline = ''; // Remove highlight
                    });
                }
            });

            darkModeOverlay.style.display = 'none';
        });

        var resetDarkModeSettings = darkModeOverlay.querySelector('#resetDarkModeSettings');
        resetDarkModeSettings.addEventListener('click', function() {
            document.querySelectorAll('.toggleElement').forEach(checkbox => {
                const type = checkbox.getAttribute('data-type');
                const elements = document.querySelectorAll(type);
                elements.forEach(el => {
                    el.classList.remove('dark-mode');
                    el.style.outline = ''; // Remove highlight
                });
            });
            darkModeOverlay.style.display = 'none';
        });

        var exportSelectionButton = darkModeOverlay.querySelector('#exportSelection');
        exportSelectionButton.addEventListener('click', function() {
            const selectedElements = [];
            document.querySelectorAll('.toggleElement').forEach(checkbox => {
                if (checkbox.checked) {
                    selectedElements.push(checkbox.getAttribute('data-type'));
                }
            });
            const blob = new Blob([selectedElements.join('\n')], { type: 'text/plain' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'selected_elements.txt';
            link.click();
        });

        darkModeToggleButton.addEventListener('click', function() {
            darkModeOverlay.style.display = 'block';
        });
        darkModeToggleButton.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
        });

        // Append the overlay to the body
        // This makes the overlay part of the document, ready to be displayed when needed.
        document.body.appendChild(overlay);

        // Add click event to the information button
        informationButton.addEventListener('click', function() {
            // Toggle the display of the overlay when the button is clicked.
            overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
        });

        // Add click event to the overlay to close it
        overlay.addEventListener('click', function() {
            // Hide the overlay when it is clicked.
            overlay.style.display = 'none';
        });
    }

    // Initialize the information button
    addInformationButton();
    // Initialize the information button when the script loads.
})();
