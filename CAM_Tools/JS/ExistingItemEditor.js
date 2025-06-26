(() => {
  'use strict';

  /* -------------------------------------------------- *
   *  ERROR HELPERS & GLOBALS
   * -------------------------------------------------- */
  window.showInlineError = window.showInlineError || function(context, message) {
    let errorDiv = context.querySelector('#ei-error-message');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.id = 'ei-error-message';
      errorDiv.style.cssText = 'margin-top:10px;padding:10px;background:#fee;border:1px solid #fcc;border-radius:5px;color:#c33;font-size:14px;';
      context.appendChild(errorDiv);
    }
    errorDiv.innerHTML = message;
    errorDiv.style.display = 'block';
  };

  window.clearInlineError = window.clearInlineError || function(context) {
    const errorDiv = context.querySelector('#ei-error-message');
    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
  };

  window.confirmWarning = window.confirmWarning || function(message) {
    return confirm('⚠️ Warning:\n\n' + message + '\n\nDo you want to continue anyway?');
  };

  /* -------------------------------------------------- *
   *  CONSTANTS & HELPERS
   * -------------------------------------------------- */
  const STYLE_ID               = 'ei-style';
  const TABLE_CONTAINER        = 'ei-table';
  const DOWNLOAD_BTN_ID        = 'ei-downloadCsv';
  const EDIT_BTN_ID            = 'ei-openEditor';
  const OVERLAY_ID             = 'ei-overlay';

  const OPEN_ICON_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
         fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
      <path d="M15.502 1.94a.5.5 0 0 1 0 .706l-1 1a.5.5 0 0 1-.708
               0l-1-1a.5.5 0 0 1 0-.708l1-1a.5.5 0 0 1 .708 0l1 1zm-1.75
               2.456-1-1L4 11.146V12h.854l8.898-8.898z"/>
      <path fill-rule="evenodd"
            d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0
               1.5-1.5v-7a.5.5 0 0 0-1 0v7a.5.5 0 0 1-.5.5h-11a.5.5
               0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0
               0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
    </svg> Edit Existing Item`;

  const HEADERS = [
    'Store - 3 Letter Code', 'Item Name', 'Item PLU/UPC',
    'Availability', 'Current Inventory', 'Sales Floor Capacity',
    'Andon Cord', 'Tracking Start Date', 'Tracking End Date'
  ];

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const createEl = (tag, attrs = {}, html = '') => {
    const el = document.createElement(tag);
    Object.assign(el, attrs);
    if (html) el.innerHTML = html;
    return el;
  };
  const removeEl = id => { const el = $('#' + id); if (el) el.remove(); };
  const debounce = (fn, ms = 150) => {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  };

  /* -------------------------------------------------- *
   *  ENHANCED DATA MODEL
   * -------------------------------------------------- */
  class TableDataModel {
    constructor(initialData = []) {
      this.data = [HEADERS, ...initialData];
      this.originalData = this.getData();
    }
    
    getData() {
      return this.data.map(row => [...row]);
    }
    
    setData(newData) {
      this.data = newData.map(row => [...row]);
    }
    
    getCell(row, col) {
      return this.data[row] && this.data[row][col] ? this.data[row][col] : '';
    }
    
    setCell(row, col, value) {
      if (!this.data[row]) this.data[row] = [];
      this.data[row][col] = String(value);
    }
    
    deleteRows(rowIndices) {
      // Sort in descending order to avoid index shifting issues
      rowIndices.sort((a, b) => b - a);
      rowIndices.forEach(index => {
        if (index > 0) { // Don't delete header
          this.data.splice(index, 1);
        }
      });
    }
    
    toCSV() {
      return this.data.map(row => 
        row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
      ).join('\n');
    }
  }

  /* -------------------------------------------------- *
   *  UNDO/REDO SYSTEM
   * -------------------------------------------------- */
  class UndoRedoManager {
    constructor(dataModel) {
      this.dataModel = dataModel;
      this.history = [];
      this.currentIndex = -1;
      this.maxHistory = 50;
      this.saveInitialState();
    }
    
    saveInitialState() {
      this.saveState('Initial state');
    }
    
    saveState(description) {
      // Remove any future history if we're not at the end
      this.history = this.history.slice(0, this.currentIndex + 1);
      
      // Add new state
      this.history.push({
        data: JSON.parse(JSON.stringify(this.dataModel.getData())),
        description,
        timestamp: Date.now()
      });
      
      // Trim history if too long
      if (this.history.length > this.maxHistory) {
        this.history.shift();
      } else {
        this.currentIndex++;
      }
      
      this.updateUndoRedoButtons();
    }
    
    undo() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        const state = this.history[this.currentIndex];
        this.dataModel.setData(state.data);
        this.updateUndoRedoButtons();
        return state.description;
      }
      return null;
    }
    
    redo() {
      if (this.currentIndex < this.history.length - 1) {
        this.currentIndex++;
        const state = this.history[this.currentIndex];
        this.dataModel.setData(state.data);
        this.updateUndoRedoButtons();
        return state.description;
      }
      return null;
    }
    
    canUndo() {
      return this.currentIndex > 0;
    }
    
    canRedo() {
      return this.currentIndex < this.history.length - 1;
    }
    
    updateUndoRedoButtons() {
      const undoBtn = $('#ei-undo-btn');
      const redoBtn = $('#ei-redo-btn');
      
      if (undoBtn) {
        undoBtn.disabled = !this.canUndo();
        undoBtn.title = this.canUndo() ? `Undo: ${this.history[this.currentIndex - 1]?.description}` : 'Nothing to undo';
      }
      
      if (redoBtn) {
        redoBtn.disabled = !this.canRedo();
        redoBtn.title = this.canRedo() ? `Redo: ${this.history[this.currentIndex + 1]?.description}` : 'Nothing to redo';
      }
    }
  }

  /* -------------------------------------------------- *
   *  AUTO-SAVE SYSTEM
   * -------------------------------------------------- */
  class AutoSaveManager {
    constructor(dataModel, interval = 30000) {
      this.dataModel = dataModel;
      this.interval = interval;
      this.saveKey = 'ei-autosave-' + this.generateSessionId();
      this.saveInterval = null;
      this.lastSaveTime = null;
      
      this.startAutoSave();
      this.checkForRecovery();
    }
    
    generateSessionId() {
      return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    
    startAutoSave() {
      this.saveInterval = setInterval(() => {
        this.autoSave();
      }, this.interval);
    }
    
    autoSave() {
      try {
        const saveData = {
          data: this.dataModel.getData(),
          timestamp: Date.now(),
          sessionId: this.saveKey
        };
        
        localStorage.setItem(this.saveKey, JSON.stringify(saveData));
        this.lastSaveTime = Date.now();
        
        // Update auto-save indicator
        this.updateAutoSaveIndicator('saved');
        
        // Clean up old auto-saves (keep only last 5)
        this.cleanupOldSaves();
        
      } catch (e) {
        console.warn('Auto-save failed:', e);
        this.updateAutoSaveIndicator('error');
      }
    }
    
    updateAutoSaveIndicator(status) {
      const indicator = $('#ei-autosave-indicator');
      if (indicator) {
        const now = new Date().toLocaleTimeString();
        switch (status) {
          case 'saved':
            indicator.textContent = `✓ Auto-saved at ${now}`;
            indicator.style.color = '#2ecc71';
            break;
          case 'error':
            indicator.textContent = `⚠ Auto-save failed at ${now}`;
            indicator.style.color = '#e74c3c';
            break;
          case 'saving':
            indicator.textContent = '💾 Saving...';
            indicator.style.color = '#3498db';
            break;
        }
      }
    }
    
    checkForRecovery() {
      const allSaves = this.getAllAutoSaves();
      if (allSaves.length > 0) {
        const latest = allSaves[0];
        const age = Date.now() - latest.timestamp;
        
        if (age < 3600000) { // Less than 1 hour old
          const timeStr = new Date(latest.timestamp).toLocaleString();
          if (confirm(`Found auto-saved data from ${timeStr}. Restore it?`)) {
            this.dataModel.setData(latest.data);
            return true;
          }
        }
      }
      return false;
    }
    
    getAllAutoSaves() {
      const saves = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('ei-autosave-')) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            saves.push({ key, ...data });
          } catch (e) {
            // Invalid save, ignore
          }
        }
      }
      return saves.sort((a, b) => b.timestamp - a.timestamp);
    }
    
    clearAutoSave() {
      if (this.saveInterval) {
        clearInterval(this.saveInterval);
      }
      localStorage.removeItem(this.saveKey);
      this.updateAutoSaveIndicator('cleared');
    }
    
    clearAllAutoSaves() {
      const saves = this.getAllAutoSaves();
      saves.forEach(save => localStorage.removeItem(save.key));
      this.updateAutoSaveIndicator('cleared');
    }
    
    cleanupOldSaves() {
      const saves = this.getAllAutoSaves();
      if (saves.length > 5) {
        saves.slice(5).forEach(save => localStorage.removeItem(save.key));
      }
    }
    
    manualSave() {
      this.updateAutoSaveIndicator('saving');
      this.autoSave();
    }
    
    destroy() {
      if (this.saveInterval) {
        clearInterval(this.saveInterval);
      }
    }
  }

  /* -------------------------------------------------- *
   *  ENHANCED VALIDATION
   * -------------------------------------------------- */
  class ValidationManager {
    constructor() {
      this.rules = {
        store: {
          required: true,
          pattern: /^[A-Z]{3}$/,
          message: 'Store code must be 3 uppercase letters'
        },
        plu: {
          required: true,
          pattern: /^[0-9A-Za-z\-]{3,}$/,
          message: 'PLU must be at least 3 characters (alphanumeric and hyphens)'
        },
        inventory: {
          min: 0,
          max: 10000,
          message: 'Inventory must be between 0 and 10000'
        }
      };
    }
    
    validateCell(row, col, value, dataModel) {
      const errors = [];
      const columnMap = { 0: 'store', 2: 'plu', 4: 'inventory' };
      const rule = this.rules[columnMap[col]];
      
      if (rule) {
        if (rule.required && !value.trim()) {
          errors.push(`${columnMap[col]} is required`);
        }
        if (rule.pattern && value.trim() && !rule.pattern.test(value)) {
          errors.push(rule.message);
        }
        if (rule.min !== undefined && parseInt(value) < rule.min) {
          errors.push(rule.message);
        }
        if (rule.max !== undefined && parseInt(value) > rule.max) {
          errors.push(rule.message);
        }
      }
      
      return errors;
    }
    
    validateData(dataModel) {
      const errors = [];
      const data = dataModel.getData();
      const seenPairs = new Set();
      
      for (let r = 1; r < data.length; r++) {
        const store = dataModel.getCell(r, 0);
        const plu = dataModel.getCell(r, 2);
        const availability = dataModel.getCell(r, 3);
        const inventory = dataModel.getCell(r, 4);
        const andon = dataModel.getCell(r, 6);
        
        if (!store && !plu) continue; // Skip completely empty rows
        
        // Check for duplicate store/PLU pairs
        if (store && plu) {
          const pairKey = `${store.toUpperCase()}::${plu.toUpperCase()}`;
          if (seenPairs.has(pairKey)) {
            errors.push({ row: r, col: 0, msg: `Duplicate Store/PLU: ${store}/${plu}` });
          } else {
            seenPairs.add(pairKey);
          }
        }
        
        // Individual field validation
        const storeErrors = this.validateCell(r, 0, store, dataModel);
        const pluErrors = this.validateCell(r, 2, plu, dataModel);
        const invErrors = this.validateCell(r, 4, inventory, dataModel);
        
        storeErrors.forEach(msg => errors.push({ row: r, col: 0, msg }));
        pluErrors.forEach(msg => errors.push({ row: r, col: 2, msg }));
        invErrors.forEach(msg => errors.push({ row: r, col: 4, msg }));
        
        // Business logic validation
        if (availability !== 'Limited' && availability !== 'Unlimited') {
          errors.push({ row: r, col: 3, msg: 'Availability must be Limited or Unlimited' });
        }
        
        if (andon !== 'Enabled' && andon !== 'Disabled') {
          errors.push({ row: r, col: 6, msg: 'Andon must be Enabled or Disabled' });
        }
        
        if (availability === 'Unlimited' && inventory !== '0') {
          errors.push({ row: r, col: 4, msg: 'Unlimited items must have 0 inventory' });
        }
      }
      
      return errors;
    }
  }

  /* -------------------------------------------------- *
   *  STYLES
   * -------------------------------------------------- */
  const injectStyles = () => {
    if (!$('#' + STYLE_ID)) {
      const style = createEl('style', { id: STYLE_ID });
      style.textContent = `
        /* MAIN CONTAINER PADDING */
        #ei-interface {
          padding: 0 25px;
          max-width: calc(100vw - 50px);
          box-sizing: border-box;
          margin: 0 auto;
          position: relative;
          width: 100%;
        }
        
        .ei-btn{
          position:fixed;bottom:calc(50px + env(safe-area-inset-bottom));
          left:25px;z-index:1000;min-width:180px;
          padding:9px 14px;border:none;border-radius:6px;
          font:600 15px/1 'Segoe UI',sans-serif;color:#fff;
          background:#004E36;cursor:pointer;
          display:flex;align-items:center;gap:6px;
          transition:background .2s;
        }
        .ei-btn:hover{background:#056a48;}
        
        .ei-overlay{
          position:fixed;inset:0;background:rgba(0,0,0,.5);
          display:flex;justify-content:center;align-items:center;z-index:1001;
          padding: 25px;
          box-sizing: border-box;
        }
        
        .ei-card{
          background:#fff;border-radius:12px;
          width:min(calc(96vw - 50px),1350px);max-height:calc(90vh - 50px);
          display:flex;flex-direction:column;
          box-shadow:0 8px 32px rgba(0,0,0,.18);overflow:hidden;
          margin: 0 auto;
        }
        
        .ei-header{
          background:#004E36;color:#fff;padding:16px 24px;
          font:600 20px/1 'Segoe UI',sans-serif;
          display:flex;justify-content:space-between;align-items:center;
          flex-shrink: 0;
        }
        .ei-header button{all:unset;cursor:pointer;font-size:26px;}
        
        .ei-body{
          padding:20px 24px;overflow:auto;
          flex: 1;
          min-width: 0; /* Prevent flex overflow */
        }
        
        label{font-weight:500;margin-top:6px;display:block;}
        input,select{
          width:100%;padding:7px 9px;margin-top:2px;
          font-size:15px;border:1px solid #ccc;border-radius:5px;
          box-sizing: border-box;
        }
        textarea {
          width:100%;padding:7px 9px;margin-top:2px;
          font-size:15px;border:1px solid #ccc;border-radius:5px;
          box-sizing: border-box;
          resize: vertical;
        }
        
        .ei-action{
          margin-top:12px;padding:10px 0;width:100%;
          border:none;border-radius:5px;font-size:16px;cursor:pointer;
          box-sizing: border-box;
        }
        .green{background:#004E36;color:#fff;}
        .red{background:#e74c3c;color:#fff;}
        .blue{background:#3498db;color:#fff;}
        .orange{background:#f39c12;color:#fff;}
        
        /* ENHANCED TABLE STYLES */
        .ei-table-container{
          width:100%;margin-top:16px;border:1px solid #ddd;border-radius:8px;
          overflow:auto;max-height:600px;background:#fff;position:relative;
          box-sizing: border-box;
        }
        .ei-table{
          width:100%;border-collapse:collapse;font-size:14px;min-width:1200px;
        }
        .ei-table th{
          background:#004E36;color:#fff;padding:12px 8px;text-align:left;
          position:sticky;top:0;z-index:10;border-right:1px solid #056a48;
          font-weight:600;font-size:13px;white-space:nowrap;
        }
        .ei-table td{
          padding:4px;border-right:1px solid #eee;border-bottom:1px solid #eee;
          min-width:120px;position:relative;
        }
        .ei-table tr:hover{background:#f8f9fa;}
        .ei-table tr.ei-error{background:#fee;}
        .ei-table td.ei-error{background:#fee;border:2px solid #e74c3c;}
        .ei-table tr.ei-selected{background:#e3f2fd;}
        
        /* SELECTION COLUMN */
        .ei-table th:first-child, .ei-table td:first-child{
          width:40px;min-width:40px;text-align:center;
          background:#f8f9fa;position:sticky;left:0;z-index:5;
        }
        .ei-table th:first-child{z-index:15;background:#003d2b;}
        
        /* EDITABLE CELL STYLES */
        .ei-cell-input, .ei-cell-select{
          width:100%;border:none;background:transparent;padding:6px 4px;
          font-family:inherit;font-size:inherit;outline:none;
          transition:all 0.2s;
          box-sizing: border-box;
        }
        .ei-cell-input:focus, .ei-cell-select:focus{
          background:#fff;border:2px solid #004E36;border-radius:3px;
          box-shadow:0 0 0 2px rgba(0,78,54,0.1);
        }
        .ei-cell-input:invalid{
          border-color:#e74c3c;background:#fee;
        }
        
        /* TOOLBAR STYLES */
        .ei-toolbar{
          display:flex;align-items:center;gap:8px;margin-bottom:16px;
          padding:12px;background:#f8f9fa;border-radius:6px;flex-wrap:wrap;
          box-sizing: border-box;
          width: 100%;
        }
        .ei-toolbar-group{
          display:flex;align-items:center;gap:6px;
          border-right:1px solid #ddd;padding-right:12px;margin-right:4px;
          flex-shrink: 0;
        }
        .ei-toolbar-group:last-child{border-right:none;margin-right:0;}
        .ei-toolbar button{
          padding:6px 12px;border:1px solid #ddd;background:#fff;
          border-radius:4px;cursor:pointer;font-size:13px;
          transition:all 0.2s;
          white-space: nowrap;
        }
        .ei-toolbar button:hover:not(:disabled){background:#f0f0f0;}
        .ei-toolbar button:disabled{opacity:0.5;cursor:not-allowed;}
        .ei-toolbar input, .ei-toolbar select{
          padding:6px 8px;border:1px solid #ddd;border-radius:4px;
          font-size:13px;min-width:120px;
          box-sizing: border-box;
        }
        
        /* FILTER BAR */
        .ei-filter-bar{
          display:flex;align-items:center;gap:8px;margin-bottom:12px;
          padding:10px;background:#fff;border:1px solid #ddd;border-radius:6px;
          flex-wrap:wrap;
          box-sizing: border-box;
          width: 100%;
        }
        .ei-filter-bar input, .ei-filter-bar select{
          padding:6px 8px;border:1px solid #ccc;border-radius:4px;font-size:13px;
          box-sizing: border-box;
        }
        .ei-filter-bar button{
          padding:6px 12px;border:1px solid #ddd;background:#f8f9fa;
          border-radius:4px;cursor:pointer;font-size:13px;
          white-space: nowrap;
        }
        
        /* BULK OPERATIONS */
        .ei-bulk-ops{
          display:flex;align-items:center;gap:8px;margin-top:12px;
          padding:10px;background:#e8f5e8;border:1px solid #c8e6c9;
          border-radius:6px;flex-wrap:wrap;
          box-sizing: border-box;
          width: 100%;
        }
        .ei-bulk-ops button{
          padding:6px 12px;border:none;border-radius:4px;
          cursor:pointer;font-size:13px;color:#fff;
          white-space: nowrap;
        }
        .ei-bulk-ops .bulk-limited{background:#2ecc71;}
        .ei-bulk-ops .bulk-unlimited{background:#95a5a6;}
        .ei-bulk-ops .bulk-delete{background:#e74c3c;}
        .ei-bulk-ops .bulk-andon-enabled{background:#27ae60;}
        .ei-bulk-ops .bulk-andon-disabled{background:#e67e22;}
        .ei-bulk-ops .bulk-inventory{background:#3498db;}
        .ei-bulk-ops input{
          box-sizing: border-box;
        }
        
        /* AUTO-SAVE INDICATOR */
        .ei-autosave-indicator{
          font-size:12px;color:#666;font-style:italic;
          display:flex;align-items:center;gap:4px;
        }
        
        /* MULTI-INPUT STYLES */
        .ei-multi-input{
          display:flex;flex-direction:column;gap:4px;
        }
        .ei-input-tag{
          display:inline-block;background:#e3f2fd;color:#1976d2;
          padding:2px 6px;border-radius:3px;font-size:12px;margin:2px;
        }
        .ei-input-tag .remove{
          margin-left:4px;cursor:pointer;color:#d32f2f;font-weight:bold;
        }
        
        #ei-increment-wrap, #ei-error-message{
          margin-top:12px;
        }
        #ei-error-message{
          padding:10px;background:#fee;border:1px solid #fcc;
          border-radius:5px;color:#c33;font-size:14px;
          box-sizing: border-box;
          word-wrap: break-word;
        }
        
        /* PROGRESS BAR STYLES */
        #ei-progress {
          box-sizing: border-box;
        }
        .progress-bar {
          box-sizing: border-box;
        }
        .progress-fill {
          box-sizing: border-box;
        }
        
        /* CLOSE BUTTON */
        .ei-close-btn {
          position: fixed;
          top: 25px;
          right: 25px;
          z-index: 1002;
          background: #e74c3c;
          color: white;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          font-size: 20px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          transition: background 0.2s;
        }
        .ei-close-btn:hover {
          background: #c0392b;
        }
        
        @media(max-width:768px){
          #ei-interface {
            padding: 0 10px;
            max-width: calc(100vw - 20px);
          }
          
          .ei-btn{
            left:10px;right:10px;width:calc(100% - 20px);
            min-width: auto;
          }
          
          .ei-overlay {
            padding: 10px;
          }
          
          .ei-card {
            width: calc(100vw - 20px);
            max-height: calc(90vh - 20px);
          }
          
          .ei-close-btn {
            top: 10px;
            right: 10px;
          }
          
          .ei-toolbar, .ei-filter-bar, .ei-bulk-ops{
            flex-direction:column;align-items:stretch;
          }
          .ei-toolbar-group{
            border-right:none;border-bottom:1px solid #ddd;
            padding-bottom:8px;margin-bottom:8px;
            justify-content: center;
          }
          .ei-table{font-size:12px;min-width:800px;}
          .ei-table th, .ei-table td{padding:4px 2px;min-width:80px;}
          
          .ei-toolbar button, .ei-filter-bar button, .ei-bulk-ops button {
            flex: 1;
            min-width: 0;
          }
        }`;
      document.head.appendChild(style);
    }
  };

  /* -------------------------------------------------- *
   *  EDIT BUTTON
   * -------------------------------------------------- */
  const addEditBtn = () => {
    if ($('#' + EDIT_BTN_ID)) return;
    injectStyles();

    const btn = createEl('button', {
      id: EDIT_BTN_ID,
      className: 'ei-btn',
      innerHTML: OPEN_ICON_SVG
    });
    document.body.appendChild(btn);
    btn.onclick = openOverlay;
  };

  /* -------------------------------------------------- *
   *  ENHANCED OVERLAY WITH MULTI-INPUT
   * -------------------------------------------------- */
  const openOverlay = () => {
    //var pw = prompt('Enter password to access Existing Item Editor:');
    //if (pw !== 'Baker') {
    //  alert('Incorrect password. Access denied.');
    //  return;
    //}  //Removed password prompt, it is no longer needed
    if ($('#' + OVERLAY_ID)) return;

    const overlay = createEl('div', { id: OVERLAY_ID, className: 'ei-overlay' });
    const card = createEl('div', { className: 'ei-card' });
    overlay.appendChild(card);

    const header = createEl('div', { className: 'ei-header' }, 'Edit Existing Item');
    const closeX = createEl('button', {}, '&times;');
    closeX.onclick = () => overlay.remove();
    header.appendChild(closeX);
    card.appendChild(header);

    const body = createEl('div', { className: 'ei-body' });
    card.appendChild(body);

    body.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
        <div>
          <label>PLU Code(s)</label>
          <textarea id="ei-plu" placeholder="Enter PLU codes (one per line or comma-separated)"
                   style="height:80px;resize:vertical;"></textarea>
          <small style="color:#666;">Supports multiple PLUs: separate by comma or new line</small>
          <label style="font-weight:500;display:flex;align-items:center;gap:8px;margin-top:8px;">
            <input type="checkbox" id="ei-all-plus" style="margin-right:8px;"> All PLUs
          </label>
        </div>
        <div>
          <label>Store / Region Code(s)</label>
          <textarea id="ei-store" placeholder="Enter Store or Region codes (one per line or comma-separated)"
                   style="height:80px;resize:vertical;"></textarea>
          <small style="color:#666;">Supports multiple stores/regions</small>
          <label style="font-weight:500;display:flex;align-items:center;gap:8px;margin-top:8px;">
            <input type="checkbox" id="ei-all-stores" style="margin-right:8px;"> All Stores/Regions
          </label>
        </div>
      </div>
      
      <label style="margin-top:12px;">Search By:</label>
      <select id="ei-by" style="margin-bottom:8px;">
        <option value="Store">Store</option>
        <option value="Region">Region</option>
      </select>

      <label style="margin-top:8px;">Team Filter (optional):</label>
      <select id="ei-team-filter" style="margin-bottom:8px;">
        <option value="">All Teams</option>
        <option value="Coffee">Coffee</option>
        <option value="Prepared">Prepared</option>
        <option value="Foods">Foods</option>
        <option value="Bakery">Bakery</option>
        <option value="Seafood">Seafood</option>
        <option value="Specialty">Specialty</option>
        <option value="Grocery">Grocery</option>
        <option value="Sushi">Sushi</option>
      </select>

      <button id="ei-fetch" class="ei-action green">Edit Items</button>
      <div id="ei-progress" style="display:none;margin-top:8px;text-align:center;font-size:15px;color:#004E36;">
        <div class="progress-text">Waiting…</div>
        <div class="progress-bar" style="width:100%;height:4px;background:#eee;border-radius:2px;margin-top:4px;">
          <div class="progress-fill" style="width:0%;height:100%;background:#004E36;border-radius:2px;transition:width 0.3s;"></div>
        </div>
      </div>`;
    
    $('#ei-fetch', body).onclick = () => fetchItems(body);

    overlay.onclick = (e) => {
      if (e.target === overlay) overlay.remove();
    };

    document.body.appendChild(overlay);
    $('#ei-plu').focus();
  };

  /* -------------------------------------------------- *
   *  ENHANCED DATA FETCHING WITH MULTI-SUPPORT
   * -------------------------------------------------- */
  const fetchItems = async (context) => {
    const progress = $('#ei-progress', context);
    const progressText = progress.querySelector('.progress-text');
    const progressFill = progress.querySelector('.progress-fill');
    
    progress.style.display = 'block';
    progressText.textContent = 'Processing…';
    progressFill.style.width = '0%';

    // Parse multiple inputs
    const pluInput = $('#ei-plu').value.trim();
    const storeInput = $('#ei-store').value.trim();
    const by = $('#ei-by').value;
    
    if (!pluInput || !storeInput) {
      progressText.textContent = 'Both PLU and Store/Region fields are required.';
      return;
    }
    
    // Parse PLUs (support both comma and newline separation)
    const pluList = [...new Set(
      pluInput.split(/[,\n]/)
        .map(p => p.trim())
        .filter(p => p && /^[0-9A-Za-z\-]+$/.test(p))
    )];
    
    // Parse Stores/Regions
    const inputList = [...new Set(
      storeInput.split(/[,\n]/)
        .map(s => s.trim().toUpperCase())
        .filter(Boolean)
    )];
    
    if (!pluList.length) {
      progressText.textContent = 'No valid PLU codes found.';
      return;
    }
    
    if (!inputList.length) {
      progressText.textContent = 'No valid store/region codes found.';
      return;
    }
    
    if (allPlusChecked && allStoresChecked) {
      progressText.textContent = 'Loading all PLUs from all stores...';
    } else if (allPlusChecked) {
      progressText.textContent = `Loading all PLUs from ${inputList.length} ${by.toLowerCase()}(s)`;
    } else if (allStoresChecked) {
      progressText.textContent = `Loading ${pluList.length} PLUs from all stores`;
    } else {
      progressText.textContent = `Found ${pluList.length} PLUs and ${inputList.length} ${by.toLowerCase()}(s)`;
    }
    progressFill.style.width = '10%';

    const env = location.hostname.includes('gamma') ? 'gamma' : 'prod';
    const url = `https://${env}.cam.wfm.amazon.dev/api/`;

    try {
      let allStoreIds = [];
      
      if (allStoresChecked) {
        // Get all stores from all regions
        progressText.textContent = 'Loading all stores...';
        progressFill.style.width = '20%';
        allStoreIds = await getAllStores(url);
      } else if (by === 'Store') {
        allStoreIds = inputList;
        progressFill.style.width = '20%';
      } else {
        // Handle multiple regions
        progressText.textContent = 'Loading stores for regions…';
        for (let i = 0; i < inputList.length; i++) {
          const regionCode = inputList[i];
          progressText.textContent = `Loading stores for region ${regionCode} (${i + 1}/${inputList.length})`;
          progressFill.style.width = `${20 + (i / inputList.length) * 30}%`;
          
          const regionStores = await getRegionStores(url, regionCode);
          allStoreIds.push(...regionStores);
        }
        allStoreIds = [...new Set(allStoreIds)]; // Remove duplicates
      }
      
      if (!allStoreIds.length) {
        progressText.textContent = 'No stores found for the specified regions.';
        return;
      }
      
      progressText.textContent = `Fetching items from ${allStoreIds.length} stores…`;
      progressFill.style.width = '50%';
      
      // Fetch items from all stores
      const allItems = [];
      const batchSize = 5; // Process stores in batches to avoid overwhelming the API
      
      for (let i = 0; i < allStoreIds.length; i += batchSize) {
        const batch = allStoreIds.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(allStoreIds.length / batchSize);
        
        progressText.textContent = `Fetching batch ${batchNum}/${totalBatches} (stores ${i + 1}-${Math.min(i + batchSize, allStoreIds.length)})`;
        progressFill.style.width = `${50 + (i / allStoreIds.length) * 40}%`;
        
        // Process batch concurrently
        const batchPromises = batch.map(storeId => fetchStoreItems(url, storeId, pluList));
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, idx) => {
          if (result.status === 'fulfilled') {
            allItems.push(...result.value);
          } else {
            console.error(`Failed to fetch items for store ${batch[idx]}:`, result.reason);
          }
        });
      }
      
      progressFill.style.width = '90%';
      
      // Remove duplicates and filter
      const uniqueItems = removeDuplicateItems(allItems);
      const filteredItems = uniqueItems.filter(item => 
        pluList.some(plu => item.wfmScanCode === plu)
      );
      
      progressFill.style.width = '100%';
      
      if (!filteredItems.length) {
        progressText.textContent = 'No matching items found.';
        return;
      }
      
      progressText.textContent = `Found ${filteredItems.length} items. Loading editor…`;
      
      // Close overlay and render table
      setTimeout(() => {
        $('#' + OVERLAY_ID).remove();
        renderTable(document.body, filteredItems);
      }, 500);
      
    } catch (error) {
      progressText.textContent = 'Error loading data. Check console for details.';
      console.error('Fetch error:', error);
    }
  };

  // Helper function to fetch items from a single store
  const fetchStoreItems = async (url, storeId, pluList) => {
    const payload = {
      filterContext: { storeIds: [storeId] },
      paginationContext: { pageNumber: 0, pageSize: 10000 }
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-amz-json-1.0',
        'x-amz-target': 'WfmCamBackendService.GetItemsAvailability'
      },
      body: JSON.stringify(payload),
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const items = data.itemsAvailability || [];
    
    // Tag items with store info
    return items.map(item => ({
      ...item,
      _eiStoreKey: item.storeTLC || storeId
    }));
  };

  // Helper function to remove duplicate items
  const removeDuplicateItems = (items) => {
    const seen = new Map();
    const result = [];
    
    items.forEach(item => {
      const key = `${item._eiStoreKey}::${item.wfmScanCode}`;
      const existing = seen.get(key);
      
      if (!existing) {
        seen.set(key, item);
        result.push(item);
      } else {
        // Keep the one with higher inventory
        const currentInv = parseInt(item.currentInventoryQuantity) || 0;
        const existingInv = parseInt(existing.currentInventoryQuantity) || 0;
        
        if (currentInv > existingInv) {
          const index = result.indexOf(existing);
          result[index] = item;
          seen.set(key, item);
        }
      }
    });
    
    return result;
  };

  // Helper function to get stores for a region
  const getRegionStores = async (url, regionCode) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-amz-json-1.0',
        'x-amz-target': 'WfmCamBackendService.GetStoresInformation'
      },
      body: JSON.stringify({}),
      credentials: 'include'
    });
    
    const data = await response.json();
    const stores = [];
    
    for (const region in data.storesInformation) {
      if (region.split('-').pop() === regionCode) {
        for (const state in data.storesInformation[region]) {
          data.storesInformation[region][state].forEach(s => stores.push(s.storeTLC));
        }
      }
    }
    
    return stores;
  };

  /* -------------------------------------------------- *
   *  CLOSE BUTTON FUNCTION
   * -------------------------------------------------- */
  const addCloseButton = (container) => {
    const closeButton = createEl('button', {
      className: 'ei-close-btn',
      innerHTML: '&times;',
      title: 'Close Editor'
    });
    
    closeButton.onclick = () => {
      if (confirm('Close the editor? Any unsaved changes will be lost.')) {
        container.remove();
        closeButton.remove();
        // Clean up managers
        if (container._eiAutoSaveManager) {
          container._eiAutoSaveManager.destroy();
        }
      }
    };
    
    document.body.appendChild(closeButton);
    
    // Remove close button when container is removed
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          if (node === container) {
            closeButton.remove();
            observer.disconnect();
          }
        });
      });
    });
    observer.observe(document.body, { childList: true });
  };

  /* -------------------------------------------------- *
   *  ENHANCED TABLE RENDERING WITH ALL FEATURES
   * -------------------------------------------------- */
  const renderTable = (ctx, items) => {
    // Clear existing elements more thoroughly
    removeEl(TABLE_CONTAINER);
    removeEl(DOWNLOAD_BTN_ID);
    removeEl('ei-interface'); // Clear any existing interface
    
    // Remove any stray elements that might have escaped
    const strayElements = document.querySelectorAll('[id^="ei-"]:not(#ei-openEditor):not(#ei-style)');
    strayElements.forEach(el => el.remove());
    
    // Convert items to rows
    const dataRows = items.map(item => [
      item._eiStoreKey || item.storeTLC || '',
      item.itemName || '',
      item.wfmScanCode || '',
      item.inventoryStatus || '',
      (item.inventoryStatus === 'Unlimited' ? '0' : String(Math.max(0, Math.min(10000, +item.currentInventoryQuantity || 0)))),
      '',
      item.andon ? 'Enabled' : 'Disabled',
      '',
      ''
    ]);

    const dataModel = new TableDataModel(dataRows);
    const undoManager = new UndoRedoManager(dataModel);
    const autoSaveManager = new AutoSaveManager(dataModel);
    const validationManager = new ValidationManager();
    
    // Create a container for the entire interface with proper containment
    const interfaceContainer = createEl('div', { 
      id: 'ei-interface'
    });
    document.body.appendChild(interfaceContainer); // Append to body instead of ctx
    
    // Store references
    interfaceContainer._eiDataModel = dataModel;
    interfaceContainer._eiUndoManager = undoManager;
    interfaceContainer._eiAutoSaveManager = autoSaveManager;
    interfaceContainer._eiValidationManager = validationManager;

    // Add toolbar
    addToolbar(interfaceContainer, dataModel, undoManager, autoSaveManager);
    
    // Add filter bar
    addFilterBar(interfaceContainer);
    
    // Add table
    addTable(interfaceContainer, dataModel, undoManager, autoSaveManager, validationManager);
    
    // Add bulk operations
    addBulkOperations(interfaceContainer, dataModel, undoManager, autoSaveManager);
    
    // Add controls and download
    addControls(interfaceContainer, dataModel, undoManager, autoSaveManager, validationManager);
    
    // Set up keyboard shortcuts
    setupKeyboardShortcuts(dataModel, undoManager, autoSaveManager);
    
    // Add close button to interface
    addCloseButton(interfaceContainer);
  };

  const addToolbar = (container, dataModel, undoManager, autoSaveManager) => {
    const toolbar = createEl('div', { className: 'ei-toolbar' });
    
    toolbar.innerHTML = `
      <div class="ei-toolbar-group">
        <button id="ei-undo-btn" title="Undo">↶ Undo</button>
        <button id="ei-redo-btn" title="Redo">↷ Redo</button>
      </div>
      <div class="ei-toolbar-group">
        <button id="ei-save-btn" title="Manual Save">💾 Save</button>
        <button id="ei-clear-autosave-btn" title="Clear Auto-save">🗑 Clear Auto-save</button>
        <span class="ei-autosave-indicator" id="ei-autosave-indicator">Auto-save active</span>
      </div>
      <div class="ei-toolbar-group">
        <button id="ei-validate-btn" title="Validate Data">✓ Validate</button>
        <button id="ei-clear-errors-btn" title="Clear Error Highlighting">Clear Errors</button>
      </div>
      <div class="ei-toolbar-group">
        <span style="font-size:12px;color:#666;">Total Rows: <span id="ei-row-count">0</span></span>
      </div>
    `;
    
    container.appendChild(toolbar);
    
    // Connect toolbar events
    $('#ei-undo-btn').onclick = () => {
      const result = undoManager.undo();
      if (result) {
        updateTableFromModel();
        autoSaveManager.manualSave();
        showInlineError(container, `<div style="color:blue;">↶ Undid: ${result}</div>`);
      }
    };
    
    $('#ei-redo-btn').onclick = () => {
      const result = undoManager.redo();
      if (result) {
        updateTableFromModel();
        autoSaveManager.manualSave();
        showInlineError(container, `<div style="color:blue;">↷ Redid: ${result}</div>`);
      }
    };
    
    $('#ei-save-btn').onclick = () => {
      autoSaveManager.manualSave();
      showInlineError(container, '<div style="color:green;">💾 Manually saved</div>');
    };
    
    $('#ei-clear-autosave-btn').onclick = () => {
      if (confirm('Clear all auto-saved data? This cannot be undone.')) {
        autoSaveManager.clearAllAutoSaves();
        showInlineError(container, '<div style="color:orange;">🗑 Auto-save data cleared</div>');
      }
    };
    
    $('#ei-clear-errors-btn').onclick = () => {
      clearValidationErrors();
      clearInlineError(container);
    };
    
    // Update row count
    const updateRowCount = () => {
      $('#ei-row-count').textContent = dataModel.getData().length - 1; // Exclude header
    };
    updateRowCount();
    
    // Update toolbar periodically
    setInterval(() => {
      undoManager.updateUndoRedoButtons();
      updateRowCount();
    }, 1000);
  };

  const addFilterBar = (container) => {
    const filterBar = createEl('div', { className: 'ei-filter-bar' });
    
    filterBar.innerHTML = `
      <input type="text" id="ei-search" placeholder="Search store, item name, PLU..." style="flex:1;min-width:200px;">
      <select id="ei-filter-availability">
        <option value="">All Availability</option>
        <option value="Limited">Limited Only</option>
        <option value="Unlimited">Unlimited Only</option>
      </select>
      <select id="ei-filter-andon">
        <option value="">All Andon</option>
        <option value="Enabled">Enabled Only</option>
        <option value="Disabled">Disabled Only</option>
      </select>
      <input type="number" id="ei-filter-inventory-min" placeholder="Min Inv" style="width:80px;">
      <input type="number" id="ei-filter-inventory-max" placeholder="Max Inv" style="width:80px;">
      <button id="ei-clear-filters">Clear Filters</button>
      <span id="ei-filter-results" style="font-size:12px;color:#666;"></span>
    `;
    
    container.appendChild(filterBar);
    
    // Connect filter events
    const applyFilters = debounce(() => {
      const searchTerm = $('#ei-search').value.toLowerCase();
      const availFilter = $('#ei-filter-availability').value;
      const andonFilter = $('#ei-filter-andon').value;
      const minInv = parseInt($('#ei-filter-inventory-min').value) || 0;
      const maxInv = parseInt($('#ei-filter-inventory-max').value) || 10000;
      
      const table = $('#ei-data-table');
      const rows = table.querySelectorAll('tbody tr');
      let visibleCount = 0;
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('input, select');
        if (cells.length < 7) return;
        
        const store = cells[1].value.toLowerCase(); // Skip checkbox column
        const item = cells[2].value.toLowerCase();
        const plu = cells[3].value.toLowerCase();
        const availability = cells[4].value;
        const inventory = parseInt(cells[5].value) || 0;
        const andon = cells[7].value;
        
        const matchesSearch = !searchTerm || 
          store.includes(searchTerm) || 
          item.includes(searchTerm) || 
          plu.includes(searchTerm);
        
        const matchesAvail = !availFilter || availability === availFilter;
        const matchesAndon = !andonFilter || andon === andonFilter;
        const matchesInventory = inventory >= minInv && inventory <= maxInv;
        
        const isVisible = matchesSearch && matchesAvail && matchesAndon && matchesInventory;
        row.style.display = isVisible ? '' : 'none';
        
        if (isVisible) visibleCount++;
      });
      
      $('#ei-filter-results').textContent = `Showing ${visibleCount} of ${rows.length} rows`;
    }, 300);
    
    $('#ei-search').oninput = applyFilters;
    $('#ei-filter-availability').onchange = applyFilters;
    $('#ei-filter-andon').onchange = applyFilters;
    $('#ei-filter-team').onchange = applyFilters;
    $('#ei-filter-inventory-min').oninput = applyFilters;
    $('#ei-filter-inventory-max').oninput = applyFilters;
    
    $('#ei-clear-filters').onclick = () => {
      $('#ei-search').value = '';
      $('#ei-filter-availability').value = '';
      $('#ei-filter-andon').value = '';
      $('#ei-filter-team').value = '';
      $('#ei-filter-inventory-min').value = '';
      $('#ei-filter-inventory-max').value = '';
      applyFilters();
    };
    
    // Initial filter application
    setTimeout(applyFilters, 100);
  };

  const addTable = (container, dataModel, undoManager, autoSaveManager, validationManager, teamData = []) => {
    const tableContainer = createEl('div', { id: TABLE_CONTAINER, className: 'ei-table-container' });
    const table = createEl('table', { id: 'ei-data-table', className: 'ei-table' });
    
    // Create header with selection column
    const thead = createEl('thead');
    const headerRow = createEl('tr');
    
    // Selection header
    const selectHeader = createEl('th');
    selectHeader.innerHTML = '<input type="checkbox" id="ei-select-all" title="Select All">';
    headerRow.appendChild(selectHeader);
    
    // Data headers
    HEADERS.forEach(header => {
      const th = createEl('th', {}, header);
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create body
    const tbody = createEl('tbody');
    
    const renderTableRows = () => {
      tbody.innerHTML = '';
      
      dataModel.getData().slice(1).forEach((row, rowIndex) => {
        const actualRowIndex = rowIndex + 1;
        const tr = createEl('tr');
        tr.dataset.row = actualRowIndex;
        tr.dataset.team = teamData[rowIndex] || '';
        
        // Selection checkbox
        const selectTd = createEl('td');
        selectTd.innerHTML = `<input type="checkbox" class="ei-row-select" data-row="${actualRowIndex}">`;
        tr.appendChild(selectTd);
        
        // Data cells
        row.forEach((cell, colIndex) => {
          const td = createEl('td');
          td.dataset.row = actualRowIndex;
          td.dataset.col = colIndex;
          
          let input;
          if (colIndex === 3) { // Availability
            input = createEl('select', { className: 'ei-cell-select' });
            input.innerHTML = '<option value="Limited">Limited</option><option value="Unlimited">Unlimited</option>';
            input.value = cell || 'Limited';
          } else if (colIndex === 6) { // Andon Cord
            input = createEl('select', { className: 'ei-cell-select' });
            input.innerHTML = '<option value="Enabled">Enabled</option><option value="Disabled">Disabled</option>';
            input.value = cell || 'Disabled';
          } else if (colIndex === 4) { // Inventory
            input = createEl('input', { 
              className: 'ei-cell-input', 
              type: 'number', 
              min: '0', 
              max: '10000',
              value: cell || '0'
            });
          } else {
            input = createEl('input', { 
              className: 'ei-cell-input', 
              type: 'text',
              value: cell || ''
            });
          }

          // Add change listener with validation
          input.addEventListener('change', (e) => {
            const newValue = e.target.value;
            const oldValue = dataModel.getCell(actualRowIndex, colIndex);
            
            if (newValue !== oldValue) {
              undoManager.saveState(`Changed ${HEADERS[colIndex]} in row ${actualRowIndex}`);
              dataModel.setCell(actualRowIndex, colIndex, newValue);
              autoSaveManager.manualSave();
              
              // Apply business rule: Unlimited -> 0 inventory
              if (colIndex === 3 && newValue === 'Unlimited') {
                const invInput = tr.querySelector('[data-col="4"] input, [data-col="4"] select');
                if (invInput && invInput.value !== '0') {
                  invInput.value = '0';
                  dataModel.setCell(actualRowIndex, 4, '0');
                }
              }
              
              // Real-time validation
              const cellErrors = validationManager.validateCell(actualRowIndex, colIndex, newValue, dataModel);
              if (cellErrors.length > 0) {
                td.classList.add('ei-error');
                td.title = cellErrors.join(', ');
              } else {
                td.classList.remove('ei-error');
                td.title = '';
              }
            }
          });

          // Add focus/blur effects
          input.addEventListener('focus', () => {
            td.classList.add('ei-focused');
          });
          
          input.addEventListener('blur', () => {
            td.classList.remove('ei-focused');
          });

          td.appendChild(input);
          tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
      });
    };
    
    window.updateTableFromModel = renderTableRows; // Make it global for undo/redo
    renderTableRows();
    
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    container.appendChild(tableContainer);
    
    // Connect select all checkbox
    $('#ei-select-all').onchange = (e) => {
      const checkboxes = document.querySelectorAll('.ei-row-select');
      checkboxes.forEach(cb => {
        cb.checked = e.target.checked;
        updateRowSelection(cb);
      });
    };
    
    // Connect individual row selections
    tbody.addEventListener('change', (e) => {
      if (e.target.classList.contains('ei-row-select')) {
        updateRowSelection(e.target);
        
        // Update select all checkbox
        const allCheckboxes = document.querySelectorAll('.ei-row-select');
        const checkedCheckboxes = document.querySelectorAll('.ei-row-select:checked');
        $('#ei-select-all').checked = allCheckboxes.length === checkedCheckboxes.length;
        $('#ei-select-all').indeterminate = checkedCheckboxes.length > 0 && checkedCheckboxes.length < allCheckboxes.length;
      }
    });
  };

  const updateRowSelection = (checkbox) => {
    const row = checkbox.closest('tr');
    if (checkbox.checked) {
      row.classList.add('ei-selected');
    } else {
      row.classList.remove('ei-selected');
    }
  };

  const addBulkOperations = (container, dataModel, undoManager, autoSaveManager) => {
    const bulkOps = createEl('div', { className: 'ei-bulk-ops', style: 'display:none;' });
    
    bulkOps.innerHTML = `
      <strong>Bulk Operations:</strong>
      <button class="bulk-limited">Set to Limited</button>
      <button class="bulk-unlimited">Set to Unlimited</button>
      <input type="number" id="ei-bulk-inventory" placeholder="Inventory" style="width:100px;" min="0" max="10000">
      <button class="bulk-inventory">Set Inventory</button>
      <button class="bulk-andon-enabled">Enable Andon</button>
      <button class="bulk-andon-disabled">Disable Andon</button>
      <button class="bulk-delete">Delete Selected</button>
      <span id="ei-selected-count" style="margin-left:10px;font-size:12px;color:#666;"></span>
    `;
    container.appendChild(bulkOps);
    
    // Show/hide bulk operations based on selection
    const updateBulkOpsVisibility = () => {
      const selected = document.querySelectorAll('.ei-row-select:checked');
      bulkOps.style.display = selected.length > 0 ? 'flex' : 'none';
      $('#ei-selected-count').textContent = `${selected.length} rows selected`;
    };
    
    // Listen for selection changes
    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('ei-row-select') || e.target.id === 'ei-select-all') {
        updateBulkOpsVisibility();
      }
    });
    
    // Bulk operations handlers
    bulkOps.querySelector('.bulk-limited').onclick = () => {
      const selected = getSelectedRows();
      if (selected.length && confirm(`Set ${selected.length} rows to Limited availability?`)) {
        undoManager.saveState(`Bulk set ${selected.length} rows to Limited`);
        selected.forEach(rowIndex => {
          dataModel.setCell(rowIndex, 3, 'Limited');
        });
        updateTableFromModel();
        autoSaveManager.manualSave();
        showInlineError(container, `<div style="color:green;">✓ Set ${selected.length} rows to Limited</div>`);
      }
    };
    
    bulkOps.querySelector('.bulk-unlimited').onclick = () => {
      const selected = getSelectedRows();
      if (selected.length && confirm(`Set ${selected.length} rows to Unlimited availability? This will also set inventory to 0.`)) {
        undoManager.saveState(`Bulk set ${selected.length} rows to Unlimited`);
        selected.forEach(rowIndex => {
          dataModel.setCell(rowIndex, 3, 'Unlimited');
          dataModel.setCell(rowIndex, 4, '0');
        });
        updateTableFromModel();
        autoSaveManager.manualSave();
        showInlineError(container, `<div style="color:green;">✓ Set ${selected.length} rows to Unlimited</div>`);
      }
    };
    
    bulkOps.querySelector('.bulk-inventory').onclick = () => {
      const selected = getSelectedRows();
      const inventory = $('#ei-bulk-inventory').value;
      
      if (!inventory || isNaN(inventory) || inventory < 0 || inventory > 10000) {
        showInlineError(container, 'Please enter a valid inventory value (0-10000)');
        return;
      }
      
      if (selected.length && confirm(`Set inventory to ${inventory} for ${selected.length} rows?`)) {
        undoManager.saveState(`Bulk set inventory to ${inventory} for ${selected.length} rows`);
        selected.forEach(rowIndex => {
          dataModel.setCell(rowIndex, 4, inventory);
        });
        updateTableFromModel();
        autoSaveManager.manualSave();
        showInlineError(container, `<div style="color:green;">✓ Set inventory to ${inventory} for ${selected.length} rows</div>`);
      }
    };
    
    bulkOps.querySelector('.bulk-andon-enabled').onclick = () => {
      const selected = getSelectedRows();
      if (selected.length && confirm(`Enable Andon Cord for ${selected.length} rows?`)) {
        undoManager.saveState(`Bulk enable Andon for ${selected.length} rows`);
        selected.forEach(rowIndex => {
          dataModel.setCell(rowIndex, 6, 'Enabled');
        });
        updateTableFromModel();
        autoSaveManager.manualSave();
        showInlineError(container, `<div style="color:green;">✓ Enabled Andon Cord for ${selected.length} rows</div>`);
      }
    };

    bulkOps.querySelector('.bulk-andon-disabled').onclick = () => {
      const selected = getSelectedRows();
      if (selected.length && confirm(`Disable Andon Cord for ${selected.length} rows?`)) {
        undoManager.saveState(`Bulk disable Andon for ${selected.length} rows`);
        selected.forEach(rowIndex => {
          dataModel.setCell(rowIndex, 6, 'Disabled');
        });
        updateTableFromModel();
        autoSaveManager.manualSave();
        showInlineError(container, `<div style="color:orange;">✓ Disabled Andon Cord for ${selected.length} rows</div>`);
      }
    };
    bulkOps.querySelector('.bulk-delete').onclick = () => {
      const selected = getSelectedRows();
      if (selected.length && confirm(`Delete ${selected.length} selected rows? This cannot be undone via undo.`)) {
        undoManager.saveState(`Bulk delete ${selected.length} rows`);
        dataModel.deleteRows(selected);
        updateTableFromModel();
        autoSaveManager.manualSave();
        bulkOps.style.display = 'none';
        showInlineError(container, `<div style="color:red;">🗑 Deleted ${selected.length} rows</div>`);
      }
    };
  };

  const getSelectedRows = () => {
    const selected = [];
    document.querySelectorAll('.ei-row-select:checked').forEach(checkbox => {
      selected.push(parseInt(checkbox.dataset.row));
    });
    return selected;
  };

  const addControls = (container, dataModel, undoManager, autoSaveManager, validationManager) => {
    const controlsHtml = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px;width:100%;box-sizing:border-box;">
        <div id="ei-increment-wrap">
          <label style="font-weight:500;">Increment Inventory:</label>
          <div style="display:flex;align-items:center;gap:8px;margin-top:4px;flex-wrap:wrap;">
            <input id="ei-increment-input" type="number" value="1" min="-999" max="999" 
                   style="width:80px;padding:6px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;">
            <button id="ei-increment-btn" class="ei-action blue" 
                    style="padding:6px 18px;font-size:14px;margin-top:0;white-space:nowrap;">Apply</button>
            <span style="color:#666;font-size:12px;flex-shrink:0;">(Limited items only)</span>
          </div>
        </div>
        
        <div>
          <label style="font-weight:500;">Quick Actions:</label>
          <div style="display:flex;gap:8px;margin-top:4px;flex-wrap:wrap;">
            <button id="ei-validate-all-btn" class="ei-action green" 
                    style="padding:6px 12px;font-size:14px;margin-top:0;flex:1;min-width:100px;">Validate All</button>
            <button id="ei-download-btn" class="ei-action blue" 
                    style="padding:6px 12px;font-size:14px;margin-top:0;flex:1;min-width:100px;">Download CSV</button>
          </div>
        </div>
      </div>
    `;
    
    container.insertAdjacentHTML('beforeend', controlsHtml);
    
    // Connect increment
    $('#ei-increment-btn').onclick = () => {
      const incVal = parseInt($('#ei-increment-input').value, 10);
      if (isNaN(incVal)) {
        showInlineError(container, 'Please enter a valid number');
        return;
      }
      
      undoManager.saveState(`Increment inventory by ${incVal}`);
      const updatedCount = incrementInventory(dataModel, incVal);
      updateTableFromModel();
      autoSaveManager.manualSave();
      showInlineError(container, `<div style="color:green;">✓ Incremented ${updatedCount} Limited items by ${incVal}</div>`);
    };
    
    // Connect validation
    $('#ei-validate-all-btn').onclick = () => {
      updateModelFromTable(dataModel);
      const errors = validationManager.validateData(dataModel);
      highlightErrors(errors);
      
      if (errors.length) {
        showInlineError(container, `Validation found ${errors.length} issues:<br>` + 
          errors.slice(0, 5).map(e => `<div>• Row ${e.row}: ${e.msg}</div>`).join('') +
          (errors.length > 5 ? `<div>• ... and ${errors.length - 5} more</div>` : ''));
      } else {
        showInlineError(container, '<div style="color:green;">✓ All validation checks passed!</div>');
      }
    };
    
    // Connect download
    $('#ei-download-btn').onclick = () => {
      updateModelFromTable(dataModel);
      const errors = validationManager.validateData(dataModel);
      
      if (errors.length && !confirmWarning(`Found ${errors.length} validation warnings. Download anyway?`)) {
        return;
      }

      const csv = dataModel.toCSV();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const a = createEl('a', {
        href: URL.createObjectURL(blob),
        download: `ExistingItemEdit_${new Date().toISOString().slice(0,10)}.csv`
      });
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      
      showInlineError(container, '<div style="color:green;">✓ CSV downloaded successfully!</div>');
    };
  };

  /* -------------------------------------------------- *
   *  UTILITY FUNCTIONS
   * -------------------------------------------------- */
  const updateModelFromTable = (dataModel) => {
    const inputs = document.querySelectorAll('#ei-data-table input, #ei-data-table select');
    inputs.forEach(input => {
      const cell = input.closest('td');
      if (cell && cell.dataset.row && cell.dataset.col) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        dataModel.setCell(row, col, input.value);
      }
    });
  };

  const incrementInventory = (dataModel, increment) => {
    const data = dataModel.getData();
    let updatedCount = 0;
    
    for (let r = 1; r < data.length; r++) {
      const availability = dataModel.getCell(r, 3);
      if (availability === 'Limited') {
        const current = parseInt(dataModel.getCell(r, 4), 10) || 0;
        const newValue = Math.max(0, Math.min(10000, current + increment));
        dataModel.setCell(r, 4, newValue);
        updatedCount++;
      }
    }
    
    return updatedCount;
  };

  const highlightErrors = (errors) => {
    clearValidationErrors();
    errors.forEach(error => {
      const cell = document.querySelector(`td[data-row="${error.row}"][data-col="${error.col}"]`);
      if (cell) {
        cell.classList.add('ei-error');
        cell.title = error.msg;
      }
    });
  };

  const clearValidationErrors = () => {
    document.querySelectorAll('.ei-error').forEach(el => {
      el.classList.remove('ei-error');
      el.title = '';
    });
  };

  const setupKeyboardShortcuts = (dataModel, undoManager, autoSaveManager) => {
    document.addEventListener('keydown', (e) => {
      // Only apply shortcuts when not in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              undoManager.redo();
            } else {
              undoManager.undo();
            }
            updateTableFromModel();
            autoSaveManager.manualSave();
            break;
          case 's':
            e.preventDefault();
            autoSaveManager.manualSave();
            break;
        }
      }
    });
  };

  /* -------------------------------------------------- *
   *  ENTRY POINT
   * -------------------------------------------------- */
  (function() {
    const observer = new MutationObserver(() => {
      if (!$('#' + EDIT_BTN_ID)) addEditBtn();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    addEditBtn();
  })();

})();