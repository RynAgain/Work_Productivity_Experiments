(function(){
  'use strict';

  function makeDraggable(element, defaultPos){
     element.style.position = 'absolute';
     if(defaultPos){
        element.style.left = defaultPos.left + 'px';
        element.style.top = defaultPos.top + 'px';
     } else {
       element.style.left = element.style.left || '0px';
       element.style.top = element.style.top || '0px';
     }
     var pos = {x:0, y:0};

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
         var dx = pos.x - e.clientX;
         var dy = pos.y - e.clientY;
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
      var container = document.getElementById('camBaseButtons');
      if(!container){
         container = document.createElement('div');
         container.id = 'camBaseButtons';
         container.style.position = 'fixed';
         container.style.bottom = '0';
         container.style.left = '0';
         container.style.zIndex = '1000';
         container.style.backgroundColor = 'black';
         container.style.padding = '10px';
         container.style.borderRadius = '5px';
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
