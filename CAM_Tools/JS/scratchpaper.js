(function() {
    try {
        'use strict';

        // Create the floating button
        const scratchpadButton = document.createElement('button');
        scratchpadButton.id = 'scratchpad-toggle-btn';
        scratchpadButton.innerText = 'Scratchpad';
        scratchpadButton.style.position = 'fixed';
        scratchpadButton.style.bottom = '20px';
        scratchpadButton.style.right = '20px';
        scratchpadButton.style.zIndex = '2000';
        scratchpadButton.style.background = '#004E36';
        scratchpadButton.style.color = '#fff';
        scratchpadButton.style.border = 'none';
        scratchpadButton.style.borderRadius = '5px 5px 0 0';
        scratchpadButton.style.padding = '10px 20px';
        scratchpadButton.style.cursor = 'pointer';
        scratchpadButton.style.fontSize = '16px';
        scratchpadButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';

        // Create the scratchpad container
        const scratchpadContainer = document.createElement('div');
        scratchpadContainer.id = 'scratchpad-container';
        scratchpadContainer.style.position = 'fixed';
        scratchpadContainer.style.bottom = '60px';
        scratchpadContainer.style.right = '20px';
        scratchpadContainer.style.width = '320px';
        scratchpadContainer.style.maxWidth = '90vw';
        scratchpadContainer.style.background = '#fff';
        scratchpadContainer.style.border = '1px solid #888';
        scratchpadContainer.style.borderRadius = '8px';
        scratchpadContainer.style.boxShadow = '0 2px 12px rgba(0,0,0,0.25)';
        scratchpadContainer.style.display = 'none';
        scratchpadContainer.style.zIndex = '2000';

        // Header with collapse/close
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.background = '#004E36';
        header.style.color = '#fff';
        header.style.padding = '8px 12px';
        header.style.borderRadius = '8px 8px 0 0';
        header.style.cursor = 'move';
        header.style.userSelect = 'none';

        const title = document.createElement('span');
        title.innerText = 'Scratchpad';

        const closeBtn = document.createElement('span');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontSize = '20px';
        closeBtn.style.marginLeft = '10px';

        header.appendChild(title);
        header.appendChild(closeBtn);

        // The textarea
        const textarea = document.createElement('textarea');
        textarea.id = 'scratchpad-textarea';
        textarea.style.width = '96%';
        textarea.style.height = '180px';
        textarea.style.margin = '10px 2% 10px 2%';
        textarea.style.resize = 'vertical';
        textarea.style.fontSize = '15px';
        textarea.style.fontFamily = 'monospace';
        textarea.style.border = '1px solid #ccc';
        textarea.style.borderRadius = '4px';
        textarea.style.padding = '8px';
        textarea.style.boxSizing = 'border-box';
        textarea.placeholder = 'Type or paste anything here...';

        // Load from localStorage if available
        textarea.value = localStorage.getItem('scratchpad-content') || '';

        // Save to localStorage on change
        textarea.addEventListener('input', function() {
            localStorage.setItem('scratchpad-content', textarea.value);
        });

        // Collapse/expand logic
        scratchpadButton.addEventListener('click', function() {
            scratchpadContainer.style.display = scratchpadContainer.style.display === 'none' ? 'block' : 'none';
        });
        closeBtn.addEventListener('click', function() {
            scratchpadContainer.style.display = 'none';
        });

        // Keyboard shortcut: Ctrl+Shift+S to toggle
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
                scratchpadContainer.style.display = scratchpadContainer.style.display === 'none' ? 'block' : 'none';
                if (scratchpadContainer.style.display === 'block') {
                    textarea.focus();
                }
                e.preventDefault();
            }
        });

        // Drag-and-drop logic for the scratchpad container
        let isDragging = false;
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        header.addEventListener('mousedown', function(e) {
            isDragging = true;
            // Get the current mouse position and container position
            const rect = scratchpadContainer.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
            // Bring to front
            scratchpadContainer.style.zIndex = '3000';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', function(e) {
            if (isDragging) {
                // Move the container to follow the mouse, keep within viewport
                let left = e.clientX - dragOffsetX;
                let top = e.clientY - dragOffsetY;
                // Clamp to viewport
                left = Math.max(0, Math.min(window.innerWidth - scratchpadContainer.offsetWidth, left));
                top = Math.max(0, Math.min(window.innerHeight - scratchpadContainer.offsetHeight, top));
                scratchpadContainer.style.left = left + 'px';
                scratchpadContainer.style.top = top + 'px';
                scratchpadContainer.style.right = 'auto';
                scratchpadContainer.style.bottom = 'auto';
                scratchpadContainer.style.position = 'fixed';
            }
        });

        document.addEventListener('mouseup', function() {
            if (isDragging) {
                isDragging = false;
                scratchpadContainer.style.zIndex = '2000';
                document.body.style.userSelect = '';
            }
        });

        // Assemble and add to DOM
        scratchpadContainer.appendChild(header);
        scratchpadContainer.appendChild(textarea);
        document.body.appendChild(scratchpadButton);
        document.body.appendChild(scratchpadContainer);
    } catch (err) {
        // Log error but do not break the rest of the page
        console.error('[Scratchpad] Error initializing scratchpad:', err);
    }
})();