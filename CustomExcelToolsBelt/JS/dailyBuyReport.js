(function() {
  'use strict';

  // Only run on /editor
  if (!/\/editor($|\?)/.test(window.location.pathname)) return;

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
  function loadFilesFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const arr = JSON.parse(raw);
      // arr: [{date, name, dataB64}]
      const out = {};
      arr.forEach(obj => {
        if (obj && obj.date && obj.name && obj.dataB64) {
          out[obj.date] = { name: obj.name, dataB64: obj.dataB64 };
        }
      });
      return out;
    } catch (e) {
      return {};
    }
  }
  function saveFilesToStorage(fileMap) {
    // fileMap: {date: {name, dataB64}}
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
        root.innerHTML = `
          <h3 style="margin-top:0;margin-bottom:12px;">Daily Buy Report</h3>
          <div style="margin-bottom:10px;color:#444;">
            Upload the daily buy XLSX files for the 5 most recent weekdays. Each file should correspond to the date shown.<br>
            <span style="color:#888;font-size:13px;">Files are persisted in your browser (localStorage). Only the 5 most recent weekday files are kept.</span>
          </div>
          <div id="daily-buy-days"></div>
        `;

        // Render file inputs for each day
        const daysDiv = root.querySelector('#daily-buy-days');
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

          // If file is already stored for this date, show status
          if (fileState[dateStr]) {
            status.textContent = `Loaded: ${fileState[dateStr].name}`;
          }

          input.addEventListener('change', function() {
            const file = input.files[0];
            if (!file) {
              // Remove file for this date
              delete fileState[dateStr];
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
                // Convert ArrayBuffer to base64
                let binary = '';
                const bytes = new Uint8Array(data);
                for (let i = 0; i < bytes.length; i++) {
                  binary += String.fromCharCode(bytes[i]);
                }
                const dataB64 = btoa(binary);
                // Add/replace in fileState
                fileState[dateStr] = { name: file.name, dataB64 };
                // Enforce only 5 most recent files
                // (sort by date, keep only last 5)
                saveFilesToStorage(fileState);
                // Reload fileState from storage to ensure sync
                fileState = loadFilesFromStorage();
                status.textContent = `Loaded: ${file.name}`;
              } catch (err) {
                status.textContent = 'Error reading file: ' + err.message;
              }
            };
            reader.readAsArrayBuffer(file);
          });
        });

        // Placeholder for future comparison/report UI
        const futureDiv = document.createElement('div');
        futureDiv.style.marginTop = '18px';
        futureDiv.style.color = '#888';
        futureDiv.textContent = 'Day-over-day comparison and report features coming soon...';
        root.appendChild(futureDiv);

        return root;
      }
    });
  });
})();