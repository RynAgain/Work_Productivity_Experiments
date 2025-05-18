(function () {
    'use strict';

    // SVG icon for the quick tools menu
    const editorIcon = `
        <svg width="22" height="22" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <rect x="4" y="4" width="16" height="16" rx="2" fill="#fff" stroke="none"/>
            <rect x="4" y="4" width="16" height="16" rx="2"/>
            <path d="M8 12h8M8 16h5"/>
            <rect x="6.5" y="6.5" width="3" height="11" rx="0.5" fill="#004E36" stroke="#004E36"/>
            <path d="M8 8v8" stroke="#fff" stroke-width="1.2"/>
            <path d="M6.5 10.5h3" stroke="#fff" stroke-width="1.2"/>
        </svg>
    `;

    // Function to open the Existing Item Editor (placeholder)
    function openExistingItemEditor() {
        alert('Existing Item Editor button clicked. Implement functionality here.');
    }

    // Expose for Settings.js quick tools integration
    try {
        module.exports = { openExistingItemEditor, editorIcon };
    } catch (e) {
        window.openExistingItemEditor = openExistingItemEditor;
        window.editorIcon = editorIcon;
    }
})();