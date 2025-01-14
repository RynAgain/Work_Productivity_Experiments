(function() {
    'use strict';

    // Function to add the PLU Dedupe & List button functionality
    function addPLUDedupeListFunctionality() {
        console.log('PLU Dedupe & List button clicked');
        // Create overlay
        var overlay = document.createElement('div');
        overlay.id = 'pluDedupeOverlay';
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
            // Copy to clipboard
            navigator.clipboard.writeText(uniqueNumbers.join(', ')).then(() => {
                // Display "Copied!" message
                const copiedMessage = document.createElement('div');
                copiedMessage.innerText = 'Copied!';
                copiedMessage.style.position = 'fixed';
                copiedMessage.style.bottom = '10px';
                copiedMessage.style.right = '10px';
                copiedMessage.style.backgroundColor = '#4CAF50';
                copiedMessage.style.color = '#fff';
                copiedMessage.style.padding = '10px';
                copiedMessage.style.borderRadius = '5px';
                document.body.appendChild(copiedMessage);

                // Remove the message after 2 seconds
                setTimeout(() => {
                    document.body.removeChild(copiedMessage);
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                // Copy to clipboard
            navigator.clipboard.writeText(uniqueNumbers.join(', ')).then(() => {
                // Display "Copied!" message
                const copiedMessage = document.createElement('div');
                copiedMessage.innerText = 'Copied!';
                copiedMessage.style.position = 'fixed';
                copiedMessage.style.bottom = '10px';
                copiedMessage.style.right = '10px';
                copiedMessage.style.backgroundColor = '#4CAF50';
                copiedMessage.style.color = '#fff';
                copiedMessage.style.padding = '10px';
                copiedMessage.style.borderRadius = '5px';
                document.body.appendChild(copiedMessage);

                // Remove the message after 2 seconds
                setTimeout(() => {
                    document.body.removeChild(copiedMessage);
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        });
        });

        var formContainer = document.createElement('div');
        formContainer.style.position = 'relative';
        formContainer.style.backgroundColor = '#fff';
        formContainer.style.padding = '20px';
        formContainer.style.borderRadius = '5px';
        formContainer.style.width = '300px';

        // Create input and output elements
        formContainer.innerHTML = `
            <h3>PLU Dedupe & List</h3>
            <textarea id="pluInput" style="width: 100%; height: 100px; margin-bottom: 10px;" placeholder="Paste numbers here..."></textarea>
            <button id="transformButton" style="width: 100%; margin-bottom: 10px;">Transform</button>
            <div id="pluOutput" style="width: 100%; height: 100px; border: 1px solid #ccc; padding: 10px; overflow-y: auto;"></div>
        `;

        formContainer.appendChild(closeButton);
        overlay.appendChild(formContainer);
        document.body.appendChild(overlay);

        // Add event listener to the "Transform" button
        document.getElementById('transformButton').addEventListener('click', function() {
            const input = document.getElementById('pluInput').value;
            const numbers = input.split(/\s+/).map(num => num.trim()).filter(num => num !== '');
            const uniqueNumbers = Array.from(new Set(numbers));
            const outputText = uniqueNumbers.join(', ');
            document.getElementById('pluOutput').innerText = outputText;

            // Copy to clipboard
            navigator.clipboard.writeText(outputText).then(() => {
                // Display "Copied!" message on the Transform button
                const transformButton = document.getElementById('transformButton');
                const originalText = transformButton.innerText;
                transformButton.innerText = 'Copied!';
                setTimeout(() => {
                    transformButton.innerText = originalText;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        });
    }

    // Use MutationObserver to detect when the button is added to the DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                const pluDedupeListButton = document.getElementById('pluDedupeListButton');
                if (pluDedupeListButton) {
                    pluDedupeListButton.addEventListener('click', addPLUDedupeListFunctionality);
                    observer.disconnect(); // Stop observing once the button is found
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
