(function () {
    'use strict';

    // SVG icon for the quick tools menu
    const editorIcon = `
        <svg width="22" height="22" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <polygon points="12,2 19,8 19,16 12,22 5,16 5,8" fill="#004E36" stroke="#fff" stroke-width="1.5"/>
            <path d="M12 6v12M9 9l6 6M15 9l-6 6" stroke="#fff" stroke-width="1.5"/>
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