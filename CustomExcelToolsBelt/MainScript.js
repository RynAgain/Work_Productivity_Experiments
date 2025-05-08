// ==UserScript==
// @name         Modular Tampermonkey UI System
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Modular UI system for /editor page, with feature panel registration
// @match        https://*.cam.wfm.amazon.dev/editor*
// @require      https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.0/xlsx.full.min.js

// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CustomExcelToolsBelt/JS/ExcelEditFun.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CustomExcelToolsBelt/JS/previewFile.js

// @grant        none
// @updateURL    https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CustomExcelToolsBelt/MainScript.js
// ==/UserScript==

(function() {
  'use strict';

  // Only run on /editor
  if (!/\/editor($|\?)/.test(window.location.pathname)) return;

  // --- Styles ---
  const style = document.createElement('style');
  style.textContent = `
    #tm-ui-sidebar {
      position: fixed;
      top: 60px;
      right: 40px;
      width: 370px;
      min-height: 200px;
      background: #fff;
      border: 2px solid #004E36;
      border-radius: 10px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.13);
      z-index: 9999;
      font-family: 'Segoe UI', Arial, sans-serif;
      display: flex;
      flex-direction: column;
    }
    #tm-ui-tabs {
      display: flex;
      border-bottom: 1px solid #eee;
      background: #f7f7f7;
      border-radius: 10px 10px 0 0;
      overflow-x: auto;
    }
    .tm-ui-tab {
      padding: 10px 18px;
      cursor: pointer;
      font-weight: 500;
      color: #004E36;
      background: none;
      border: none;
      outline: none;
      border-radius: 10px 10px 0 0;
      transition: background 0.2s;
      margin-right: 2px;
    }
    .tm-ui-tab.active {
      background: #fff;
      border-bottom: 2px solid #004E36;
      color: #218838;
    }
    #tm-ui-panels {
      flex: 1;
      padding: 18px 20px 16px 20px;
      overflow-y: auto;
      min-height: 120px;
    }
  `;
  document.head.appendChild(style);

  // --- Main Container ---
  const sidebar = document.createElement('div');
  sidebar.id = 'tm-ui-sidebar';

  // Tabs
  const tabs = document.createElement('div');
  tabs.id = 'tm-ui-tabs';

  // Panels
  const panels = document.createElement('div');
  panels.id = 'tm-ui-panels';

  sidebar.appendChild(tabs);
  sidebar.appendChild(panels);
  document.body.appendChild(sidebar);

  // --- UI System ---
  const panelRegistry = [];
  let activePanelId = null;

  function renderTabs() {
    tabs.innerHTML = '';
    panelRegistry.forEach((panel, idx) => {
      const tab = document.createElement('button');
      tab.className = 'tm-ui-tab' + (panel.id === activePanelId ? ' active' : '');
      tab.textContent = panel.title;
      tab.onclick = () => setActivePanel(panel.id);
      tabs.appendChild(tab);
    });
  }

  function renderPanels() {
    panels.innerHTML = '';
    const panel = panelRegistry.find(p => p.id === activePanelId);
    if (panel && typeof panel.render === 'function') {
      const panelContent = panel.render();
      if (panelContent instanceof HTMLElement) {
        panels.appendChild(panelContent);
// --- Shared File State Manager ---
(function() {
  // Holds the current workbook and sheet data
  let fileState = {
    workbook: null, // XLSX workbook object
    sheetName: null, // string
    sheetData: null  // array of row objects
  };
  const listeners = [];

  window.TM_FileState = {
    getState() {
      return { ...fileState };
    },
    setWorkbook(wb, sheetName) {
      fileState.workbook = wb;
      fileState.sheetName = sheetName || (wb && wb.SheetNames[0]) || null;
      fileState.sheetData = wb && fileState.sheetName
        ? XLSX.utils.sheet_to_json(wb.Sheets[fileState.sheetName], { defval: '' })
        : null;
      notify();
    },
    setSheetData(data) {
      fileState.sheetData = data;
      notify();
    },
    setSheetName(name) {
      fileState.sheetName = name;
      fileState.sheetData = fileState.workbook && name
        ? XLSX.utils.sheet_to_json(fileState.workbook.Sheets[name], { defval: '' })
        : null;
      notify();
    },
    subscribe(fn) {
      if (typeof fn === 'function') listeners.push(fn);
    },
    unsubscribe(fn) {
      const idx = listeners.indexOf(fn);
      if (idx >= 0) listeners.splice(idx, 1);
    }
  };

  function notify() {
    listeners.forEach(fn => {
      try { fn(window.TM_FileState.getState()); } catch (e) {}
    });
    window.dispatchEvent(new CustomEvent('TM_FILESTATE_UPDATED', { detail: window.TM_FileState.getState() }));
  }
})();
      } else if (typeof panelContent === 'string') {
        panels.innerHTML = panelContent;
      }
    }
  }

  function setActivePanel(id) {
    activePanelId = id;
    renderTabs();
    renderPanels();
  }

  // --- Public API ---
  window.TM_UI = {
    /**
     * Register a new panel in the sidebar.
     * @param {Object} opts - { id: string, title: string, render: function }
     */
    registerPanel(opts) {
      if (!opts || !opts.id || !opts.title || typeof opts.render !== 'function') return;
      if (panelRegistry.some(p => p.id === opts.id)) return; // Prevent duplicate
      panelRegistry.push(opts);
      if (panelRegistry.length === 1) {
        activePanelId = opts.id;
      }
      renderTabs();
      renderPanels();
    },
    /**
     * Set the active panel by id.
     * @param {string} id
     */
    setActivePanel,
    /**
     * Get the list of registered panels.
     * @returns {Array}
     */
    getPanels() {
      return panelRegistry.slice();
    }
  };

  // Optionally, expose a hook for modules to know when UI is ready
  window.dispatchEvent(new Event('TM_UI_READY'));

})();