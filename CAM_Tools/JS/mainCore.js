/**
 * mainCore.js -- Core bootstrap extracted from the legacy MainScript.user.js body.
 * Tracks registered event listeners and re-attaches them when the SPA
 * re-renders nodes. Runs LAST in the bundle (after all modules).
 */
(function () {
    'use strict';
    console.log("MainScript Started - loading buttons");

    const eventListeners = [];

    function addEventListenerWithTracking(target, type, listener, options) {
        try {
            target.addEventListener(type, listener, options);
            eventListeners.push({ target, type, listener, options });
        } catch (error) {
            console.error(`Error adding event listener: ${error.message}`, { target, type, listener, options });
        }
    }

    try {
        const observer = new MutationObserver((mutationsList) => {
            // Only restore event listeners for added nodes that match tracked targets
            for (const mutation of mutationsList) {
                for (const node of mutation.addedNodes) {
                    if (!(node instanceof HTMLElement)) continue;
                    eventListeners.forEach(({ target, type, listener, options }) => {
                        // If the added node is the target, or contains the target, restore the listener
                        if (node === target || (node.contains && node.contains(target))) {
                            try {
                                target.addEventListener(type, listener, options);
                            } catch (error) {
                                console.error(`Error restoring event listener: ${error.message}`, { target, type, listener, options });
                            }
                        }
                    });
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    } catch (error) {
        console.error(`Error setting up MutationObserver: ${error.message}`);
    }

    // Exposed for any module that wants tracked listeners
    try {
        window.CAM_addEventListenerWithTracking = addEventListenerWithTracking;
    } catch (e) { /* ignore */ }

    // Module export for testing
    try {
        module.exports = { addEventListenerWithTracking };
    } catch (e) {
        // Browser environment
    }
})();
