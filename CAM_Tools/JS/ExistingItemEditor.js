/* eslint-env browser */
(function () {
    'use strict';
  
    /* ------------------------------------------------------------------ *
     *  ICON + CONSTANTS
     * ------------------------------------------------------------------ */
    const editorIcon = `
      <svg width="22" height="22" fill="none" stroke="#fff" stroke-width="2.2"
           stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
        <path d="M12 19l7-7 3 3-7 7-3-3z" fill="#004E36" stroke="#fff" stroke-width="1.5"/>
        <path d="M18 13l-6 6M2 12l6 6M3 3l18 18" stroke="#fff" stroke-width="1.5"/>
      </svg>`;
  
    const COLS = [
      'Store - 3 Letter Code',
      'Item Name',
      'Item PLU/UPC',
      'Availability',
      'Current Inventory',
      'Sales Floor Capacity',
      'Tracking Start Date',
      'Tracking End Date'
    ];
  
    const environment = window.location.hostname.includes('gamma') ? 'gamma' : 'prod';
    const apiUrlBase  = `https://${environment}.cam.wfm.amazon.dev/api/`;
  
    /* ------------------------------------------------------------------ *
     *  MAIN ENTRY POINT
     * ------------------------------------------------------------------ */
    function openExistingItemEditor () {
      console.log('[ExistingItemEditor] opening…');
  
      /* ---------------- overlay + container --------------------------- */
      const overlay = Object.assign(document.createElement('div'), {
        id   : 'editorOverlay',
        style: `
          position:fixed; inset:0;
          display:flex; justify-content:center; align-items:center;
          background:rgba(0,0,0,.5); z-index:1001;`
      });
  
      const container = Object.assign(document.createElement('div'), {
        style: `
          position:relative; width:80vw; height:80vh; background:#fff;
          border-radius:12px; overflow:hidden;
          box-shadow:0 8px 32px rgba(0,0,0,.18), 0 1.5px 6px rgba(0,78,54,.10);`
      });
  
      overlay.appendChild(container);
      document.body.appendChild(overlay);
  
      /* ---------------- Handsontable ---------------------------------- */
      let hot;
      try {
        hot = new Handsontable(container, {
          data        : [],
          colHeaders  : COLS,
          rowHeaders  : true,
          contextMenu : true,
          width       : '100%',
          height      : '100%',
          licenseKey  : 'non-commercial-and-evaluation'
        });
      } catch (err) {
        console.error('[ExistingItemEditor] Handsontable init failed:', err);
        document.body.removeChild(overlay);
        return;
      }
  
      /* ---------------- UI controls ----------------------------------- */
      // close button
      const closeBtn = Object.assign(document.createElement('button'), {
        innerHTML : '&times;',
        title     : 'Close',
        style     : `
          position:absolute; top:10px; right:10px; padding:0 8px;
          font-size:26px; line-height:28px;
          background:none; border:none; cursor:pointer;`
      });
      closeBtn.onclick = () => document.body.removeChild(overlay);
      container.appendChild(closeBtn);
  
      // file‑name input
      const nameInput = Object.assign(document.createElement('input'), {
        type        : 'text',
        placeholder : 'Enter file name',
        style       : `
          position:absolute; bottom:50px; right:10px; padding:6px 8px;
          border:1px solid #ccc; border-radius:4px; font-size:15px;`
      });
      container.appendChild(nameInput);
  
      // download CSV
      const dlBtn = makeActionBtn('Download CSV', 10, () => {
        const file = (nameInput.value.trim() || 'ExistingCamItems') + '.csv';
        downloadCSV(hot.getSourceData(), file);
      });
      container.appendChild(dlBtn);
  
      // upload
      const upBtn = makeActionBtn('Upload', 110, () => uploadData(hot.getSourceData()));
      container.appendChild(upBtn);
  
      function makeActionBtn (label, right, cb) {
        return Object.assign(document.createElement('button'), {
          innerText : label,
          style     : `
            position:absolute; bottom:10px; right:${right}px;
            padding:6px 12px; font-size:15px; cursor:pointer;`,
          onclick   : cb
        });
      }
  
      /* ---------------- fetch + populate ------------------------------ */
      fetchData().then(objRows => {
        const rows = objRows.map(r => COLS.map(c => r[c] ?? ''));
        hot.loadData(rows);
        console.log(`[ExistingItemEditor] loaded ${rows.length} rows`);
      }).catch(e => console.error('[ExistingItemEditor] data load error:', e));
    }
  
    /* ------------------------------------------------------------------ *
     *  DATA FETCHING
     * ------------------------------------------------------------------ */
    function fetchData () {
      return new Promise((resolve, reject) => {
        const hdrStores = {
          'accept'       : '*/*',
          'content-type' : 'application/x-amz-json-1.0',
          'x-amz-target' : 'WfmCamBackendService.GetStoresInformation'
        };
  
        fetch(apiUrlBase, {
          method      : 'POST',
          headers     : hdrStores,
          body        : '{}',
          credentials : 'include'
        })
        .then(r => r.json())
        .then(storeData => {
          if (!storeData?.storesInformation) throw new Error('Invalid store data');
  
          // flatten TLCs
          const storeIds = [];
          Object.values(storeData.storesInformation).forEach(states =>
            Object.values(states).forEach(stores =>
              stores.forEach(s => storeIds.push(s.storeTLC))
            )
          );
  
          return Promise.all(storeIds.map(id => fetchItemsForStore(id)));
        })
        .then(all => resolve(all.flat()))
        .catch(err => reject(err));
      });
    }
  
    function fetchItemsForStore (storeId) {
      const hdrItems = {
        'accept'       : '*/*',
        'content-type' : 'application/x-amz-json-1.0',
        'x-amz-target' : 'WfmCamBackendService.GetItemsAvailability'
      };
  
      const payload = {
        filterContext    : { storeIds:[storeId] },
        paginationContext: { pageNumber:0, pageSize:10000 }
      };
  
      return fetch(apiUrlBase, {
        method      : 'POST',
        headers     : hdrItems,
        body        : JSON.stringify(payload),
        credentials : 'include'
      })
      .then(r => r.json())
      .then(d => (d.itemsAvailability || []).map(item => ({
        'Store - 3 Letter Code' : storeId,
        'Item Name'             : item.itemName,
        'Item PLU/UPC'          : item.wfmScanCode,
        'Availability'          : item.inventoryStatus,
        'Current Inventory'     : item.inventoryStatus === 'Unlimited'
                                  ? '0'
                                  : String(Math.max(
                                      0, Math.min(10000, parseInt(item.currentInventoryQuantity) || 0))),
        'Sales Floor Capacity'  : '',
        'Tracking Start Date'   : '',
        'Tracking End Date'     : ''
      })))
      .catch(err => {
        console.error(`[ExistingItemEditor] store ${storeId} error:`, err);
        return [];
      });
    }
  
    /* ------------------------------------------------------------------ *
     *  CSV + UPLOAD PLACEHOLDERS
     * ------------------------------------------------------------------ */
    function downloadCSV (rows2D, fileName) {
      const csv = rows2D.map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
      const link = Object.assign(document.createElement('a'), {
        href     : URL.createObjectURL(blob),
        download : fileName,
        style    : 'display:none'
      });
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  
    function uploadData (rows2D) {
      console.log('[ExistingItemEditor] upload placeholder', rows2D);
      // TODO: implement upload logic
    }
  
    /* ------------------------------------------------------------------ *
     *  EXPORT  (settings quick‑tools can pick these up)
     * ------------------------------------------------------------------ */
    try {
      module.exports = { openExistingItemEditor, editorIcon };
    } catch { // non-module context
      window.openExistingItemEditor = openExistingItemEditor;
      window.editorIcon             = editorIcon;
    }
  })();
  