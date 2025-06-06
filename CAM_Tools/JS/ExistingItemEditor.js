(() => {
  'use strict';

  /* -------------------------------------------------- *
   *  CONSTANTS & HELPERS
   * -------------------------------------------------- */
  const STYLE_ID               = 'ei-style';
  const SPREADSHEET_CSS        = 'https://unpkg.com/x-data-spreadsheet@1.1.5/dist/xspreadsheet.css';
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
        @media(max-width:400px){
          .ei-btn{left:4px;right:4px;width:calc(100% - 8px);}
        }`;
      document.head.appendChild(style);
    }

    if (!$(`link[href*="xspreadsheet.css"]`)) {
      const css = createEl('link', { rel: 'stylesheet', href: SPREADSHEET_CSS });
      document.head.appendChild(css);
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
    // Password protection (same as AddItemButton.js)
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
      <input type="text" id="ei-plu" placeholder="Enter PLU code">

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

    document.body.appendChild(overlay);
    $('#ei-plu').focus();
  };

  /* -------------------------------------------------- *
   *  DATA  ➜  SPREADSHEET + CSV
   * -------------------------------------------------- */
  const fetchItem = async (context) => {
    const progress = $('#ei-progress', context);
    progress.style.display = 'block';
    progress.textContent = 'Processing…';

    const pluInput = $('#ei-plu').value.trim();
    const sr = $('#ei-store').value.trim();
    const by = $('#ei-by').value;
    if (!pluInput || !sr) {
      progress.textContent = 'Both fields are required.';
      return;
    }
    const pluList = [...new Set(pluInput.split(',').map(p => p.trim()).filter(Boolean))];

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
        const storeData = await resStores.json();
        if (!storeData?.storesInformation) {
          progress.textContent = 'Failed to load store list.';
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
          progress.textContent = 'No stores found for region.';
          return;
        }
      } catch (err) {
        console.error(err);
        progress.textContent = 'Error loading store list.';
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
        const payload = {                                    // ⚠️  only once
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
        const data = await res.json();
        allItems = data?.itemsAvailability || [];
        filteredItems = allItems.filter(it => pluList.includes(it.wfmScanCode));
        pluList.forEach(plu => {
          if (!filteredItems.some(it => it.wfmScanCode === plu))
            missingPairs.push(`${plu} (${storeIds[0]})`);
        });
      } catch (err) {
        console.error(err);
        progress.textContent = 'Error loading item.';
        return;
      }
    }

    if (!filteredItems.length) {
      progress.textContent = `Not found: ${missingPairs.join(', ')}`;
      return;
    }
    progress.textContent = missingPairs.length
      ? `Not found: ${missingPairs.join(', ')}`
      : 'Item(s) loaded.';

    renderSpreadsheet(context, filteredItems);               // ⚠️  pass only items
  };

  const renderSpreadsheet = (ctx, items) => {               // ⚠️  storeId removed
    removeEl(SPREADSHEET_CONTAINER);
    removeEl(DOWNLOAD_BTN_ID);

    const sheetWrap = createEl('div', { id: SPREADSHEET_CONTAINER });
    ctx.appendChild(sheetWrap);

    const toRow = (item) => [
      item._eiStoreKey || item.storeTLC || '',
      item.itemName || '',
      item.wfmScanCode || '',
      item.inventoryStatus || '',
      (item.inventoryStatus === 'Unlimited'
        ? '0'
        : String(Math.max(0, Math.min(10000, +item.currentInventoryQuantity || 0)))),
      '',
      item.andonCordState ? 'Enabled' : 'Disabled',
      '',
      ''
    ];

    const dataArr = [HEADERS, ...items.map(toRow)];

    const xsData = {
      name: 'Sheet1',
      rows: dataArr.reduce((rows, row, r) => {
        rows[r] = { cells: row.reduce((c, v, i) => (c[i] = { text: v }, c), {}) };
        return rows;
      }, {})
    };

    let xs = null;
    if (window.x_spreadsheet) {
      xs = window.x_spreadsheet(sheetWrap, {
        showToolbar: true, showGrid: true,
        row: { len: dataArr.length, height: 28 },
        col: { len: HEADERS.length, width: 120 }
      });
      xs.loadData(xsData);

      const resize = () => {
        sheetWrap.style.height = Math.max(dataArr.length * 28 + 40, 420) + 'px';
      };
      resize();
      window.addEventListener('resize', debounce(resize));
    } else {
      sheetWrap.innerHTML = '<div style="padding:16px;color:red;">x-spreadsheet not loaded.</div>';
    }

    ctx._eiSpreadsheetInstance = xs;

    const dl = createEl('button', {
      id: DOWNLOAD_BTN_ID,
      className: 'ei-action green',
      textContent: 'Download CSV'
    });
    ctx.appendChild(dl);

    dl.onclick = () => {
      const xsInstance = ctx._eiSpreadsheetInstance;
      if (!xsInstance) { alert('Spreadsheet not ready'); return; }

      const sheetData = xsInstance.getData();
      const rows = sheetData?.rows;
      if (!rows || !Object.keys(rows).length) { alert('No data to export'); return; }

      const maxC = Math.max(0, ...Object.values(rows).map(r =>
        r.cells ? Math.max(...Object.keys(r.cells).map(Number)) + 1 : 0));
      if (!maxC) { alert('No data to export'); return; }

      // --- Validation ---
      const errors = [];
      // 1. Check headers
      const headerRow = [...Array(maxC).keys()].map(c => (rows[0]?.cells?.[c]?.text || '').trim());
      if (headerRow.join(',') !== HEADERS.join(',')) {
        errors.push('Header row is incorrect or out of order.');
      }

      // 2. Check for duplicate (store, PLU) pairs and validate values
      const seenPairs = new Set();
      for (let r = 1; r < Object.keys(rows).length; r++) {
        const row = rows[r];
        if (!row || !row.cells) continue;
        const store = (row.cells[0]?.text || '').trim();
        const plu = (row.cells[2]?.text || '').trim();
        const avail = (row.cells[3]?.text || '').trim();
        const currInv = (row.cells[4]?.text || '').trim();
        const andon = (row.cells[6]?.text || '').trim();

        // Duplicate check
        const key = `${store}::${plu}`;
        if (seenPairs.has(key)) {
          errors.push(`Line ${r + 1}: Duplicate Store/PLU pair (${store}, ${plu})`);
        } else {
          seenPairs.add(key);
        }

        // Availability check
        if (avail !== 'Limited' && avail !== 'Unlimited') {
          errors.push(`Line ${r + 1}: Availability must be "Limited" or "Unlimited"`);
        }

        // Andon Cord check
        if (andon !== 'Enabled' && andon !== 'Disabled') {
          errors.push(`Line ${r + 1}: Andon Cord must be "Enabled" or "Disabled"`);
        }

        // Inventory check
        if (avail === 'Unlimited' && currInv !== '0') {
          errors.push(`Line ${r + 1}: If Availability is "Unlimited", Current Inventory must be "0"`);
        }
      }

      if (errors.length) {
        alert('Validation failed:\n' + errors.join('\n'));
        return;
      }

      // --- CSV Generation ---
      const csv = Object.keys(rows).map(r =>
        [...Array(maxC).keys()].map(c =>
          `"${(rows[r].cells?.[c]?.text || '').replace(/"/g, '""')}"`).join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const a = createEl('a', {
        href: URL.createObjectURL(blob),
        download: 'ExistingItemEdit.csv'
      });
      document.body.appendChild(a);
      a.click();
      a.remove();
    };
  };

  /* -------------------------------------------------- *
   *  ENTRY
   * -------------------------------------------------- */
  new MutationObserver(addEditBtn).observe(document.body, { childList: true, subtree: true });
  addEditBtn();

  if (typeof module !== 'undefined') module.exports = { addEditBtn };
})();
