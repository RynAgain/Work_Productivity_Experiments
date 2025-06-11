(() => {
  'use strict';

  /* -------------------------------------------------- *
   *  ERROR HELPERS & GLOBALS
   * -------------------------------------------------- */
  // Enhanced error display functions
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
  const SPREADSHEET_CSS        = 'https://unpkg.com/x-data-spreadsheet@1.1.5/dist/xspreadsheet.css';
  const SPREADSHEET_JS         = 'https://unpkg.com/x-data-spreadsheet@1.1.5/dist/xspreadsheet.js';

  // Spinner HTML for loading/progress (GLOBAL SCOPE)
  const SPINNER_HTML = `<span class="ei-spinner" style="display:inline-block;width:22px;height:22px;vertical-align:middle;">
    <svg viewBox="0 0 50 50" style="width:22px;height:22px;">
      <circle cx="25" cy="25" r="20" fill="none" stroke="#004E36" stroke-width="5" stroke-linecap="round" stroke-dasharray="31.4 31.4" transform="rotate(-90 25 25)">
        <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.8s" repeatCount="indefinite"/>
      </circle>
    </svg>
  </span>`;

  const SPREADSHEET_CONTAINER  = 'ei-sheet';
  const DOWNLOAD_BTN_ID        = 'ei-downloadCsv';
  const EDIT_BTN_ID            = 'ei-openEditor';
  const OVERLAY_ID             = 'ei-overlay';
  const INFOBOX_ID             = 'ei-infobox';

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
   *  DATA MODEL - FIXED TO PREVENT INFINITE LOOPS
   * -------------------------------------------------- */
  class SpreadsheetDataModel {
    constructor(initialData = []) {
      this.data = [HEADERS, ...initialData];
      this.listeners = [];
      this.isUpdating = false; // Prevent circular updates
    }
    
    // Get data as 2D array
    getData() {
      return this.data.map(row => [...row]); // Return deep copy
    }
    
    // Set data and notify listeners (with loop prevention)
    setData(newData, silent = false) {
      if (this.isUpdating) return; // Prevent recursive calls
      this.data = newData.map(row => [...row]); // Store deep copy
      if (!silent) {
        this.notifyListeners();
      }
    }
    
    // Get specific cell value
    getCell(row, col) {
      if (row >= 0 && row < this.data.length && col >= 0 && col < this.data[row].length) {
        return this.data[row][col];
      }
      return '';
    }
    
    // Set specific cell value (with loop prevention)
    setCell(row, col, value, silent = false) {
      if (this.isUpdating) return; // Prevent recursive calls
      
      if (row >= 0 && row < this.data.length) {
        while (this.data[row].length <= col) {
          this.data[row].push('');
        }
        this.data[row][col] = String(value);
        if (!silent) {
          this.notifyListeners();
        }
      }
    }
    
    // Batch update multiple cells without triggering listeners for each
    batchUpdate(updates, callback) {
      this.isUpdating = true;
      try {
        if (callback) {
          callback(this);
        }
        if (updates) {
          updates.forEach(update => {
            const { row, col, value } = update;
            this.setCell(row, col, value, true);
          });
        }
      } finally {
        this.isUpdating = false;
        this.notifyListeners();
      }
    }
    
    // Get row count
    getRowCount() {
      return this.data.length;
    }
    
    // Get column count
    getColCount() {
      return Math.max(...this.data.map(row => row.length));
    }
    
    // Add change listener
    addListener(callback) {
      this.listeners.push(callback);
    }
    
    // Notify all listeners of changes (with loop prevention)
    notifyListeners() {
      if (this.isUpdating) return; // Don't notify during updates
      
      this.listeners.forEach(callback => {
        try {
          callback(this.data);
        } catch (error) {
          console.error('Error in data model listener:', error);
        }
      });
    }
    
    // Convert to x-spreadsheet format
    toSpreadsheetFormat() {
      const result = {
        name: 'ExistingItems',
        rows: {}
      };
      
      this.data.forEach((row, rowIndex) => {
        result.rows[rowIndex] = {
          cells: {}
        };
        row.forEach((cell, colIndex) => {
          result.rows[rowIndex].cells[colIndex] = {
            text: String(cell || '')
          };
        });
      });
      
      return result;
    }
    
    // Convert to CSV
    toCSV() {
      return this.data.map(row => 
        row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
      ).join('\n');
    }
  }

  /* -------------------------------------------------- *
   *  LIBRARY LOADING
   * -------------------------------------------------- */
  const loadSpreadsheetLib = () => {
    return new Promise((resolve, reject) => {
      if (window.x_spreadsheet) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = SPREADSHEET_JS;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load spreadsheet library'));
      document.head.appendChild(script);
    });
  };

  /* -------------------------------------------------- *
   *  ONE‑TIME STYLE & LIBRARY INJECTION
   * -------------------------------------------------- */
  const injectOnce = () => {
    if (!$('#' + STYLE_ID)) {
      const style = createEl('style', { id: STYLE_ID });
      style.textContent = `
        /* button */
        .ei-btn{
          position:fixed;bottom:calc(50px + env(safe-area-inset-bottom));
          left:12px;z-index:1000;min-width:180px;
          padding:9px 14px;border:none;border-radius:6px;
          font:600 15px/1 'Segoe UI',sans-serif;color:#fff;
          background:#004E36;cursor:pointer;
          display:flex;align-items:center;gap:6px;
          transition:background .2s;
        }
        .ei-btn:hover{background:#056a48;}
        /* overlay */
        .ei-overlay{
          position:fixed;inset:0;background:rgba(0,0,0,.5);
          display:flex;justify-content:center;align-items:center;
          z-index:1001;
        }
        .ei-card{
          background:#fff;border-radius:12px;
          width:min(96vw,980px);max-height:90vh;display:flex;flex-direction:column;
          box-shadow:0 8px 32px rgba(0,0,0,.18),0 2px 6px rgba(0,78,54,.18);
          overflow:hidden;
        }
        .ei-header{
          background:#004E36;color:#fff;padding:16px 24px;
          font:600 20px/1 'Segoe UI',sans-serif;
          display:flex;justify-content:space-between;align-items:center;
        }
        .ei-header button{all:unset;cursor:pointer;font-size:26px;}
        .ei-body{padding:20px 24px;overflow:auto;}
        label{font-weight:500;margin-top:6px;display:block;}
        input,select{
          width:100%;padding:7px 9px;margin-top:2px;
          font-size:15px;border:1px solid #ccc;border-radius:5px;
        }
        .ei-action{
          margin-top:12px;padding:10px 0;width:100%;
          border:none;border-radius:5px;font-size:16px;cursor:pointer;
        }
        .green{background:#004E36;color:#fff;}
        .red{background:#e74c3c;color:#fff;}
        #${SPREADSHEET_CONTAINER}{
          width:100%;min-height:420px;margin-top:16px;
          border:1.5px solid #e0e0e0;border-radius:8px;overflow:auto;
        }
        #ei-increment-wrap{
          margin-top:12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;
        }
        #ei-error-message{
          margin-top:10px;padding:10px;background:#fee;border:1px solid #fcc;
          border-radius:5px;color:#c33;font-size:14px;
        }
        .ei-error-cell{
          background-color: #e74c3c !important;
          color: #fff !important;
        }
        @media(max-width:400px){
          .ei-btn{left:4px;right:4px;width:calc(100% - 8px);}
          #ei-increment-wrap{flex-direction:column;align-items:flex-start;}
        }`;
      document.head.appendChild(style);
    }

    if (!$(`link[href*="xspreadsheet.css"]`)) {
      const css = createEl('link', { rel: 'stylesheet', href: SPREADSHEET_CSS });
      document.head.appendChild(css);
    }
  };

  /* -------------------------------------------------- *
   *  CLEANUP FUNCTION
   * -------------------------------------------------- */
  const cleanup = () => {
    // Remove event listeners
    const resizeHandler = window.eiResizeHandler;
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
      window.eiResizeHandler = null;
    }
  };

  /* -------------------------------------------------- *
   *  EDIT‑BUTTON
   * -------------------------------------------------- */
  const addEditBtn = () => {
    if ($('#' + EDIT_BTN_ID)) return;
    injectOnce();

    const btn = createEl('button', {
      id: EDIT_BTN_ID,
      className: 'ei-btn',
      innerHTML: OPEN_ICON_SVG
    });
    document.body.appendChild(btn);
    btn.onclick = openOverlay;
  };

  /* -------------------------------------------------- *
   *  OVERLAY + FORM
   * -------------------------------------------------- */
  const openOverlay = () => {
    // Password protection
    var pw = prompt('Enter password to access Existing Item Editor:');
    if (pw !== 'Leeloo') {
      alert('Incorrect password. Access denied.');
      return;
    }
    if ($('#' + OVERLAY_ID)) return;

    const overlay = createEl('div', { id: OVERLAY_ID, className: 'ei-overlay' });
    const card = createEl('div', { className: 'ei-card' });
    overlay.appendChild(card);

    const header = createEl('div', { className: 'ei-header' }, 'Edit Existing Item');
    const closeX = createEl('button', {}, '&times;');
    closeX.onclick = () => {
      cleanup();
      overlay.remove();
    };
    header.appendChild(closeX);
    card.appendChild(header);

    const body = createEl('div', { className: 'ei-body' });
    card.appendChild(body);

    body.innerHTML = `
      <label>PLU Code</label>
      <input type="text" id="ei-plu" placeholder="Enter PLU code (comma-separated for multiple)">

      <label>By:</label>
      <select id="ei-by" style="margin-bottom:8px;">
        <option value="Store">Store</option>
        <option value="Region">Region</option>
      </select>

      <label>Store / Region Code</label>
      <input type="text" id="ei-store" placeholder="Enter Store or Region code">

      <button id="ei-fetch" class="ei-action green">Edit Item</button>
      <div id="ei-progress"
           style="display:none;margin-top:8px;text-align:center;font-size:15px;color:#004E36;">Waiting…</div>`;
    
    $('#ei-fetch', body).onclick = () => fetchItem(body);

    // Close overlay when clicking outside
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        cleanup();
        overlay.remove();
      }
    };

    document.body.appendChild(overlay);
    $('#ei-plu').focus();
  };

  /* -------------------------------------------------- *
   *  DATA FETCHING - SAME AS BEFORE
   * -------------------------------------------------- */
  const fetchItem = async (context) => {
    const progress = $('#ei-progress', context);
    progress.style.display = 'block';
    progress.style.color = '#004E36';
    progress.textContent = 'Processing…';

    const pluInput = $('#ei-plu').value.trim();
    const sr = $('#ei-store').value.trim().toUpperCase();
    const by = $('#ei-by').value;
    
    // Enhanced validation
    if (!pluInput) {
      progress.textContent = 'PLU code is required.';
      progress.style.color = '#e74c3c';
      return;
    }
    
    if (!sr) {
      progress.textContent = 'Store/Region code is required.';
      progress.style.color = '#e74c3c';
      return;
    }
    
    // Validate and clean PLU codes
    const pluList = [...new Set(pluInput.split(',').map(p => p.trim()).filter(p => {
      return p && /^[0-9A-Za-z\-]+$/.test(p); // Allow alphanumeric and hyphens
    }))];
    
    if (!pluList.length) {
      progress.textContent = 'No valid PLU codes found. PLU codes should be alphanumeric.';
      progress.style.color = '#e74c3c';
      return;
    }

    const env = location.hostname.includes('gamma') ? 'gamma' : 'prod';
    const url = `https://${env}.cam.wfm.amazon.dev/api/`;

    let storeIds = [];
    if (by === 'Store') {
      storeIds = [sr];
    } else {
      progress.textContent = 'Loading stores…';
      try {
        const resStores = await fetch(url, {
          method: 'POST',
          headers: {
            'content-type': 'application/x-amz-json-1.0',
            'x-amz-target': 'WfmCamBackendService.GetStoresInformation'
          },
          body: JSON.stringify({}),
          credentials: 'include'
        });
        
        if (!resStores.ok) {
          throw new Error(`HTTP ${resStores.status}: ${resStores.statusText}`);
        }
        
        const storeData = await resStores.json();
        if (!storeData?.storesInformation) {
          progress.textContent = 'Failed to load store list.';
          progress.style.color = '#e74c3c';
          return;
        }
        
        for (const region in storeData.storesInformation) {
          const regionCode = region.split('-').pop();
          if (regionCode === sr) {
            const states = storeData.storesInformation[region];
            for (const state in states) {
              states[state].forEach(s => storeIds.push(s.storeTLC));
            }
          }
        }
        
        if (!storeIds.length) {
          progress.textContent = `No stores found for region: ${sr}`;
          progress.style.color = '#e74c3c';
          return;
        }
      } catch (err) {
        console.error('Error loading stores:', err);
        progress.textContent = 'Error loading store list. Please check your connection.';
        progress.style.color = '#e74c3c';
        return;
      }
    }

    let allItems = [];
    let missingPairs = [];

    if (by === 'Region') {
      progress.textContent = 'Fetching items for each store…';
      for (let i = 0; i < storeIds.length; i++) {
        const thisStoreId = storeIds[i];
        progress.textContent = `Fetching items for store ${thisStoreId} (${i + 1}/${storeIds.length})…`;
        
        const payload = {
          filterContext: { storeIds: [thisStoreId] },
          paginationContext: { pageNumber: 0, pageSize: 10000 }
        };
        
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'content-type': 'application/x-amz-json-1.0',
              'x-amz-target': 'WfmCamBackendService.GetItemsAvailability'
            },
            body: JSON.stringify(payload),
            credentials: 'include'
          });
          
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          
          const data = await res.json();
          const items = data?.itemsAvailability || [];
          items.forEach(item => item._eiStoreKey = item.storeTLC || thisStoreId);
          allItems.push(...items);
          
          pluList.forEach(plu => {
            if (!items.some(it => it.wfmScanCode === plu))
              missingPairs.push(`${plu} (${thisStoreId})`);
          });
        } catch (err) {
          console.error(`Error fetching items for store ${thisStoreId}:`, err);
          pluList.forEach(plu => missingPairs.push(`${plu} (${thisStoreId})`));
        }
      }
      
      allItems = allItems.filter(item => pluList.includes(item.wfmScanCode));

      // Keep best inventory for each store/PLU combination
      const best = {};
      allItems.forEach(item => {
        const key = `${item._eiStoreKey}::${item.wfmScanCode}`;
        const prev = best[key];
        const prevQty = prev ? +prev.currentInventoryQuantity || 0 : -1;
        const currQty = +item.currentInventoryQuantity || 0;
        if (!prev || currQty > prevQty) best[key] = item;
      });
      allItems = Object.values(best);
    }

    let filteredItems = [];
    if (by === 'Region') {
      filteredItems = allItems;
    } else {
      const payload = {
        filterContext: { storeIds, pluCodes: pluList },
        paginationContext: { pageNumber: 0, pageSize: 10000 }
      };
      
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'content-type': 'application/x-amz-json-1.0',
            'x-amz-target': 'WfmCamBackendService.GetItemsAvailability'
          },
          body: JSON.stringify(payload),
          credentials: 'include'
        });
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        allItems = data?.itemsAvailability || [];
        filteredItems = allItems.filter(it => pluList.includes(it.wfmScanCode));
        
        pluList.forEach(plu => {
          if (!filteredItems.some(it => it.wfmScanCode === plu))
            missingPairs.push(`${plu} (${storeIds[0]})`);
        });
      } catch (err) {
        console.error('Error loading items:', err);
        progress.textContent = 'Error loading items. Please check your connection.';
        progress.style.color = '#e74c3c';
        return;
      }
    }

    if (!filteredItems.length) {
      progress.textContent = `Not found: ${missingPairs.join(', ')}`;
      progress.style.color = '#e74c3c';
      return;
    }
    
    progress.textContent = missingPairs.length
      ? `Not found: ${missingPairs.join(', ')}`
      : 'Item(s) loaded successfully.';
    progress.style.color = missingPairs.length ? '#e74c3c' : '#004E36';

    await renderSpreadsheet(context, filteredItems);
  };

  /* -------------------------------------------------- *
   *  VALIDATION AND OPERATIONS - USING DATA MODEL
   * -------------------------------------------------- */
  function validateSpreadsheetData(dataModel) {
    const errors = [];
    const data = dataModel.getData();
    
    if (data.length < 1) {
      return errors;
    }
    
    // Validate headers (row 0)
    for (let i = 0; i < HEADERS.length; i++) {
      const expectedHeader = HEADERS[i];
      const actualHeader = dataModel.getCell(0, i);
      if (actualHeader !== expectedHeader) {
        errors.push({ 
          row: 0, 
          col: i, 
          msg: `Header column ${i + 1} should be "${expectedHeader}" but found "${actualHeader}"` 
        });
      }
    }
    
    // Track duplicates
    const seenPairs = new Set();
    
    // Validate data rows (skip row 0 which is headers)
    for (let r = 1; r < data.length; r++) {
      const store = dataModel.getCell(r, 0);
      const itemName = dataModel.getCell(r, 1);
      const plu = dataModel.getCell(r, 2);
      const availability = dataModel.getCell(r, 3);
      const inventory = dataModel.getCell(r, 4);
      const andon = dataModel.getCell(r, 6);
      
      // Skip empty rows
      if (!store && !itemName && !plu) continue;
      
      console.log(`Validating row ${r}: Store=${store}, PLU=${plu}, Avail=${availability}, Inv=${inventory}, Andon=${andon}`);
      
      // Check for duplicate store/PLU pairs
      const pairKey = `${store.toUpperCase()}::${plu.toUpperCase()}`;
      if (seenPairs.has(pairKey)) {
        errors.push({ 
          row: r, 
          col: 0, 
          msg: `Duplicate Store/PLU pair: ${store}/${plu}` 
        });
      } else {
        seenPairs.add(pairKey);
      }
      
      // Validate availability
      if (availability !== 'Limited' && availability !== 'Unlimited') {
        errors.push({ 
          row: r, 
          col: 3, 
          msg: `Availability must be "Limited" or "Unlimited", found: "${availability}"` 
        });
      }
      
      // Validate andon cord
      if (andon !== 'Enabled' && andon !== 'Disabled') {
        errors.push({ 
          row: r, 
          col: 6, 
          msg: `Andon Cord must be "Enabled" or "Disabled", found: "${andon}"` 
        });
      }
      
      // Validate inventory
      const invNum = parseInt(inventory, 10);
      if (isNaN(invNum) || invNum < 0 || invNum > 10000) {
        errors.push({ 
          row: r, 
          col: 4, 
          msg: `Current Inventory must be 0-10000, found: "${inventory}"` 
        });
      }
      
      // Special rule: Unlimited items should have 0 inventory
      if (availability === 'Unlimited' && inventory !== '0') {
        errors.push({ 
          row: r, 
          col: 4, 
          msg: `Unlimited items must have 0 inventory, found: "${inventory}"` 
        });
      }
    }
    
    console.log(`Validation complete. Found ${errors.length} errors:`, errors);
    return errors;
  }

  function incrementInventoryInModel(dataModel, increment) {
    let updatedCount = 0;
    
    // Use batch update to prevent multiple notifications
    dataModel.batchUpdate(null, (model) => {
      const data = model.getData();
      
      // Process each row (skip header row 0)
      for (let r = 1; r < data.length; r++) {
        const availability = model.getCell(r, 3);
        const currentInventory = parseInt(model.getCell(r, 4), 10) || 0;
        
        // Skip empty rows
        if (!availability) continue;
        
        console.log(`Row ${r}: Availability="${availability}", Current="${currentInventory}"`);
        
        // Only increment Limited items
        if (availability === 'Limited') {
          const newInventory = Math.max(0, Math.min(10000, currentInventory + increment));
          model.setCell(r, 4, newInventory, true); // Silent update
          updatedCount++;
          console.log(`Row ${r}: Updated from ${currentInventory} to ${newInventory}`);
        } else if (availability === 'Unlimited') {
          // Ensure unlimited items stay at 0
          model.setCell(r, 4, '0', true); // Silent update
        }
      }
    });
    
    console.log(`Updated ${updatedCount} rows`);
    return updatedCount;
  }

  function snapUnlimitedToZeroInModel(dataModel) {
    let changed = false;
    
    // Use batch update to prevent multiple notifications
    dataModel.batchUpdate(null, (model) => {
      const data = model.getData();
      
      for (let r = 1; r < data.length; r++) {
        const availability = model.getCell(r, 3);
        const inventory = model.getCell(r, 4);
        
        if (availability === 'Unlimited' && inventory !== '0') {
          model.setCell(r, 4, '0', true); // Silent update
          changed = true;
        }
      }
    });
    
    return changed;
  }

  /* -------------------------------------------------- *
   *  SPREADSHEET RENDERING - WITH IMPROVED DATA MODEL
   * -------------------------------------------------- */
  const renderSpreadsheet = async (ctx, items) => {
    removeEl(SPREADSHEET_CONTAINER);
    removeEl(DOWNLOAD_BTN_ID);

    const sheetWrap = createEl('div', { id: SPREADSHEET_CONTAINER });
    ctx.appendChild(sheetWrap);

    // Add increment UI
    let incWrap = $('#ei-increment-wrap', ctx);
    if (!incWrap) {
      incWrap = createEl('div', { 
        id: 'ei-increment-wrap'
      });
      incWrap.innerHTML = `
        <label style="font-weight:500;">Increment Inventory:</label>
        <input id="ei-increment-input" type="number" value="1" min="-999" max="999" 
               style="width:80px;padding:5px 8px;border:1px solid #ccc;border-radius:5px;font-size:15px;">
        <button id="ei-increment-btn" class="ei-action" 
                style="background:#218838;color:#fff;padding:7px 18px;font-size:15px;border-radius:5px;margin-top:0;">Apply</button>
        <span style="color:#888;font-size:13px;">(Skips "Unlimited" rows)</span>
      `;
      ctx.appendChild(incWrap);
    }

    // Add validate button
    let validateBtn = $('#ei-validate-btn', ctx);
    if (!validateBtn) {
      validateBtn = createEl('button', {
        id: 'ei-validate-btn',
        className: 'ei-action',
        style: 'background:#004E36;color:#fff;margin-top:10px;margin-bottom:0;font-size:15px;border-radius:5px;',
        textContent: 'Validate'
      });
      ctx.appendChild(validateBtn);
    }

    // Convert items to data rows
    const toRow = (item) => [
      item._eiStoreKey || item.storeTLC || '',
      item.itemName || '',
      item.wfmScanCode || '',
      item.inventoryStatus || '',
      (item.inventoryStatus === 'Unlimited' ? '0' : String(Math.max(0, Math.min(10000, +item.currentInventoryQuantity || 0)))),
      '',
      item.andon ? 'Enabled' : 'Disabled',
      '',
      ''
    ];

    const dataRows = items.map(toRow);
    
    // Create data model
    const dataModel = new SpreadsheetDataModel(dataRows);
    
    // Store the data model reference
    ctx._eiDataModel = dataModel;
    
    console.log('Initial data model:', dataModel.getData());

    let xs = null;
    let isSpreadsheetUpdating = false; // Track when we're updating the spreadsheet
    
    const loadingMsg = createEl('div', { 
      style: 'padding:16px;color:#004E36;font-weight:600;text-align:center;' 
    }, SPINNER_HTML + ' Loading spreadsheet…');
    sheetWrap.appendChild(loadingMsg);

    try {
      await loadSpreadsheetLib();
      
      sheetWrap.innerHTML = '';
      
      // Initialize x-spreadsheet
      xs = window.x_spreadsheet(sheetWrap, {
        showToolbar: true,
        showGrid: true,
        showContextmenu: true,
        view: {
          height: () => Math.max(dataModel.getRowCount() * 25 + 100, 400),
          width: () => sheetWrap.clientWidth - 20
        },
        row: {
          len: dataModel.getRowCount() + 10,
          height: 25
        },
        col: {
          len: HEADERS.length,
          width: 120
        }
      });
      
      // Load initial data
      xs.loadData(dataModel.toSpreadsheetFormat());
      
      // Store reference immediately
      ctx._eiSpreadsheetInstance = xs;
      
      console.log('Spreadsheet initialized successfully');

      // Set up data model listener to update spreadsheet (with loop prevention)
      dataModel.addListener((newData) => {
        if (isSpreadsheetUpdating) return; // Prevent loop
        
        console.log('Data model changed, updating spreadsheet');
        try {
          isSpreadsheetUpdating = true;
          xs.loadData(dataModel.toSpreadsheetFormat());
        } catch (error) {
          console.error('Error updating spreadsheet from data model:', error);
        } finally {
          isSpreadsheetUpdating = false;
        }
      });

      // Set up spreadsheet change listener to update data model (with loop prevention)
      xs.on('cell-edited', (cell, ri, ci) => {
        if (isSpreadsheetUpdating || dataModel.isUpdating) return; // Prevent loop
        
        console.log(`Cell edited: row ${ri}, col ${ci}, value:`, cell);
        try {
          // Update our data model when spreadsheet changes
          const newValue = cell.text || '';
          dataModel.setCell(ri, ci, newValue, true); // Silent update to prevent loop
          
          // Apply business rules after a short delay
          setTimeout(() => {
            if (!isSpreadsheetUpdating && !dataModel.isUpdating) {
              snapUnlimitedToZeroInModel(dataModel);
            }
          }, 100);
        } catch (error) {
          console.error('Error updating data model from spreadsheet:', error);
        }
      });

      // Set up resize handling
      const resize = debounce(() => {
        if (sheetWrap && xs) {
          const newHeight = Math.max(dataModel.getRowCount() * 25 + 100, 400);
          sheetWrap.style.height = `${newHeight}px`;
        }
      });
      window.eiResizeHandler = resize;
      window.addEventListener('resize', resize);
      resize();

      // Connect validation button
      validateBtn.onclick = () => {
        console.log('Validation triggered');
        clearInlineError(ctx);
        
        const errors = validateSpreadsheetData(dataModel);
        console.log('Validation errors found:', errors.length);
        
        if (errors.length > 0) {
          const errorHtml = 'Validation warnings:<br>' + 
            errors.map(e => `<div>• Row ${e.row + 1}: ${e.msg}</div>`).join('');
          showInlineError(ctx, errorHtml);
        } else {
          showInlineError(ctx, '<div style="color:green;">✓ All validation checks passed!</div>');
        }
      };

      // Connect increment button
      $('#ei-increment-btn', ctx).onclick = () => {
        console.log('Increment triggered');
        clearInlineError(ctx);
        
        const incVal = parseInt($('#ei-increment-input', ctx).value, 10);
        if (isNaN(incVal)) {
          showInlineError(ctx, 'Please enter a valid number');
          return;
        }
        
        const updatedCount = incrementInventoryInModel(dataModel, incVal);
        console.log('Increment result:', updatedCount);
        
        if (updatedCount > 0) {
          showInlineError(ctx, `<div style="color:green;">✓ Updated ${updatedCount} rows by ${incVal}</div>`);
        } else {
          showInlineError(ctx, '<div style="color:orange;">No rows were updated. Check that items have "Limited" availability.</div>');
        }
        
        // Re-validate after increment
        setTimeout(() => {
          const errors = validateSpreadsheetData(dataModel);
          if (errors.length > 0) {
            const errorHtml = 'Validation warnings after increment:<br>' + 
              errors.map(e => `<div>• Row ${e.row + 1}: ${e.msg}</div>`).join('');
            showInlineError(ctx, errorHtml);
          }
        }, 200);
      };

      // Initial business rules application
      setTimeout(() => {
        snapUnlimitedToZeroInModel(dataModel);
        const errors = validateSpreadsheetData(dataModel);
        if (errors.length > 0) {
          console.log('Initial validation errors:', errors);
        }
      }, 1000);

      // Add download button
      const dl = createEl('button', {
        id: DOWNLOAD_BTN_ID,
        className: 'ei-action green',
        textContent: 'Download CSV',
        style: 'margin-top:15px;'
      });
      ctx.appendChild(dl);

      dl.onclick = () => {
        console.log('CSV download triggered');
        clearInlineError(ctx);
        
        // Validate before export
        const errors = validateSpreadsheetData(dataModel);
        if (errors.length > 0) {
          const errorMsg = 'Validation warnings detected:\n' + 
            errors.map(e => `Row ${e.row + 1}: ${e.msg}`).join('\n') + 
            '\n\nDownload anyway?';
          
          if (!confirmWarning(errorMsg)) {
            showInlineError(ctx, 'Export cancelled due to validation warnings');
            return;
          }
        }

        const csv = dataModel.toCSV();
        if (!csv) {
          showInlineError(ctx, 'Failed to generate CSV data');
          return;
        }

        console.log('Generated CSV preview:', csv.substring(0, 200) + '...');

        // Download the CSV
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = createEl('a', {
          href: url,
          download: `ExistingItemEdit_${new Date().toISOString().slice(0,10)}.csv`
        });
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showInlineError(ctx, '<div style="color:green;">✓ CSV downloaded successfully!</div>');
      };
      
    } catch (error) {
      console.error('Failed to initialize spreadsheet:', error);
      sheetWrap.innerHTML = `
        <div style="padding:16px;color:red;text-align:center;">
          Failed to load spreadsheet. Please refresh and try again.<br>
          <small>${error.message}</small>
        </div>`;
    }
  };

  /* -------------------------------------------------- *
   *  ENTRY POINT
   * -------------------------------------------------- */
  (function() {
    let observerDisconnected = false;
    const observer = new MutationObserver(() => {
      if (observerDisconnected) return;
      
      if ($('#' + EDIT_BTN_ID)) {
        observer.disconnect();
        observerDisconnected = true;
      } else {
        addEditBtn();
      }
    });
    
    // Start observing
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Initial call
    addEditBtn();
    
    // Cleanup observer after 30 seconds to prevent memory leaks
    setTimeout(() => {
      if (!observerDisconnected) {
        observer.disconnect();
        observerDisconnected = true;
      }
    }, 30000);
  })();

  // Export for testing (if needed)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { addEditBtn };
  }
})();