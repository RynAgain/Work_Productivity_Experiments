/* eslint‑env browser */
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

    /* ----------  overlay + container  (single creation) --------------- */
    let overlay   = document.getElementById('editorOverlay');
    let container = document.getElementById('editorContainer');

    if (!overlay) {
      overlay = Object.assign(document.createElement('div'), {
        id   : 'editorOverlay',
        style: `
          position:fixed; inset:0;
          display:flex; justify-content:center; align-items:center;
          background:rgba(0,0,0,.5); z-index:1001;`
      });
      document.body.appendChild(overlay);
    }

    if (!container) {
      container = Object.assign(document.createElement('div'), {
        id   : 'editorContainer',
        style: `
          position:relative; width:80vw; height:80vh; background:#fff;
          border-radius:12px; overflow:hidden;
          box-shadow:0 8px 32px rgba(0,0,0,.18), 0 1.5px 6px rgba(0,78,54,.10);`
      });
      overlay.appendChild(container);
    }

    /* ----------  build (or locate) the form --------------------------- */
    let form = container.querySelector('#editorForm');
    if (!form) {
      form = Object.assign(document.createElement('form'), { id:'editorForm' });
      form.innerHTML = `
        <label style="font-weight:bold;margin-top:6px;display:block;">PLU(s):</label>
        <input type="text" id="pluInput" placeholder="Enter PLU(s) separated by commas"
               style="width:100%;padding:6px 8px;border:1px solid #ccc;border-radius:5px;font-size:14px;">

        <label style="font-weight:bold;margin-top:10px;display:block;">By:</label>
        <select id="bySelect"
                style="width:100%;padding:6px 8px;border:1px solid #ccc;border-radius:5px;font-size:14px;">
          <option value="Store">Store</option>
          <option value="Region">Region</option>
        </select>

        <label style="font-weight:bold;margin-top:10px;display:block;">Store/Region:</label>
        <input type="text" id="storeRegionInput"
               placeholder="Enter Store/Region codes separated by commas"
               style="width:100%;padding:6px 8px;border:1px solid #ccc;border-radius:5px;font-size:14px;">

        <label style="display:block;margin:10px 0;">
          <input type="checkbox" id="allStoresCheckbox"> All Stores
        </label>

        <button type="button" id="fetchDataButton"
                style="width:100%;margin-top:10px;background:#004E36;color:#fff;
                       border:none;border-radius:5px;padding:8px 0;font-size:15px;cursor:pointer;">
          Fetch Data
          <style>
            #editorContainer { display:none; }
            #fetchDataButton { display:block; }
          </style>
        </button>`;
      container.appendChild(form);
    }

    /* ----------  sheet wrapper (for Handsontable) --------------------- */
    let sheetDiv = container.querySelector('#sheetWrapper');
    if (!sheetDiv) {
      sheetDiv = Object.assign(document.createElement('div'), {
        id   : 'sheetWrapper',
        style: 'width:100%;height:calc(100% - 180px);margin-top:10px;'
      });
      container.appendChild(sheetDiv);
    }

    /* ----------  Handsontable  --------------------------------------- */
    let hot;
    try {
      hot = new Handsontable(sheetDiv, {
        data        : [],
        renderAllRows: false,
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

    /* ----------  close, filename, DL & upload buttons ---------------- */
    if (!container.querySelector('#closeBtn')) {
      const closeBtn = Object.assign(document.createElement('button'), {
        id        : 'closeBtn',
        innerHTML : '&times;',
        title     : 'Close',
        style     : `
          position:absolute; top:10px; right:10px; padding:0 8px;
          font-size:26px; line-height:28px;
          background:none; border:none; cursor:pointer;`
      });
      closeBtn.onclick = () => document.body.removeChild(overlay);
      container.appendChild(closeBtn);
    }

    if (!container.querySelector('#fileNameInput')) {
      const nameInput = Object.assign(document.createElement('input'), {
        id          : 'fileNameInput',
        type        : 'text',
        placeholder : 'Enter file name',
        style       : `
          position:absolute; bottom:50px; right:10px; padding:6px 8px;
          border:1px solid #ccc; border-radius:4px; font-size:15px;`
      });
      container.appendChild(nameInput);
    }

    const makeActionBtn = (id, label, right, cb) => {
      // return existing button if present
      let btn = container.querySelector(`#${id}`);
      if (btn) return btn;

      // otherwise create it
      btn = Object.assign(document.createElement('button'), {
        id,
        innerText : label,
        style     : `
          position:absolute; bottom:10px; right:${right}px;
          padding:6px 12px; font-size:15px; cursor:pointer;`,
        onclick   : cb
      });
      container.appendChild(btn);
      return btn;
    };

    const downloadBtn = makeActionBtn('downloadBtn', 'Download CSV', 10, () => {
      const file = (document.getElementById('fileNameInput').value.trim() || 'ExistingCamItems') + '.csv';
      downloadCSV(hot.getSourceData(), file);
    });

    const uploadBtn = makeActionBtn('uploadBtn', 'Upload', 110, () => uploadData(hot.getSourceData()));

    downloadBtn.style.display = 'none';
    uploadBtn.style.display = 'none';

    document.getElementById('fetchDataButton').addEventListener('click', () => {
      downloadBtn.style.display = 'block';
      uploadBtn.style.display = 'block';
    });

    /* ----------  Fetch‑Data button logic ----------------------------- */
    document.getElementById('fetchDataButton').onclick = () => {
      const plus  = [...new Set(document.getElementById('pluInput')
                       .value.split(',').map(p=>p.trim()).filter(Boolean))];
      const by    = document.getElementById('bySelect').value;
      const codes = [...new Set(document.getElementById('storeRegionInput')
                       .value.split(',').map(s=>s.trim()).filter(Boolean))];
      const all   = document.getElementById('allStoresCheckbox').checked;

      document.getElementById('editorContainer').style.display = 'block';
      fetchData(plus, by, codes, all)
        .then(rows => hot.loadData(rows.map(r => COLS.map(c => r[c] ?? ''))))
        .catch(err => console.error('[ExistingItemEditor] fetchData error:', err));
    };

  }

  /* ------------------------------------------------------------------ *
   *  DATA FETCHING
   * ------------------------------------------------------------------ */
  function fetchData (pluList = [], by = 'Store', codes = [], allStores = false) {
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

        // determine TLCs
        const storeIds = [];
        Object.values(storeData.storesInformation).forEach(states =>
          Object.values(states).forEach(stores =>
            stores.forEach(s => storeIds.push(s.storeTLC))
          )
        );

        let targetStores = storeIds;
        if (!allStores) {
          if (by === 'Region') {
            const regionMap = {};
            Object.entries(storeData.storesInformation).forEach(([region, states]) => {
              Object.values(states).forEach(stores =>
                stores.forEach(s => {
                  if (!regionMap[region]) regionMap[region] = [];
                  regionMap[region].push(s.storeTLC);
                })
              );
            });
            targetStores = codes.flatMap(c => regionMap[c] || []);
          } else { // by Store
            targetStores = storeIds.filter(id => codes.includes(id));
          }
        }

        return Promise.all(targetStores.map(id => fetchItemsForStore(id, pluList)));
      })
      .then(all => resolve(all.flat()))
      .catch(err => reject(err));
    });
  }

  function fetchItemsForStore (storeId, pluList) {
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
    .then(d => (d.itemsAvailability || [])
      .filter(item => pluList.length === 0 || pluList.includes(item.wfmScanCode))
      .map(item => ({
        'Store - 3 Letter Code' : storeId,
        'Item Name'             : item.itemName,
        'Item PLU/UPC'          : item.wfmScanCode,
        'Availability'          : item.inventoryStatus,
        'Current Inventory'     : item.inventoryStatus === 'Unlimited'
                                  ? '0'
                                  : String(
                                      Math.max(0,
                                        Math.min(10000, parseInt(item.currentInventoryQuantity) || 0))),
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
   *  CSV  +  UPLOAD PLACEHOLDERS
   * ------------------------------------------------------------------ */
  function downloadCSV (rows2D, fileName) {
    const csv  = rows2D.map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n');
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
  } catch { // non‑module context
    window.openExistingItemEditor = openExistingItemEditor;
    window.editorIcon             = editorIcon;
  }
})();
