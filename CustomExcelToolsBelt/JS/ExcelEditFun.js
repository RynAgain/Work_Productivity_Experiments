(function() {
  'use strict';

  // Only run on /editor
  if (!/\/editor($|\?)/.test(window.location.pathname)) return;

  // Wait for TM_UI to be ready
  function onReady(fn) {
    if (window.TM_UI && typeof window.TM_UI.registerPanel === 'function') {
      fn();
    } else {
      window.addEventListener('TM_UI_READY', fn, { once: true });
    }
  }

  onReady(function() {
    window.TM_UI.registerPanel({
      id: 'excel-explode',
      title: 'Excel Explode',
      render: function() {
        // Create panel root
        const root = document.createElement('div');
        root.id = 'eef-panel-root';

        // Styles (scoped to panel)
        if (!document.getElementById('eef-panel-style')) {
          const style = document.createElement('style');
          style.id = 'eef-panel-style';
          style.textContent = `
            #eef-panel-root label {
              font-weight: 500;
              margin-top: 10px;
              display: block;
            }
            #eef-panel-root input, #eef-panel-root select {
              width: 100%;
              margin-bottom: 10px;
              padding: 7px 10px;
              border: 1px solid #ccc;
              border-radius: 5px;
              font-size: 15px;
            }
            #eef-panel-root button {
              background: #004E36;
              color: #fff;
              border: none;
              border-radius: 5px;
              padding: 10px 0;
              font-size: 16px;
              cursor: pointer;
              width: 100%;
              margin-top: 10px;
              transition: background 0.2s;
            }
            #eef-panel-root button:hover {
              background: #218838;
            }
            #eef-panel-root .row {
              margin-bottom: 10px;
            }
            #eef-panel-status {
              color: #004E36;
              font-size: 14px;
              margin-top: 8px;
              min-height: 18px;
            }
          `;
          document.head.appendChild(style);
        }

        // Panel HTML
        root.innerHTML = `
          <h3 style="margin-top:0;margin-bottom:12px;">Excel Explode Column</h3>
          <label for="eef-file">Excel File (.xlsx or .csv)</label>
          <input type="file" id="eef-file" accept=".xlsx,.csv" aria-label="Excel file" />
          <label for="eef-sheet">Sheet</label>
          <select id="eef-sheet" disabled aria-label="Sheet select">
            <option value="">Select sheet</option>
          </select>
          <label for="eef-column">Column</label>
          <select id="eef-column" disabled aria-label="Column select">
            <option value="">Select column</option>
          </select>
          <label for="eef-delim">Delimiter</label>
          <input type="text" id="eef-delim" value="," maxlength="5" aria-label="Delimiter" />
          <label for="eef-filename">Output File Name</label>
          <input type="text" id="eef-filename" value="exploded.xlsx" aria-label="Output file name" />
          <button id="eef-explode" disabled aria-label="Explode and download">Explode & Download</button>
          <div id="eef-panel-status"></div>
        `;

        // Elements (scoped to root)
        const fileInput = root.querySelector('#eef-file');
        const sheetSelect = root.querySelector('#eef-sheet');
        const columnSelect = root.querySelector('#eef-column');
        const delimInput = root.querySelector('#eef-delim');
        const filenameInput = root.querySelector('#eef-filename');
        const explodeBtn = root.querySelector('#eef-explode');
        const statusDiv = root.querySelector('#eef-panel-status');

        let workbook = null;
        let sheetData = null;

        // File upload handler
        fileInput.addEventListener('change', function() {
          const file = fileInput.files[0];
          if (!file) return;
          statusDiv.textContent = 'Reading file...';
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
              workbook = wb;
              // Update shared file state (default to first sheet)
              if (window.TM_FileState) {
                window.TM_FileState.setWorkbook(wb, wb.SheetNames[0]);
              }
              // Populate sheet dropdown
              sheetSelect.innerHTML = '<option value="">Select sheet</option>';
              wb.SheetNames.forEach(name => {
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name;
                sheetSelect.appendChild(opt);
              });
              sheetSelect.disabled = false;
              columnSelect.innerHTML = '<option value="">Select column</option>';
              columnSelect.disabled = true;
              explodeBtn.disabled = true;
              statusDiv.textContent = 'File loaded. Select a sheet.';
            } catch (err) {
              statusDiv.textContent = 'Error reading file: ' + err.message;
            }
          };
          if (file.name.endsWith('.csv')) {
            reader.readAsText(file);
          } else {
            reader.readAsArrayBuffer(file);
          }
        });

        // Sheet select handler
        sheetSelect.addEventListener('change', function() {
          const sheetName = sheetSelect.value;
          if (!sheetName || !workbook) {
            columnSelect.innerHTML = '<option value="">Select column</option>';
            columnSelect.disabled = true;
            explodeBtn.disabled = true;
            return;
          }
          // Update shared file state for sheet selection
          if (window.TM_FileState) {
            window.TM_FileState.setSheetName(sheetName);
          }
          // Get data
          const ws = workbook.Sheets[sheetName];
          sheetData = XLSX.utils.sheet_to_json(ws, { defval: '' });
          // Populate column dropdown
          columnSelect.innerHTML = '<option value="">Select column</option>';
          if (sheetData.length > 0) {
            Object.keys(sheetData[0]).forEach(col => {
              const opt = document.createElement('option');
              opt.value = col;
              opt.textContent = col;
              columnSelect.appendChild(opt);
            });
            columnSelect.disabled = false;
            explodeBtn.disabled = true;
            statusDiv.textContent = 'Select a column to explode.';
          } else {
            columnSelect.disabled = true;
            explodeBtn.disabled = true;
            statusDiv.textContent = 'Sheet is empty.';
          }
        });

        // Column select handler
        columnSelect.addEventListener('change', function() {
          if (columnSelect.value) {
            explodeBtn.disabled = false;
            statusDiv.textContent = 'Ready to explode column "' + columnSelect.value + '".';
          } else {
            explodeBtn.disabled = true;
          }
        });

        // Explode and download handler
        explodeBtn.addEventListener('click', function() {
          if (!sheetData || !columnSelect.value) return;
          const col = columnSelect.value;
          const delim = delimInput.value || ',';
          const outRows = [];
          sheetData.forEach(row => {
            const cell = row[col];
            if (typeof cell === 'string' && cell.includes(delim)) {
              cell.split(delim).map(v => v.trim()).forEach(val => {
                if (val !== '') {
                  const newRow = { ...row, [col]: val };
                  outRows.push(newRow);
                }
              });
            } else if (cell !== undefined && cell !== null && cell !== '') {
              // Single value, not split
              outRows.push({ ...row });
            }
          });
          if (outRows.length === 0) {
            statusDiv.textContent = 'No data to output after explode.';
            return;
          }
          // Create new sheet and workbook
          const outWb = XLSX.utils.book_new();
          const outWs = XLSX.utils.json_to_sheet(outRows);
          XLSX.utils.book_append_sheet(outWb, outWs, 'Exploded');
          // Download
          const fname = filenameInput.value.trim() || 'exploded.xlsx';
          XLSX.writeFile(outWb, fname);
          statusDiv.textContent = 'File downloaded: ' + fname;
        });

        return root;
      }
    });
  });

})();