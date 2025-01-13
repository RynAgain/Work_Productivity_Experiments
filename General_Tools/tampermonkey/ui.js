(function() {
    'use strict';

    // Create the icon button
    const iconButton = document.createElement('button');
    iconButton.style.position = 'fixed';
    iconButton.style.bottom = '10px';
    iconButton.style.left = '10px';
    iconButton.style.zIndex = '1000';
    iconButton.textContent = 'Menu';
    document.body.appendChild(iconButton);

    // Create the overlay menu
    const overlayMenu = document.createElement('div');
    overlayMenu.style.position = 'fixed';
    overlayMenu.style.top = '0';
    overlayMenu.style.left = '0';
    overlayMenu.style.width = '100%';
    overlayMenu.style.height = '100%';
    overlayMenu.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    overlayMenu.style.display = 'none';
    overlayMenu.style.zIndex = '999';
    document.body.appendChild(overlayMenu);

    // Toggle overlay menu visibility
    iconButton.addEventListener('click', () => {
        overlayMenu.style.display = overlayMenu.style.display === 'none' ? 'block' : 'none';
    });
})();
