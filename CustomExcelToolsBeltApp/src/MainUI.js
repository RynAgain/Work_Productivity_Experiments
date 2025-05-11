// MainUI.js - Electron renderer entry for Excel Tools Belt

// Polyfill for Tampermonkey's window.location.pathname check (always true in Electron)
function isEditorPage() {
  return true; // Always show the app in Electron
}

// Polyfill for localStorage (can be replaced with Electron Store or fs for persistence)
const storage = window.localStorage;

// Load dependencies (XLSX, JSZip are loaded via <script> in index.html)
/* XLSX and JSZip are loaded globally via <script> tags in public/index.html */

// --- Main UI System (adapted from MainScript.js) ---
(function() {
  'use strict';

  if (!isEditorPage()) return;

  // Set browser tab title
  document.title = "CatCat Tools (Electron)";

  // DEBUG: Show a visible message to confirm MainUI.js is running
  document.body.innerHTML = '<div style="color:#b85c00;font-size:22px;font-weight:bold;padding:40px;">MainUI.js loaded. If you see this, the main UI script is running.</div>';

  // Remove all existing content and set up a new root
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

  // Feature List (vertical, scalable)
  const featureList = document.createElement('div');
  featureList.id = 'tm-ui-feature-list';
  featureList.style.display = 'flex';
  featureList.style.flexDirection = 'column';
  featureList.style.overflowY = 'auto';
  featureList.style.maxHeight = 'calc(100vh - 180px)';
  featureList.style.margin = '0 0 10px 0';
  featureList.style.padding = '0';
  featureList.style.gap = '2px';

  // Panels
  const panels = document.createElement('div');
  panels.id = 'tm-ui-panels';

  // Append panels to mainContent
  mainContent.appendChild(panels);

  sidebar.appendChild(featureList);

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

  function renderFeatureList() {
    featureList.innerHTML = '';
    panelRegistry.forEach((panel, idx) => {
      const btn = document.createElement('button');
      btn.className = 'tm-ui-feature-btn' + (panel.id === activePanelId ? ' active' : '');
      btn.textContent = panel.title;
      btn.style.display = 'block';
      btn.style.width = '100%';
      btn.style.textAlign = 'left';
      btn.style.padding = '10px 18px';
      btn.style.background = panel.id === activePanelId ? '#e6f2ef' : 'none';
      btn.style.border = 'none';
      btn.style.borderRadius = '6px';
      btn.style.fontWeight = '500';
      btn.style.color = '#004E36';
      btn.style.cursor = 'pointer';
      btn.style.transition = 'background 0.2s';
      btn.style.margin = '0';
      btn.style.outline = 'none';
      btn.onmouseenter = () => { if (panel.id !== activePanelId) btn.style.background = '#f7f7f7'; };
      btn.onmouseleave = () => { btn.style.background = panel.id === activePanelId ? '#e6f2ef' : 'none'; };
      btn.onclick = () => setActivePanel(panel.id);
      featureList.appendChild(btn);
    });
  }

  function renderPanels() {
    panels.innerHTML = '';
    const panel = panelRegistry.find(p => p.id === activePanelId);
    if (panel && typeof panel.render === 'function') {
      const panelContent = panel.render();
      if (panelContent instanceof HTMLElement) {
        panels.appendChild(panelContent);
      } else if (typeof panelContent === 'string') {
        panels.innerHTML = panelContent;
      }
    }
  }

  function setActivePanel(id) {
    activePanelId = id;
    renderFeatureList();
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
      renderFeatureList();
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

  // Signal that TM_UI is ready for panel registration
  window.dispatchEvent(new Event('TM_UI_READY'));

  // Dynamically load all panel modules (ExcelEditFun, previewFile, SplitBy, SplitToUploadFiles, dailyBuyReport)
  // In Electron, we can use require or import, but for now, load via <script> tags or require if needed.
  // Example (if using require):
  // require('./ExcelEditFun.js');
  // require('./previewFile.js');
  // require('./SplitBy.js');
  // require('./SplitToUploadFiles.js');
  // require('./dailyBuyReport.js');
  // If using <script> tags, ensure they are included in index.html or dynamically inject here.

  // TODO: Port and load all panel modules here.

})();