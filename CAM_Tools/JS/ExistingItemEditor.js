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

  /* -------------------------------------------------- *
   *  SIMPLE DATA MODEL
   * -------------------------------------------------- */
  class TableDataModel {
    constructor(initialData = []) {
      this.data = [HEADERS, ...initialData];
    }
    
    getData() {
      return this.data;
    }
    
    getCell(row, col) {
      return this.data[row] && this.data[row][col] ? this.data[row][col] : '';
    }
    
    setCell(row, col, value) {
      if (!this.data[row]) this.data[row] = [];
      this.data[row][col] = String(value);
    }
    
    toCSV() {
      return this.data.map(row => 
        row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
      ).join('\n');
    }
  }

  /* -------------------------------------------------- *
   *  STYLES
   * -------------------------------------------------- */
  const injectStyles = () => {
    if (!$('#' + STYLE_ID)) {
      const style = createEl('style', { id: STYLE_ID });
      style.textContent = `
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
        .ei-overlay{
          position:fixed;inset:0;background:rgba(0,0,0,.5);
          display:flex;justify-content:center;align-items:center;z-index:1001;
        }
        .ei-card{
          background:#fff;border-radius:12px;
          width:min(96vw,1200px);max-height:90vh;display:flex;flex-direction:column;
          box-shadow:0 8px 32px rgba(0,0,0,.18);overflow:hidden;
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
        
        /* EDITABLE TABLE STYLES */
        .ei-table-container{
          width:100%;margin-top:16px;border:1px solid #ddd;border-radius:8px;overflow:auto;
          max-height:500px;background:#fff;
        }
        .ei-table{
          width:100%;border-collapse:collapse;font-size:14px;
        }
        .ei-table th{
          background:#004E36;color:#fff;padding:12px 8px;text-align:left;
          position:sticky;top:0;z-index:10;border-right:1px solid #056a48;
          font-weight:600;font-size:13px;
        }
        .ei-table td{
          padding:8px;border-right:1px solid #eee;border-bottom:1px solid #eee;
          min-width:120px;position:relative;
        }
        .ei-table tr:hover{background:#f8f9fa;}
        .ei-table tr.ei-error{background:#fee;}
        .ei-table td.ei-error{background:#fee;border:2px solid #e74c3c;}
        
        /* EDITABLE CELL STYLES */
        .ei-cell-input{
          width:100%;border:none;background:transparent;padding:4px;
          font-family:inherit;font-size:inherit;outline:none;
        }
        .ei-cell-input:focus{
          background:#fff;border:2px solid #004E36;border-radius:3px;
        }
        .ei-cell-select{
          width:100%;border:none;background:transparent;padding:4px;
          font-family:inherit;font-size:inherit;outline:none;
        }
        .ei-cell-select:focus{
          background:#fff;border:2px solid #004E36;border-radius:3px;
        }
        
        #ei-increment-wrap{
          margin-top:12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;
        }
        #ei-error-message{
          margin-top:10px;padding:10px;background:#fee;border:1px solid #fcc;
          border-radius:5px;color:#c33;font-size:14px;
        }
        
        @media(max-width:400px){
          .ei-btn{left:4px;right:4px;width:calc(100% - 8px);}
          #ei-increment-wrap{flex-direction:column;align-items:flex-start;}
          .ei-table{font-size:12px;}
          .ei-table th, .ei-table td{padding:6px 4px;min-width:100px;}
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
   *  OVERLAY
   * -------------------------------------------------- */
  const openOverlay = () => {
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
    closeX.onclick = () => overlay.remove();
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
      <div id="ei-progress" style="display:none;margin-top:8px;text-align:center;font-size:15px;color:#004E36;">Waiting…</div>`;
    
    $('#ei-fetch', body).onclick = () => fetchItem(body);

    overlay.onclick = (e) => {
      if (e.target === overlay) overlay.remove();
    };

    document.body.appendChild(overlay);
    $('#ei-plu').focus();
  };

  /* -------------------------------------------------- *
   *  DATA FETCHING (SAME AS BEFORE BUT SIMPLIFIED)
   * -------------------------------------------------- */
  const fetchItem = async (context) => {
    const progress = $('#ei-progress', context);
    progress.style.display = 'block';
    progress.textContent = 'Processing…';

    const pluInput = $('#ei-plu').value.trim();
    const sr = $('#ei-store').value.trim().toUpperCase();
    const by = $('#ei-by').value;
    
    if (!pluInput || !sr) {
      progress.textContent = 'Both fields are required.';
      return;
    }
    
    const pluList = [...new Set(pluInput.split(',').map(p => p.trim()).filter(Boolean))];
    const env = location.hostname.includes('gamma') ? 'gamma' : 'prod';
    const url = `https://${env}.cam.wfm.amazon.dev/api/`;

    try {
      // Simplified data fetching (keeping the same logic but removing complexity)
      let storeIds = by === 'Store' ? [sr] : await getRegionStores(url, sr);
      let items = await fetchItems(url, storeIds, pluList, by === 'Region');
      
      if (!items.length) {
        progress.textContent = 'No items found.';
        return;
      }
      
      progress.textContent = 'Items loaded successfully.';
      renderTable(context, items);
      
    } catch (error) {
      progress.textContent = 'Error loading data.';
      console.error(error);
    }
  };

  // Simplified helper functions
  const getRegionStores = async (url, regionCode) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/x-amz-json-1.0', 'x-amz-target': 'WfmCamBackendService.GetStoresInformation' },
      body: JSON.stringify({}),
      credentials: 'include'
    });
    const data = await res.json();
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

  const fetchItems = async (url, storeIds, pluList, isRegion) => {
    const items = [];
    
    if (isRegion) {
      for (const storeId of storeIds) {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/x-amz-json-1.0', 'x-amz-target': 'WfmCamBackendService.GetItemsAvailability' },
          body: JSON.stringify({ filterContext: { storeIds: [storeId] }, paginationContext: { pageNumber: 0, pageSize: 10000 } }),
          credentials: 'include'
        });
        const data = await res.json();
        items.push(...(data.itemsAvailability || []).map(item => ({ ...item, _eiStoreKey: storeId })));
      }
    } else {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/x-amz-json-1.0', 'x-amz-target': 'WfmCamBackendService.GetItemsAvailability' },
        body: JSON.stringify({ filterContext: { storeIds, pluCodes: pluList }, paginationContext: { pageNumber: 0, pageSize: 10000 } }),
        credentials: 'include'
      });
      const data = await res.json();
      items.push(...(data.itemsAvailability || []));
    }
    
    return items.filter(item => pluList.includes(item.wfmScanCode));
  };

  /* -------------------------------------------------- *
   *  TABLE RENDERING - MUCH SIMPLER AND MORE RELIABLE
   * -------------------------------------------------- */
  const renderTable = (ctx, items) => {
    removeEl(TABLE_CONTAINER);
    removeEl(DOWNLOAD_BTN_ID);

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
    ctx._eiDataModel = dataModel;

    // Add controls
    const controlsHtml = `
      <div id="ei-increment-wrap">
        <label style="font-weight:500;">Increment Inventory:</label>
        <input id="ei-increment-input" type="number" value="1" min="-999" max="999" 
               style="width:80px;padding:5px 8px;border:1px solid #ccc;border-radius:5px;font-size:15px;">
        <button id="ei-increment-btn" class="ei-action" 
                style="background:#218838;color:#fff;padding:7px 18px;font-size:15px;border-radius:5px;margin-top:0;">Apply</button>
        <span style="color:#888;font-size:13px;">(Skips "Unlimited" rows)</span>
      </div>
      <button id="ei-validate-btn" class="ei-action" 
              style="background:#004E36;color:#fff;margin-top:10px;margin-bottom:0;font-size:15px;border-radius:5px;">Validate</button>
    `;
    ctx.insertAdjacentHTML('beforeend', controlsHtml);

    // Create table
    const tableContainer = createEl('div', { id: TABLE_CONTAINER, className: 'ei-table-container' });
    const table = createEl('table', { className: 'ei-table' });
    
    // Create header
    const thead = createEl('thead');
    const headerRow = createEl('tr');
    HEADERS.forEach(header => {
      const th = createEl('th', {}, header);
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create body
    const tbody = createEl('tbody');
    dataModel.getData().slice(1).forEach((row, rowIndex) => {
      const actualRowIndex = rowIndex + 1; // +1 because we skip header
      const tr = createEl('tr');
      tr.dataset.row = actualRowIndex;
      
      row.forEach((cell, colIndex) => {
        const td = createEl('td');
        td.dataset.row = actualRowIndex;
        td.dataset.col = colIndex;
        
        // Create appropriate input based on column
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

        // Add change listener
        input.addEventListener('change', (e) => {
          const newValue = e.target.value;
          dataModel.setCell(actualRowIndex, colIndex, newValue);
          
          // Apply business rule: Unlimited -> 0 inventory
          if (colIndex === 3 && newValue === 'Unlimited') {
            const invInput = tr.querySelector('[data-col="4"] input, [data-col="4"] select');
            if (invInput) {
              invInput.value = '0';
              dataModel.setCell(actualRowIndex, 4, '0');
            }
          }
          
          clearValidationErrors();
        });

        td.appendChild(input);
        tr.appendChild(td);
      });
      
      tbody.appendChild(tr);
    });
    
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    ctx.appendChild(tableContainer);

    // Connect button handlers
    $('#ei-increment-btn', ctx).onclick = () => {
      const incVal = parseInt($('#ei-increment-input', ctx).value, 10);
      if (isNaN(incVal)) {
        showInlineError(ctx, 'Please enter a valid number');
        return;
      }
      
      incrementInventory(dataModel, incVal);
      updateTableFromModel(table, dataModel);
      showInlineError(ctx, `<div style="color:green;">✓ Incremented inventory by ${incVal}</div>`);
    };

    $('#ei-validate-btn', ctx).onclick = () => {
      const errors = validateData(dataModel);
      highlightErrors(table, errors);
      
      if (errors.length) {
        showInlineError(ctx, 'Validation warnings:<br>' + errors.map(e => `<div>• ${e.msg}</div>`).join(''));
      } else {
        showInlineError(ctx, '<div style="color:green;">✓ All validation checks passed!</div>');
      }
    };

    // Add download button
    const dl = createEl('button', {
      id: DOWNLOAD_BTN_ID,
      className: 'ei-action green',
      textContent: 'Download CSV',
      style: 'margin-top:15px;'
    });
    ctx.appendChild(dl);

    dl.onclick = () => {
      updateModelFromTable(table, dataModel);
      const errors = validateData(dataModel);
      
      if (errors.length && !confirmWarning('Validation warnings detected. Download anyway?')) {
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
    };
  };

  /* -------------------------------------------------- *
   *  TABLE OPERATIONS - SIMPLE AND RELIABLE
   * -------------------------------------------------- */
  const updateModelFromTable = (table, dataModel) => {
    const inputs = table.querySelectorAll('input, select');
    inputs.forEach(input => {
      const row = parseInt(input.closest('td').dataset.row);
      const col = parseInt(input.closest('td').dataset.col);
      dataModel.setCell(row, col, input.value);
    });
  };

  const updateTableFromModel = (table, dataModel) => {
    const inputs = table.querySelectorAll('input, select');
    inputs.forEach(input => {
      const row = parseInt(input.closest('td').dataset.row);
      const col = parseInt(input.closest('td').dataset.col);
      input.value = dataModel.getCell(row, col);
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

  const validateData = (dataModel) => {
    const errors = [];
    const data = dataModel.getData();
    const seenPairs = new Set();
    
    for (let r = 1; r < data.length; r++) {
      const store = dataModel.getCell(r, 0);
      const plu = dataModel.getCell(r, 2);
      const availability = dataModel.getCell(r, 3);
      const inventory = dataModel.getCell(r, 4);
      const andon = dataModel.getCell(r, 6);
      
      if (!store || !plu) continue;
      
      const pairKey = `${store.toUpperCase()}::${plu.toUpperCase()}`;
      if (seenPairs.has(pairKey)) {
        errors.push({ row: r, col: 0, msg: `Duplicate Store/PLU: ${store}/${plu}` });
      } else {
        seenPairs.add(pairKey);
      }
      
      if (availability !== 'Limited' && availability !== 'Unlimited') {
        errors.push({ row: r, col: 3, msg: 'Availability must be Limited or Unlimited' });
      }
      
      if (andon !== 'Enabled' && andon !== 'Disabled') {
        errors.push({ row: r, col: 6, msg: 'Andon must be Enabled or Disabled' });
      }
      
      const invNum = parseInt(inventory, 10);
      if (isNaN(invNum) || invNum < 0 || invNum > 10000) {
        errors.push({ row: r, col: 4, msg: 'Inventory must be 0-10000' });
      }
      
      if (availability === 'Unlimited' && inventory !== '0') {
        errors.push({ row: r, col: 4, msg: 'Unlimited items must have 0 inventory' });
      }
    }
    
    return errors;
  };

  const highlightErrors = (table, errors) => {
    clearValidationErrors();
    errors.forEach(error => {
      const cell = table.querySelector(`td[data-row="${error.row}"][data-col="${error.col}"]`);
      if (cell) cell.classList.add('ei-error');
    });
  };

  const clearValidationErrors = () => {
    document.querySelectorAll('.ei-error').forEach(el => el.classList.remove('ei-error'));
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