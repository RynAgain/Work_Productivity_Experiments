// Sample logic for Tampermonkey script

(function() {
    'use strict';

    console.log('Sample logic script loaded.');

    // Create a draggable button
    const button = document.createElement('button');
    button.innerText = 'NIS Tools';
    button.className = 'btn btn-primary';
    button.style.position = 'absolute';
    button.style.top = '50px';
    button.style.left = '50px';
    document.body.appendChild(button);

    // Make the button draggable
    button.onmousedown = function(event) {
        let shiftX = event.clientX - button.getBoundingClientRect().left;
        let shiftY = event.clientY - button.getBoundingClientRect().top;

        function moveAt(pageX, pageY) {
            button.style.left = pageX - shiftX + 'px';
            button.style.top = pageY - shiftY + 'px';
        }

        function onMouseMove(event) {
            moveAt(event.pageX, event.pageY);
        }

        document.addEventListener('mousemove', onMouseMove);

        button.onmouseup = function() {
            document.removeEventListener('mousemove', onMouseMove);
            button.onmouseup = null;
        };
    };

    button.ondragstart = function() {
        return false;
    };
})();
