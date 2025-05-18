(function () {
    'use strict';

    const BUTTON_ID = 'existing-item-editor-btn';
    const GENERAL_HELP_BTN_ID = 'generalHelpToolsButton';

    

    // Inject styles for the new button
    const style = document.createElement('style');
    style.textContent = `
        #${BUTTON_ID} {
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
            margin-top: 4px;
        }
        #${BUTTON_ID}:hover {
            background: #218838;
        }
    `;
    document.head.appendChild(style);

    function addExistingItemEditorButton() {
        // Remove if already present (to avoid duplicates)
        const oldBtn = document.getElementById(BUTTON_ID);
        if (oldBtn) oldBtn.remove();

        const generalHelpBtn = document.getElementById(GENERAL_HELP_BTN_ID);
        if (!generalHelpBtn) return;

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
        btn.className = 'button';
        Object.assign(btn.style, {
            position: 'fixed',
            left: '100%',
            bottom: '0',
            width: '20%',
            height: '40px',
            zIndex: '1000',
            fontSize: '14px',
            backgroundColor: '#004E36',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
        });

        document.body.appendChild(btn);
    }

    // Ensure the Existing Item Editor button is always added after the General Help Tools button
    function ensureButtonAfterHelp() {
        const helpBtn = document.getElementById(GENERAL_HELP_BTN_ID);
        if (helpBtn) {
            addExistingItemEditorButton();
            observer.disconnect();
        }
    }

    // Observe for the addition of the General Help Tools button if not present
    const observer = new MutationObserver(() => {
        ensureButtonAfterHelp();
    });
    if (!document.getElementById(GENERAL_HELP_BTN_ID)) {
        observer.observe(document.body, { childList: true, subtree: true });
    } else {
        addExistingItemEditorButton();
    }

    // Initial attempt to add the button
    addExistingItemEditorButton();

    // Expose for testing
    try {
        module.exports = { addExistingItemEditorButton };
    } catch (e) {}
})();