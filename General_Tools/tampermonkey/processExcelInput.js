(function() {
    'use strict';

    function initializeProcessExcelInput() {
        // Function to add a button to process Excel-like input
        function addProcessExcelInputButton() {
            // Check if button is already initialized
            if (document.getElementById('processExcelInputButton')) return;

            const button = document.createElement('button');
            button.id = 'processExcelInputButton';
            button.textContent = 'Process Excel Input';
            button.style.margin = '10px';
            button.addEventListener('click', () => {
                // Create input and output areas
                const inputArea = document.createElement('textarea');
                inputArea.placeholder = 'Paste Excel data here';
                inputArea.style.width = '300px';
                inputArea.style.height = '100px';

                const outputArea = document.createElement('textarea');
                outputArea.placeholder = 'Output will appear here';
                outputArea.style.width = '300px';
                outputArea.style.height = '100px';
                outputArea.readOnly = true;

                const processButton = document.createElement('button');
                processButton.textContent = 'Process';
                processButton.addEventListener('click', () => {
                    const inputData = inputArea.value.split(/[\r\n]+/);
                    const uniqueData = Array.from(new Set(inputData)).filter(item => item.trim() !== '');
                    outputArea.value = uniqueData.join(', ');
                });

                const container = document.createElement('div');
                container.appendChild(inputArea);
                container.appendChild(processButton);
                container.appendChild(outputArea);

                document.querySelector('div').appendChild(container);
            });
            document.querySelector('div').appendChild(button);
        }

        // Add the button to the overlay menu
        addProcessExcelInputButton();
    }

    // Observe changes to the body to reinitialize the button if needed
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                initializeProcessExcelInput();
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Initial setup
    initializeProcessExcelInput();
})();
