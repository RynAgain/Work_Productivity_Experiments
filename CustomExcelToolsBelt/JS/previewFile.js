(function() {
  'use strict';

  // Only run on /editor
  if (!/\/editor($|\?)/.test(window.location.pathname)) return;

  // Wait for TM_UI and TM_FileState to be ready
  function onReady(fn) {
    if (window.TM_UI && window.TM_FileState) {
      fn();
    } else {
      let count = 0;
      function check() {
        if (window.TM_UI && window.TM_FileState) {
          fn();
        } else if (++count < 50) {
          setTimeout(check, 100);
        }
      }
      check();
    }
  }

  // Preview is now handled as a persistent panel in MainScript.js; tab registration removed.

})();