(function(){
  'use strict';

  // Inject global styles to create a cohesive UI across all modules
  function injectGlobalStyles(){
      var style = document.createElement('style');
      style.innerHTML = `
          /* Global overlay style for UI overlays */
          .ui-overlay {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background-color: rgba(0, 0, 0, 0.5);
              z-index: 1001;
              display: flex;
              justify-content: center;
              align-items: center;
              pointer-events: none;
          }
          /* Global style for UI form containers within overlays */
          .ui-form-container {
              position: relative;
              background-color: #fff;
              padding: 20px;
              border-radius: 5px;
              width: 300px;
              pointer-events: auto;
          }
          /* Global style for base buttons and other buttons */
          .ui-button {
              font-size: 14px;
              background-color: #004E36;
              color: #fff;
              border: none;
              border-radius: 0;
              cursor: pointer;
              padding: 10px;
              transition: background-color 0.3s;
          }
          .ui-button:hover {
              background-color: #218838;
          }
          /* Global style for draggable containers (base panel) */
          #camBaseButtons {
              position: fixed;
              bottom: 0;
              left: 0;
              z-index: 1000;
              background-color: transparent !important;
              padding: 10px;
              border-radius: 5px;
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
          }
      `;
      document.head.appendChild(style);
  }

  // Call the function immediately to inject global styles
  injectGlobalStyles();

  function makeDraggable(element, defaultPos){
     element.style.position = 'absolute';
     if(defaultPos){
        element.style.left = defaultPos.left + 'px';
        element.style.top = defaultPos.top + 'px';
     } else {
       element.style.left = element.style.left || '0px';
       element.style.top = element.style.top || '0px';
     }
     let pos = {x:0, y:0};

     element.onmousedown = dragMouseDown;
     function dragMouseDown(e){
         e = e || window.event;
         e.preventDefault();
         pos.x = e.clientX;
         pos.y = e.clientY;
         document.onmouseup = closeDragElement;
         document.onmousemove = elementDrag;
     }
     function elementDrag(e){
         e = e || window.event;
         e.preventDefault();
         let dx = pos.x - e.clientX;
         let dy = pos.y - e.clientY;
         pos.x = e.clientX;
         pos.y = e.clientY;
         element.style.top = (element.offsetTop - dy) + "px";
         element.style.left = (element.offsetLeft - dx) + "px";
     }
     function closeDragElement(){
         document.onmouseup = null;
         document.onmousemove = null;
     }
  }

  function getBaseButtonsContainer(){
      let container = document.getElementById('camBaseButtons');
      if(!container){
         container = document.createElement('div');
         container.id = 'camBaseButtons';
         // Do not add any button style class to the container so it remains unstyled.
         document.body.appendChild(container);
         makeDraggable(container, {left: 10, top: window.innerHeight - 100});
      }
      return container;
  }

  window.UIUtils = {
    makeDraggable: makeDraggable,
    getBaseButtonsContainer: getBaseButtonsContainer
  };
})();
