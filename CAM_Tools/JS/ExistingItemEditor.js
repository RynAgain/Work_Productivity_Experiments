(function () {
    'use strict';

    const BUTTON_ID = 'existing-item-editor-btn';
    const GENERAL_HELP_BTN_ID = 'generalHelpToolsButton';

    // Helper: Detect side menu mode (adjust selector as needed)
    function isSideMenuMode() {
        // Example: check for a sidebar element or class on body
        // Update this logic to match your app's actual side menu mode detection
        return !!document.querySelector('.side-menu, .sidebar, #side-menu, #sidebar');
    }

    // Inject styles for the new button
    const style = document.createElement('style');
    style.textContent = `
        #${BUTTON_ID} {
            position: fixed;
            left: 0;
            /* Will be set dynamically based on General Help Tools button position */
            z-index: 3201;
            background: #004E36;
            color: #fff;
            border: none;
            border-radius: 0 5px 5px 0;
            padding: 0;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 2px 2px 8px rgba(0,0,0,0.2);
            cursor: pointer;
            font-size: 18px;
            transition: background 0.2s;
        }
        #${BUTTON_ID}:hover {
            background: #218838;
        }
    `;
    document.head.appendChild(style);

    function addExistingItemEditorButton() {
        // Only add in side menu mode
        if (!isSideMenuMode()) {
            const btn = document.getElementById(BUTTON_ID);
            if (btn) btn.remove();
            return;
        }
        if (document.getElementById(BUTTON_ID)) return;

        const btn = document.createElement('button');
        btn.id = BUTTON_ID;
        btn.title = 'Existing Item Editor (placeholder)';
        btn.innerHTML = `
            <svg width="22" height="22" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                <rect x="4" y="4" width="16" height="16" rx="2" fill="#fff" stroke="none"/>
                <rect x="4" y="4" width="16" height="16" rx="2"/>
                <path d="M8 12h8M8 16h5"/>
                <rect x="6.5" y="6.5" width="3" height="11" rx="0.5" fill="#004E36" stroke="#004E36"/>
                <path d="M8 8v8" stroke="#fff" stroke-width="1.2"/>
                <path d="M6.5 10.5h3" stroke="#fff" stroke-width="1.2"/>
            </svg>
        `;
        btn.onclick = function () {
            alert('Existing Item Editor button clicked. Implement functionality here.');
        };

        // Place directly below the General Help Tools button if present, else append to body
        const generalHelpBtn = document.getElementById(GENERAL_HELP_BTN_ID);
        if (generalHelpBtn && generalHelpBtn.parentNode) {
            // Try to position the new button directly below the General Help Tools button
            // If the General Help Tools button is fixed, match its left and set top accordingly
            const rect = generalHelpBtn.getBoundingClientRect();
            btn.style.position = 'fixed';
            btn.style.left = rect.left + 'px';
            btn.style.top = (rect.top + rect.height + 4) + 'px'; // 4px gap
            document.body.appendChild(btn);
        } else {
            document.body.appendChild(btn);
        }
    }

    // Use MutationObserver to ensure button stays present/removed as needed
    const observer = new MutationObserver(addExistingItemEditorButton);
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial attempt to add the button
    addExistingItemEditorButton();

    // Expose for testing
    try {
        module.exports = { addExistingItemEditorButton };
    } catch (e) {}
})();