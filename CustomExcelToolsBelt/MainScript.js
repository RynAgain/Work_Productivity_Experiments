// ==UserScript==
// @name         Modular Tampermonkey UI System
// @namespace    http://tampermonkey.net/
// @version      0.121
// @description  Modular UI system for /editor page, with feature panel registration
// @match        https://*.cam.wfm.amazon.dev/editor*
// @require      https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.0/xlsx.full.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js

// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CustomExcelToolsBelt/JS/ExcelEditFun.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CustomExcelToolsBelt/JS/previewFile.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CustomExcelToolsBelt/JS/SplitBy.js
// @require      https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CustomExcelToolsBelt/JS/SplitToUploadFiles.js


// @grant        none
// @updateURL    https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CustomExcelToolsBelt/MainScript.js
// @downloadURL    https://github.com/RynAgain/Work_Productivity_Experiments/raw/main/CustomExcelToolsBelt/MainScript.js
// @run-at document-end
// ==/UserScript==

(function() {
  'use strict';

  // Only run on /editor
  if (!/\/editor($|\?)/.test(window.location.pathname)) return;

  // --- FULL PAGE APP OVERWRITE ---
  // Remove all existing content and set up a new root
  document.body.innerHTML = '';
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.background = '#f7f7f7';

  // Create app root
  const appRoot = document.createElement('div');
  appRoot.id = 'tm-app-root';
  appRoot.style.display = 'flex';
  appRoot.style.height = '100vh';
  appRoot.style.width = '100vw';
  appRoot.style.overflow = 'hidden';
  document.body.appendChild(appRoot);

  // --- Styles ---
  const style = document.createElement('style');
  style.textContent = `
    #tm-app-root {
      display: flex;
      flex-direction: row;
      height: 100vh;
      width: 100vw;
      background: #f7f7f7;
      overflow: hidden;
    }
    #tm-ui-sidebar {
      width: 320px;
      min-width: 220px;
      max-width: 340px;
      height: 100vh;
      background: #fff;
      border-right: 2px solid #004E36;
      border-radius: 0 12px 12px 0;
      box-shadow: 2px 0 16px rgba(0,0,0,0.07);
      font-family: 'Segoe UI', Arial, sans-serif;
      display: flex;
      flex-direction: column;
      z-index: 1;
      margin: 0;
      padding: 0;
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
      box-sizing: border-box;
    }
    #tm-ui-main-content {
      flex: 1 1 0%;
      display: flex;
      flex-direction: column;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.07);
      overflow: auto;
      min-width: 0;
      min-height: 0;
      height: 100vh;
      margin: 0;
      box-sizing: border-box;
    }
    #tm-file-preview {
      width: 420px;
      min-width: 260px;
      max-width: 520px;
      height: 100vh;
      background: #fff;
      border-left: 2px solid #004E36;
      border-radius: 12px 0 0 12px;
      box-shadow: -2px 0 16px rgba(0,0,0,0.07);
      font-family: 'Segoe UI', Arial, sans-serif;
      padding: 18px 20px 16px 20px;
      min-height: 120px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin: 0;
      box-sizing: border-box;
    }
  `;
  document.head.appendChild(style);

  // --- Main content area ---
  const mainContent = document.createElement('div');
  mainContent.id = 'tm-ui-main-content';
  mainContent.style.flex = '1 1 0%';
  mainContent.style.display = 'flex';
  mainContent.style.flexDirection = 'column';
  mainContent.style.background = '#fff';
  mainContent.style.margin = '24px 24px 24px 0';
  mainContent.style.borderRadius = '12px';
  mainContent.style.boxShadow = '0 4px 24px rgba(0,0,0,0.07)';
  mainContent.style.overflow = 'auto';

  // --- Sidebar (tool navigation) ---
  const sidebar = document.createElement('div');
  sidebar.id = 'tm-ui-sidebar';

  // Tabs
  const tabs = document.createElement('div');
  tabs.id = 'tm-ui-tabs';

  // Panels
  const panels = document.createElement('div');
  panels.id = 'tm-ui-panels';

  // Append panels to mainContent
  mainContent.appendChild(panels);

  sidebar.appendChild(tabs);
// Add File Upload button above reset
const uploadLabel = document.createElement('label');
uploadLabel.textContent = 'Upload Excel File';
uploadLabel.style.fontWeight = 'bold';
uploadLabel.style.margin = '18px 20px 6px 20px';
uploadLabel.style.display = 'block';

const uploadInput = document.createElement('input');
uploadInput.type = 'file';
uploadInput.accept = '.xlsx,.xls,.csv';
uploadInput.style.margin = '0 20px 10px 20px';
uploadInput.style.width = 'calc(100% - 40px)';
uploadInput.setAttribute('aria-label', 'Upload Excel file');

uploadInput.addEventListener('change', function() {
  const file = uploadInput.files[0];
  if (!file) return;
  const statusMsg = document.createElement('div');
  statusMsg.style.margin = '0 20px 10px 20px';
  statusMsg.style.color = '#004E36';
  statusMsg.textContent = 'Reading file...';
  sidebar.insertBefore(statusMsg, resetBtn);

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      let data = e.target.result;
      let wb;
      if (file.name.endsWith('.csv')) {
        wb = XLSX.read(data, { type: 'string' });
      } else {
        wb = XLSX.read(data, { type: 'array' });
      }
      if (window.TM_FileState) {
        window.TM_FileState.setWorkbook(wb, wb.SheetNames[0]);
      }
      if (window.TM_RefreshPreview) window.TM_RefreshPreview();
      statusMsg.textContent = 'File loaded: ' + file.name;
      setTimeout(() => statusMsg.remove(), 2000);
    } catch (err) {
      statusMsg.textContent = 'Error reading file: ' + err.message;
      setTimeout(() => statusMsg.remove(), 4000);
    }
  };
  if (file.name.endsWith('.csv')) {
    reader.readAsText(file);
  } else {
    reader.readAsArrayBuffer(file);
  }
});

sidebar.appendChild(uploadLabel);
sidebar.appendChild(uploadInput);
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
  try { localStorage.removeItem('tm_excel_file_state_v2'); } catch (e) {}
  if (window.TM_RefreshPreview) window.TM_RefreshPreview();
  alert('File state cleared.');
}
  };
  sidebar.appendChild(resetBtn);

  mainContent.style.overflow = 'auto';

  // --- Persistent Preview Area (right) ---
  const previewPanel = document.createElement('div');
  previewPanel.id = 'tm-file-preview';
  previewPanel.style.width = '420px';
  previewPanel.style.background = '#fff';
  previewPanel.style.border = '2px solid #004E36';
  previewPanel.style.borderRadius = '10px';
  previewPanel.style.boxShadow = '0 4px 24px rgba(0,0,0,0.13)';
  previewPanel.style.fontFamily = "'Segoe UI', Arial, sans-serif";
  previewPanel.style.padding = '18px 20px 16px 20px';
  previewPanel.style.margin = '24px 24px 24px 0';
  previewPanel.style.minHeight = '120px';
  previewPanel.style.maxHeight = 'calc(100vh - 48px)';
  previewPanel.style.overflowY = 'auto';
  previewPanel.style.display = 'flex';
  previewPanel.style.flexDirection = 'column';
  previewPanel.style.gap = '8px';

  // Layout: sidebar | mainContent | previewPanel
  appRoot.appendChild(sidebar);
  appRoot.appendChild(mainContent);
  appRoot.appendChild(previewPanel);

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
  // Persisted file state key
  const FILESTATE_KEY = 'tm_excel_file_state_v2';

  // Holds the current workbook and sheet data
  let fileState = {
    workbook: null, // XLSX workbook object
    workbookB64: null, // base64 string for persistence
    sheetName: null, // string
    sheetData: null  // array of row objects
  };
  const listeners = [];

  // Restore from localStorage if available
  (function restoreState() {
    try {
      const saved = localStorage.getItem(FILESTATE_KEY);
      if (saved) {
        const obj = JSON.parse(saved);
        if (obj && obj.workbookB64 && obj.sheetName) {
          // Reconstruct workbook from base64
          const data = Uint8Array.from(atob(obj.workbookB64), c => c.charCodeAt(0));
          const wb = XLSX.read(data, { type: 'array' });
          fileState.workbook = wb;
          fileState.workbookB64 = obj.workbookB64;
          fileState.sheetName = obj.sheetName;
          fileState.sheetData = wb && obj.sheetName
            ? XLSX.utils.sheet_to_json(wb.Sheets[obj.sheetName], { defval: '' })
            : null;
        }
      }
    } catch (e) {
      // Ignore errors
    }
  })();

  window.TM_FileState = {
    getState({ previewRows = null } = {}) {
      // If previewRows is set, only parse that many rows for sheetData
      if (
        fileState.workbook &&
        fileState.sheetName &&
        typeof previewRows === 'number' &&
        previewRows > 0
      ) {
        const ws = fileState.workbook.Sheets[fileState.sheetName];
        const allRows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        return {
          ...fileState,
          sheetData: allRows.slice(0, previewRows)
        };
      }
      return { ...fileState };
    },
    setWorkbook(wb, sheetName) {
      fileState.workbook = wb;
      fileState.sheetName = sheetName || (wb && wb.SheetNames[0]) || null;
      fileState.sheetData = wb && fileState.sheetName
        ? XLSX.utils.sheet_to_json(wb.Sheets[fileState.sheetName], { defval: '' })
        : null;
      // Persist workbook as base64 if present
      if (wb) {
        try {
          const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
          const b64 = btoa(wbout.split('').map(c => String.fromCharCode(c.charCodeAt(0) & 0xff)).join(''));
          fileState.workbookB64 = b64;
          localStorage.setItem(FILESTATE_KEY, JSON.stringify({
            workbookB64: b64,
            sheetName: fileState.sheetName
          }));
        } catch (e) {
          // Fallback: clear persisted state
          localStorage.removeItem(FILESTATE_KEY);
        }
      } else {
        fileState.workbookB64 = null;
        localStorage.removeItem(FILESTATE_KEY);
      }
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
      // Persist sheet name if workbook is present
      if (fileState.workbookB64) {
        try {
          localStorage.setItem(FILESTATE_KEY, JSON.stringify({
            workbookB64: fileState.workbookB64,
            sheetName: fileState.sheetName
          }));
        } catch (e) {}
      }
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
    // Use the preview panel created in the app layout
    const preview = document.getElementById('tm-file-preview');
    if (!preview) return; // Should always exist in the new layout

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
// Debug: log every time preview is refreshed
      function debugPreviewUpdate(reason) {
        console.log('[TM Preview] Refreshed preview:', reason, new Date().toISOString());
      }
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
    function renderTable() {
      tableDiv.innerHTML = '';
      // Use lazy preview: only parse first 30 rows for preview
      const previewRows = 30;
      const previewState = window.TM_FileState.getState({ previewRows });
      if (!previewState.workbook || !previewState.sheetData || !previewState.sheetName) {
        statusDiv.textContent = 'No file loaded.';
        return;
      }
      statusDiv.textContent = `Previewing: "${previewState.sheetName}" (showing up to ${previewRows} rows)`;
      if (previewState.sheetData.length === 0) {
        tableDiv.innerHTML = '<div style="color:#888;">Sheet is empty.</div>';
        return;
      }
      // Large file warning
      const ws = previewState.workbook.Sheets[previewState.sheetName];
      const allRowsCount = XLSX.utils.sheet_to_json(ws, { defval: '' }).length;
      if (allRowsCount > 1000) {
// Periodic refresh every 10 seconds
      setInterval(() => {
        debugPreviewUpdate('interval');
        renderTable();
      }, 10000);

      // Expose manual refresh for tools
      window.TM_RefreshPreview = function() {
        debugPreviewUpdate('manual');
        renderTable();
      };
        const warn = document.createElement('div');
        warn.style.color = '#b85c00';
        warn.style.fontWeight = 'bold';
        warn.style.marginBottom = '8px';
// Periodic refresh every 10 seconds
      setInterval(() => {
        renderTable();
      }, 10000);

      // Expose manual refresh for tools
      window.TM_RefreshPreview = renderTable;
        warn.textContent = `Warning: This sheet has ${allRowsCount} rows. Preview and operations may be slow.`;
        tableDiv.appendChild(warn);
      }
      const table = document.createElement('table');
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      Object.keys(previewState.sheetData[0]).forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      previewState.sheetData.forEach(row => {
        const tr = document.createElement('tr');
        Object.keys(previewState.sheetData[0]).forEach(col => {
          const td = document.createElement('td');
          td.textContent = row[col];
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      tableDiv.appendChild(table);

      if (allRowsCount > previewRows) {
        const more = document.createElement('div');
        more.style.color = '#888';
        more.style.fontSize = '12px';
        more.textContent = `...showing first ${previewRows} of ${allRowsCount} rows.`;
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
      unsub = function() { renderTable(); };
      window.TM_FileState.subscribe(unsub);
      renderTable();
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