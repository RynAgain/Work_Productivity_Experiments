
(function() {
  'use strict';

  // Only run on /editor
  if (!/\/editor($|\?)/.test(window.location.pathname)) return;

  // Wait for TM_UI and TM_FileState and JSZip
  function onReady(fn) {
    if (window.TM_UI && window.TM_FileState && window.JSZip) {
      fn();
    } else {
      let count = 0;
      function check() {
        if (window.TM_UI && window.TM_FileState && window.JSZip) {
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
      id: 'split-by',
      title: 'Split By Column',
      render: function() {
        // Panel root
        const root = document.createElement('div');
        root.id = 'split-by-panel';

        // Styles (scoped)
        if (!document.getElementById('split-by-style')) {
          const style = document.createElement('style');
          style.id = 'split-by-style';
          style.textContent = `
            #split-by-panel label {
              font-weight: 500;
              margin-top: 10px;
              display: block;
            }
            #split-by-panel input, #split-by-panel select {
              width: 100%;
              margin-bottom: 10px;
              padding: 7px 10px;
              border: 1px solid #ccc;
              border-radius: 5px;
              font-size: 15px;
            }
            #split-by-panel button {
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
            #split-by-panel button:hover {
              background: #218838;
            }
            #split-by-status {
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
          <h3 style="margin-top:0;margin-bottom:12px;">Split File By Column</h3>
          <label for="split-by-column">Column to split by</label>
          <select id="split-by-column" aria-label="Column to split by">
            <option value="">Select column</option>
          </select>
          <label for="split-by-suffix">File name suffix</label>
          <input type="text" id="split-by-suffix" value="part" aria-label="File name suffix" />
          <button id="split-by-go" disabled aria-label="Split and download zip">Split & Download Zip</button>
          <div id="split-by-status"></div>
        `;

        // Elements
        const columnSelect = root.querySelector('#split-by-column');
        const suffixInput = root.querySelector('#split-by-suffix');
        const goBtn = root.querySelector('#split-by-go');
        const statusDiv = root.querySelector('#split-by-status');

        // Populate columns from file state
        function updateColumns() {
          const state = window.TM_FileState.getState();
          columnSelect.innerHTML = '<option value="">Select column</option>';
          if (state.sheetData && state.sheetData.length > 0) {
            Object.keys(state.sheetData[0]).forEach(col => {
              const opt = document.createElement('option');
              opt.value = col;
              opt.textContent = col;
              columnSelect.appendChild(opt);
            });
            columnSelect.disabled = false;
            goBtn.disabled = !columnSelect.value;
          } else {
            columnSelect.disabled = true;
            goBtn.disabled = true;
          }
        }

        // Enable/disable button
        columnSelect.addEventListener('change', function() {
          goBtn.disabled = !columnSelect.value;
        });

        // Subscribe to file state changes
        let unsub = null;
        function subscribe() {
          if (unsub) window.TM_FileState.unsubscribe(unsub);
          unsub = function() { updateColumns(); };
          window.TM_FileState.subscribe(unsub);
          updateColumns();
        }
        subscribe();

        // Split and download handler
        goBtn.addEventListener('click', async function() {
          const state = window.TM_FileState.getState();
          const col = columnSelect.value;
          const suffix = suffixInput.value.trim() || 'part';
          if (!state.sheetData || !col) {
            statusDiv.textContent = 'No data or column selected. Please upload a file and select a column.';
            return;
          }

          // Group rows by column value
          const groups = {};
          state.sheetData.forEach(row => {
            const key = row[col] || 'EMPTY';
            if (!groups[key]) groups[key] = [];
            groups[key].push(row);
          });

          const groupCount = Object.keys(groups).length;
          if (groupCount > 100) {
            if (!confirm(`Warning: This will create ${groupCount} files. Continue?`)) {
              statusDiv.textContent = 'Operation cancelled by user.';
              return;
            }
          }

          statusDiv.textContent = 'Splitting and zipping...';

          // Create zip
          const zip = new JSZip();
          let fileCount = 0;
          function sanitizeFilename(name) {
            return String(name).replace(/[^a-zA-Z0-9_\-\.]/g, '_').slice(0, 50);
          }
          for (const key in groups) {
            const rows = groups[key];
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(rows);
            XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
            const fname = `${sanitizeFilename(key)}-${sanitizeFilename(suffix)}.xlsx`;
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            zip.file(fname, wbout);
            fileCount++;
          }

          // Generate and download zip
          try {
            const content = await zip.generateAsync({ type: 'blob' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(content);
            a.download = `split-by-${sanitizeFilename(col)}.zip`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => document.body.removeChild(a), 100);
            statusDiv.textContent = `Downloaded ${fileCount} files in zip.`;
          } catch (err) {
            statusDiv.textContent = 'Error creating zip: ' + err.message;
          }
        });

        // Clean up on panel removal
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