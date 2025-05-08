(function() {
  'use strict';

  // Only run on /editor
  if (!/\/editor($|\?)/.test(window.location.pathname)) return;

  // Wait for TM_UI and TM_FileState to be ready
  function onReady(fn) {
    if (window.TM_UI && window.TM_FileState) {
      fn();
    } else {
      let count = 0;
      function check() {
        if (window.TM_UI && window.TM_FileState) {
          fn();
        } else if (++count < 50) {
          setTimeout(check, 100);
        }
      }
      check();
    }
  }

  onReady(function() {
    window.TM_UI.registerPanel({
      id: 'preview-file',
      title: 'File Preview',
      render: function() {
        // Panel root
        const root = document.createElement('div');
        root.id = 'preview-file-panel';

        // Styles (scoped)
        if (!document.getElementById('preview-file-style')) {
          const style = document.createElement('style');
          style.id = 'preview-file-style';
          style.textContent = `
            #preview-file-panel table {
              border-collapse: collapse;
              width: 100%;
              margin-bottom: 12px;
              font-size: 14px;
            }
            #preview-file-panel th, #preview-file-panel td {
              border: 1px solid #ccc;
              padding: 4px 7px;
              text-align: left;
              max-width: 180px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            #preview-file-panel th {
              background: #f2f2f2;
              font-weight: 600;
            }
            #preview-file-panel .preview-actions {
              margin-bottom: 10px;
            }
            #preview-file-panel .preview-status {
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
        root.appendChild(statusDiv);

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
        root.appendChild(actionsDiv);

        // Table container
        const tableDiv = document.createElement('div');
        root.appendChild(tableDiv);

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

        // Clean up on panel removal (if needed)
        root.addEventListener('DOMNodeRemoved', function(e) {
          if (e.target === root && unsub) {
            window.TM_FileState.unsubscribe(unsub);
          }
        });

        return root;
      }
    });
  });

})();