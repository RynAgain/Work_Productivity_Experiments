(function() {
  'use strict';

  // DEBUG: Check XLSX global on panel load
  setTimeout(() => {
    const dbg = document.createElement('div');
    dbg.style.position = 'fixed';
    dbg.style.top = '40px';
    dbg.style.right = '10px';
    dbg.style.background = '#b85c00';
    dbg.style.color = '#fff';
    dbg.style.padding = '8px 16px';
    dbg.style.zIndex = 9999;
    dbg.style.fontWeight = 'bold';
    dbg.textContent = 'dailyBuyReport.js loaded | XLSX: ' +
      (typeof window.XLSX) + ' | XLSX.read: ' +
      (window.XLSX && typeof window.XLSX.read);
    document.body.appendChild(dbg);
    setTimeout(() => dbg.remove(), 4000);
    // Also log to console for more detail
    console.log('[DEBUG] [dailyBuyReport] window.XLSX:', window.XLSX);
    if (window.XLSX) {
      console.log('[DEBUG] [dailyBuyReport] XLSX.read:', typeof window.XLSX.read, window.XLSX.read);
    }
  }, 500);

  // Utility: get the 5 most recent weekdays (Mon-Fri), formatted as YYYY-MM-DD
  function getRecentWeekdays(count = 5) {
    const days = [];
    let d = new Date();
    while (days.length < count) {
      // 0 = Sunday, 6 = Saturday
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        // Format as YYYY-MM-DD
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        days.push(`${yyyy}-${mm}-${dd}`);
      }
      d.setDate(d.getDate() - 1);
    }
    return days.reverse();
  }

  // Persistence helpers
  const STORAGE_KEY = "dailyBuyReport_files";
  // In-memory file data: { date: { name, data, valid } }
  let inMemoryFiles = {};

  function loadFilesFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const arr = JSON.parse(raw);
      // arr: [{date, name, valid}]
      const out = {};
      arr.forEach(obj => {
        if (obj && obj.date && obj.name) {
          out[obj.date] = { name: obj.name, valid: obj.valid };
        }
      });
      return out;
    } catch (e) {
      return {};
    }
  }
  function saveFilesToStorage(fileMap) {
    // fileMap: {date: {name, valid}}
    // Only keep 5 most recent by date
    const entries = Object.entries(fileMap)
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date)); // ascending
    const last5 = entries.slice(-5);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(last5));
  }

  // Register the panel when TM_UI is ready
  function onReady(fn) {
    if (window.TM_UI && typeof window.TM_UI.registerPanel === 'function') {
      fn();
    } else {
      window.addEventListener('TM_UI_READY', fn, { once: true });
    }
  }

  onReady(function() {
    window.TM_UI.registerPanel({
      id: 'daily-buy-report',
      title: 'Daily Buy Report',
      render: function() {
        // Panel root
        const root = document.createElement('div');
        root.id = 'daily-buy-report-panel';

        // Styles (scoped)
        if (!document.getElementById('daily-buy-report-style')) {
          const style = document.createElement('style');
          style.id = 'daily-buy-report-style';
          style.textContent = `
            #daily-buy-report-panel label {
              font-weight: 500;
              margin-top: 10px;
              display: block;
            }
            #daily-buy-report-panel input[type="file"] {
              width: 100%;
              margin-bottom: 10px;
              padding: 7px 10px;
              border: 1px solid #ccc;
              border-radius: 5px;
              font-size: 15px;
            }
            #daily-buy-report-panel .day-row {
              margin-bottom: 12px;
            }
            #daily-buy-report-panel .file-status {
              color: #004E36;
              font-size: 13px;
              margin-top: 2px;
              min-height: 16px;
            }
          `;
          document.head.appendChild(style);
        }

        // State: store files by date (in-memory, but always sync with storage)
        let fileState = loadFilesFromStorage();

        // Panel HTML
        const days = getRecentWeekdays(5);

        // Helper: get all loaded event_dates
        function getLoadedEventDates() {
          // Returns a Set of all event_dates in inMemoryFiles
          return new Set(Object.values(inMemoryFiles).map(f => f.event_date).filter(Boolean));
        }

        // Header
        const header = document.createElement('h3');
        header.style.marginTop = '0';
        header.style.marginBottom = '12px';
        header.textContent = 'Daily Buy Report';
        root.appendChild(header);

        // Description
        const desc = document.createElement('div');
        desc.style.marginBottom = '10px';
        desc.style.color = '#444';
        desc.innerHTML = `Upload the daily buy XLSX files for the 5 most recent weekdays. Each file should correspond to the date shown.<br>
          <span style="color:#888;font-size:13px;">Files are persisted in your browser (localStorage). Only the 5 most recent weekday files are kept.</span>`;
        root.appendChild(desc);

        // Download link (obfuscated)
        const encodedUrl = "aHR0cHM6Ly9zaGFyZS5hbWF6b24uY29tL3NpdGVzL1dGTV9lQ29tbV9BQkkvX2xheW91dHMvMTUvZG93bmxvYWQuYXNweD9Tb3VyY2VVcmw9JTJGc2l0ZXMlMkZXRk1fZUNvbW1fQUJJJTJGU2hhcmVkJTIwRG9jdW1lbnRzJTJGV0ZNT0FDJTJGRGFpbHlJbnZlbnRvcnklMkZXRk1PQUMlMjBJbnZlbnRvcnklMjBEYXRhLnhsc3gmRmxkVXJsPSZTb3VyY2U9aHR0cHMlM0ElMkYlMkZzaGFyZS5hbWF6b24uY29tJTJGc2l0ZXMlMkZXRk1fZUNvbW1fQUJJJTJGU2hhcmVkJTIwRG9jdW1lbnRzJTJGRm9ybXMlMkZBbGxJdGVtcy5hc3B4JTNGUm9vdEZvbGRlciUzRCUyRnNpdGVzJTJGV0ZNLWVDb21tLUFCSVUyRlNoYXJlZCUyMERvY3VtZW50cyUyRldGTU9BQyUyRkRhaWx5SW52ZW50b3J5JkZvbGRlckNUSUQ9MHgwMTIwMDB7M0MzQ0Y1QzUxNjY1Njg0M0FENzI4MzM4RDlDMkFGQTQ=";
        const urlB64 = encodedUrl.replace(/\s+/g, '');
        function decodeB64(b64) {
          try {
            return atob(b64);
          } catch (e) {
            return '';
          }
        }
        const reportUrl = decodeB64(urlB64);
        const dlDiv = document.createElement('div');
        dlDiv.style.marginBottom = '12px';
        dlDiv.innerHTML = `<a href="${reportUrl}" target="_blank" rel="noopener noreferrer" style="color:#004E36;font-weight:600;text-decoration:underline;">&#128190; Download Latest Inventory Report</a>
          <span style="color:#888;font-size:13px;margin-left:6px;">(opens in new tab, login required)</span>`;
        root.appendChild(dlDiv);

        // Days container
        const daysDiv = document.createElement('div');
        daysDiv.id = 'daily-buy-days';
        root.appendChild(daysDiv);

        // Render file inputs for each day
        days.forEach(dateStr => {
          const row = document.createElement('div');
          row.className = 'day-row';
          const label = document.createElement('label');
          label.textContent = `File for ${dateStr}`;
          label.setAttribute('for', `daily-buy-file-${dateStr}`);
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.xlsx';
          input.id = `daily-buy-file-${dateStr}`;
          input.setAttribute('aria-label', `XLSX file for ${dateStr}`);
          const status = document.createElement('div');
          status.className = 'file-status';
          row.appendChild(label);
          row.appendChild(input);
          row.appendChild(status);
          daysDiv.appendChild(row);

          // Show loaded file for this slot if any file's event_date matches
          let loadedEventDate = null;
          let loadedFileName = null;
          for (const [evtDate, fileObj] of Object.entries(inMemoryFiles)) {
            if (evtDate === dateStr) {
              loadedEventDate = evtDate;
              loadedFileName = fileObj.name;
              break;
            }
          }
          if (loadedEventDate) {
            status.textContent = `Loaded: ${loadedFileName} (event_date: ${loadedEventDate})`;
          }

          input.addEventListener('change', function() {
            const file = input.files[0];
            if (!file) {
              // Remove file for this date
              delete fileState[dateStr];
              delete inMemoryFiles[dateStr];
              saveFilesToStorage(fileState);
              status.textContent = 'No file selected.';
              return;
            }
            if (!file.name.endsWith('.xlsx')) {
              status.textContent = 'Invalid file type. Please select an .xlsx file.';
              return;
            }
            status.textContent = 'Reading file...';
            const reader = new FileReader();
            reader.onload = function(e) {
              try {
                const data = e.target.result;
                // Parse workbook
                const wb = XLSX.read(data, { type: 'array' });
                const SHEET_NAME = "WFMOAC Inventory Data";
                const REQUIRED_HEADERS = [
                  "store_name","store_acronym","store_tlc","item_name","sku","asin","quantity","listing_status","event_date","sku_wo_chck_dgt","rnk","eod_our_price","offering_start_datetime","offering_end_datetime","merchant_customer_id","encrypted_merchant_id","is_active","asin","gl_product_group_desc","item_name","national_family_name","national_category_name","national_subcategory_name","recall_description","degredation_reason","online_sales","instore_sales","snapshot_day"
                ];
                if (!wb.SheetNames.includes(SHEET_NAME)) {
                  status.textContent = `Error: Sheet "${SHEET_NAME}" not found in file.`;
                  fileState[dateStr] = { name: file.name, valid: false };
                  saveFilesToStorage(fileState);
                  delete inMemoryFiles[dateStr];
                  return;
                }
                const ws = wb.Sheets[SHEET_NAME];
                const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
                if (!rows.length) {
                  status.textContent = `Error: Sheet "${SHEET_NAME}" is empty.`;
                  fileState[dateStr] = { name: file.name, valid: false };
                  saveFilesToStorage(fileState);
                  delete inMemoryFiles[dateStr];
                  return;
                }
                const fileHeaders = Object.keys(rows[0]);
                const missing = REQUIRED_HEADERS.filter(h => !fileHeaders.includes(h));
                if (missing.length > 0) {
                  status.textContent = `Error: Missing required columns: ${missing.join(', ')}`;
                  fileState[dateStr] = { name: file.name, valid: false };
                  saveFilesToStorage(fileState);
                  delete inMemoryFiles[dateStr];
                  return;
                }
                // Extract unique event_date from rows
                const eventDates = Array.from(new Set(rows.map(r => r.event_date).filter(Boolean)));
                if (eventDates.length === 0) {
                  status.textContent = 'Error: No event_date found in sheet.';
                  fileState[dateStr] = { name: file.name, valid: false };
                  saveFilesToStorage(fileState);
                  delete inMemoryFiles[dateStr];
                  return;
                }
                if (eventDates.length > 1) {
                  status.textContent = `Error: Multiple event_date values found: ${eventDates.join(', ')}`;
                  fileState[dateStr] = { name: file.name, valid: false };
                  saveFilesToStorage(fileState);
                  delete inMemoryFiles[dateStr];
                  return;
                }
                const eventDate = eventDates[0];
                // Prevent duplicate event_date uploads
                if (inMemoryFiles[eventDate]) {
                  status.textContent = `Error: A file for event_date ${eventDate} is already uploaded.`;
                  return;
                }
                // Store file data in memory only (not in localStorage), keyed by event_date
                inMemoryFiles[eventDate] = { name: file.name, data, valid: true, rows, event_date: eventDate };
                fileState[eventDate] = { name: file.name, valid: true };
                saveFilesToStorage(fileState);
                fileState = loadFilesFromStorage();
                status.textContent = `Loaded: ${file.name} (event_date: ${eventDate})`;
              } catch (err) {
                status.textContent = 'Error reading file: ' + err.message;
              }
            };
            reader.readAsArrayBuffer(file);
          });
        });

        // Warning about persistence
        const warnDiv = document.createElement('div');
        warnDiv.style.marginTop = '14px';
        warnDiv.style.color = '#b85c00';
        warnDiv.style.fontWeight = 'bold';
        warnDiv.style.fontSize = '13px';
        warnDiv.textContent = 'Note: Due to browser storage limits, uploaded files are only kept for this session. They will be lost if you reload or close the page.';
        root.appendChild(warnDiv);

        // Day-over-day active % preview
        const previewDiv = document.createElement('div');
        previewDiv.style.marginTop = '24px';
        previewDiv.style.background = '#fff';
        previewDiv.style.border = '1px solid #eee';
        previewDiv.style.borderRadius = '8px';
        previewDiv.style.padding = '16px 10px 10px 10px';
        previewDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
        previewDiv.style.maxHeight = '480px';
        previewDiv.style.overflow = 'auto';

        // Search/filter for store_tlc
        const filterDiv = document.createElement('div');
        filterDiv.style.marginBottom = '8px';
        const filterInput = document.createElement('input');
        filterInput.type = 'text';
        filterInput.placeholder = 'Filter by store_tlc...';
        filterInput.style.width = '220px';
        filterInput.style.marginRight = '10px';
        filterInput.style.padding = '4px 8px';
        filterInput.style.border = '1px solid #ccc';
        filterInput.style.borderRadius = '4px';
        filterDiv.appendChild(filterInput);
        previewDiv.appendChild(filterDiv);

        // Table container
        const tableDiv = document.createElement('div');
        previewDiv.appendChild(tableDiv);

        // Helper: compute day-over-day active % per store
        function computeActivePercentages() {
          // event_dates sorted ascending
          const eventDates = Object.keys(inMemoryFiles).sort();
          // store_tlc -> event_date -> {active, total}
          const storeMap = {};
          eventDates.forEach(evtDate => {
            const file = inMemoryFiles[evtDate];
            if (!file || !file.rows) return;
            file.rows.forEach(row => {
              const store = row.store_tlc;
              if (!store) return;
              if (!storeMap[store]) storeMap[store] = {};
              if (!storeMap[store][evtDate]) storeMap[store][evtDate] = { active: 0, total: 0 };
              // Only count unique items per store per day (by sku+asin)
              // We'll use a Set to track unique items
              if (!storeMap[store][evtDate].itemSet) storeMap[store][evtDate].itemSet = new Set();
              const itemKey = (row.sku || '') + '|' + (row.asin || '');
              if (!storeMap[store][evtDate].itemSet.has(itemKey)) {
                storeMap[store][evtDate].itemSet.add(itemKey);
                storeMap[store][evtDate].total += 1;
                const status = (row.listing_status || '').toLowerCase();
                if (status === 'active') {
                  storeMap[store][evtDate].active += 1;
                }
                // Treat "incomplete" as inactive (do nothing)
              }
            });
          });
          // Remove itemSet from output
          for (const store in storeMap) {
            for (const evtDate in storeMap[store]) {
              delete storeMap[store][evtDate].itemSet;
            }
          }
          return { storeMap, eventDates };
        }

        // Render preview table
        function renderPreviewTable() {
          const { storeMap, eventDates } = computeActivePercentages();
          let stores = Object.keys(storeMap).sort();
          const filter = filterInput.value.trim();
          if (filter) {
            stores = stores.filter(s => s.toLowerCase().includes(filter.toLowerCase()));
          }
          const maxRows = 50;
          let showRows = stores.slice(0, maxRows);
          let hasMore = stores.length > maxRows;

          let html = '';
          if (stores.length === 0) {
            html = '<div style="color:#888;">No stores to display. Upload files to see analysis.</div>';
          } else {
            html += `<table style="border-collapse:collapse;width:100%;font-size:13px;">`;
            html += `<thead><tr><th style="position:sticky;left:0;background:#fff;z-index:2;">store_tlc</th>`;
            eventDates.forEach(evtDate => {
              html += `<th style="min-width:90px;">${evtDate}</th>`;
            });
            html += `</tr></thead><tbody>`;
            showRows.forEach(store => {
              html += `<tr><td style="position:sticky;left:0;background:#fff;z-index:1;font-weight:500;">${store}</td>`;
              eventDates.forEach(evtDate => {
                const cell = storeMap[store][evtDate];
                if (!cell) {
                  html += `<td style="color:#bbb;">-</td>`;
                } else {
                  const pct = cell.total > 0 ? (cell.active / cell.total * 100) : 0;
                  const pctStr = cell.total > 0 ? `${cell.active}/${cell.total} (${pct.toFixed(1)}%)` : '-';
                  html += `<td>${pctStr}</td>`;
                }
              });
              html += `</tr>`;
            });
            html += `</tbody></table>`;
            if (hasMore) {
              html += `<div style="margin-top:8px;color:#888;">Showing first ${maxRows} of ${stores.length} stores. Use filter to find a specific store.</div>`;
            }
          }
          tableDiv.innerHTML = html;
        }

        filterInput.addEventListener('input', renderPreviewTable);

        // Initial render
        renderPreviewTable();

        root.appendChild(previewDiv);

        return root;
      }
    });
  });

})();