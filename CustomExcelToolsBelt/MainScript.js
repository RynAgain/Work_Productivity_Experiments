// ==UserScript==
// @name         Modular Tampermonkey UI System
// @namespace    http://tampermonkey.net/
// @version      0.103
// @description  Modular UI system for /editor page, with feature panel registration
// @match        https://*.cam.wfm.amazon.dev/editor*
// @require      https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.0/xlsx.full.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js

// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CustomExcelToolsBelt/JS/ExcelEditFun.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CustomExcelToolsBelt/JS/previewFile.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CustomExcelToolsBelt/JS/SplitBy.js


// @grant        none
// @updateURL    https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CustomExcelToolsBelt/MainScript.js
// @downloadURL    https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CustomExcelToolsBelt/MainScript.js
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
  // Add Reset/Clear button
  const resetBtn = document.createElement('button');
  resetBtn.textContent = 'Reset/Clear File';
  resetBtn.style.background = '#fff';
  resetBtn.style.color = '#004E36';
  resetBtn.style.border = '1.5px solid #004E36';
  resetBtn.style.borderRadius = '5px';
  resetBtn.style.padding = '7px 0';
  resetBtn.style.fontSize = '15px';
  resetBtn.style.cursor = 'pointer';
  resetBtn.style.margin = '10px 20px 0 20px';
  resetBtn.style.transition = 'background 0.2s';
  resetBtn.setAttribute('aria-label', 'Reset or clear the current file');
  resetBtn.onmouseenter = () => { resetBtn.style.background = '#e6f2ef'; };
  resetBtn.onmouseleave = () => { resetBtn.style.background = '#fff'; };
  resetBtn.onclick = function() {
    if (window.TM_FileState) {
      window.TM_FileState.setWorkbook(null, null);
      alert('File state cleared.');
    }
  };
  sidebar.appendChild(resetBtn);

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
// --- Persistent File Preview Area ---
(function() {
  // Wait for DOM and TM_FileState
  function onReady(fn) {
    if (window.TM_FileState && document.body) {
      fn();
    } else {
      setTimeout(() => onReady(fn), 50);
    }
  }

  onReady(function() {
    // Create preview container
    let preview = document.getElementById('tm-file-preview');
    if (!preview) {
      preview = document.createElement('div');
      preview.id = 'tm-file-preview';
      preview.style.position = 'fixed';
      preview.style.top = '60px';
      preview.style.left = '40px';
      preview.style.width = '420px';
      preview.style.background = '#fff';
      preview.style.border = '2px solid #004E36';
      preview.style.borderRadius = '10px';
      preview.style.boxShadow = '0 4px 24px rgba(0,0,0,0.13)';
      preview.style.zIndex = '9999';
      preview.style.fontFamily = "'Segoe UI', Arial, sans-serif";
      preview.style.padding = '18px 20px 16px 20px';
      preview.style.minHeight = '120px';
      preview.style.maxHeight = '70vh';
      preview.style.overflowY = 'auto';
      preview.style.display = 'flex';
      preview.style.flexDirection = 'column';
      preview.style.gap = '8px';
      document.body.appendChild(preview);
    }

    // Add styles
    if (!document.getElementById('tm-file-preview-style')) {
      const style = document.createElement('style');
      style.id = 'tm-file-preview-style';
      style.textContent = `
        #tm-file-preview table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 12px;
          font-size: 14px;
        }
        #tm-file-preview th, #tm-file-preview td {
          border: 1px solid #ccc;
          padding: 4px 7px;
          text-align: left;
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        #tm-file-preview th {
          background: #f2f2f2;
          font-weight: 600;
        }
        #tm-file-preview .preview-actions {
          margin-bottom: 10px;
        }
        #tm-file-preview .preview-status {
          color: #004E36;
          font-size: 13px;
          margin-bottom: 8px;
          min-height: 18px;
        }
      `;
      document.head.appendChild(style);
    }

    // Status
    const statusDiv = document.createElement('div');
    statusDiv.className = 'preview-status';
    preview.appendChild(statusDiv);

    // Actions
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'preview-actions';
    const dlXlsxBtn = document.createElement('button');
    dlXlsxBtn.textContent = 'Download as .xlsx';
    dlXlsxBtn.style.marginRight = '8px';
    const dlCsvBtn = document.createElement('button');
    dlCsvBtn.textContent = 'Download as .csv';
    actionsDiv.appendChild(dlXlsxBtn);
    actionsDiv.appendChild(dlCsvBtn);
    preview.appendChild(actionsDiv);

    // Table container
    const tableDiv = document.createElement('div');
    preview.appendChild(tableDiv);

    // Render preview table
    function renderTable(state) {
      tableDiv.innerHTML = '';
      if (!state.workbook || !state.sheetData || !state.sheetName) {
        statusDiv.textContent = 'No file loaded.';
        return;
      }
      statusDiv.textContent = `Previewing: "${state.sheetName}" (${state.sheetData.length} rows)`;
      if (state.sheetData.length === 0) {
        tableDiv.innerHTML = '<div style="color:#888;">Sheet is empty.</div>';
        return;
      }
      // Large file warning
      if (state.sheetData.length > 1000) {
        const warn = document.createElement('div');
        warn.style.color = '#b85c00';
        warn.style.fontWeight = 'bold';
        warn.style.marginBottom = '8px';
        warn.textContent = `Warning: This sheet has ${state.sheetData.length} rows. Preview and operations may be slow.`;
        tableDiv.appendChild(warn);
      }
      const table = document.createElement('table');
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      Object.keys(state.sheetData[0]).forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      state.sheetData.slice(0, 20).forEach(row => {
        const tr = document.createElement('tr');
        Object.keys(state.sheetData[0]).forEach(col => {
          const td = document.createElement('td');
          td.textContent = row[col];
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      tableDiv.appendChild(table);

      if (state.sheetData.length > 20) {
        const more = document.createElement('div');
        more.style.color = '#888';
        more.style.fontSize = '12px';
        more.textContent = `...showing first 20 of ${state.sheetData.length} rows.`;
        tableDiv.appendChild(more);
      }
    }

    // Download handlers
    dlXlsxBtn.onclick = function() {
      const state = window.TM_FileState.getState();
      if (!state.workbook) {
        statusDiv.textContent = 'No file to download.';
        return;
      }
      XLSX.writeFile(state.workbook, 'preview.xlsx');
    };
    dlCsvBtn.onclick = function() {
      const state = window.TM_FileState.getState();
      if (!state.workbook || !state.sheetName) {
        statusDiv.textContent = 'No file to download.';
        return;
      }
      const ws = state.workbook.Sheets[state.sheetName];
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'preview.csv';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 100);
    };

    // Subscribe to file state changes
    let unsub = null;
    function subscribe() {
      if (unsub) window.TM_FileState.unsubscribe(unsub);
      unsub = function(state) { renderTable(state); };
      window.TM_FileState.subscribe(unsub);
      renderTable(window.TM_FileState.getState());
    }
    subscribe();

    // Clean up on removal (not likely needed for persistent preview)
    preview.addEventListener('DOMNodeRemoved', function(e) {
      if (e.target === preview && unsub) {
        window.TM_FileState.unsubscribe(unsub);
      }
    });
  });
})();