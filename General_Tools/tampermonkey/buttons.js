(function() {
    'use strict';

    // Function to add a button to the overlay menu
    function addButton(label, onClick) {
        const button = document.createElement('button');
        button.textContent = label;
        button.style.margin = '10px';
        button.addEventListener('click', onClick);
        document.querySelector('div').appendChild(button);
    }

    // Add a button to process Excel-like input
    addButton('Process Excel Input', () => {
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
})();
