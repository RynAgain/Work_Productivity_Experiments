
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
      id: 'split-to-upload-files',
      title: 'Split To Upload Files',
      render: function() {
        // Panel root
        const root = document.createElement('div');
        root.id = 'split-to-upload-panel';

        // Styles (scoped)
        if (!document.getElementById('split-to-upload-style')) {
          const style = document.createElement('style');
          style.id = 'split-to-upload-style';
          style.textContent = `
            #split-to-upload-panel label {
              font-weight: 500;
              margin-top: 10px;
              display: block;
            }
            #split-to-upload-panel input, #split-to-upload-panel select {
              width: 100%;
              margin-bottom: 10px;
              padding: 7px 10px;
              border: 1px solid #ccc;
              border-radius: 5px;
              font-size: 15px;
            }
            #split-to-upload-panel button {
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
            #split-to-upload-panel button:disabled {
              background: #ccc;
              color: #888;
              cursor: not-allowed;
            }
            #split-to-upload-status {
              color: #004E36;
              font-size: 14px;
              margin-top: 8px;
              min-height: 18px;
            }
            #split-to-upload-panel .disabled {
              opacity: 0.5;
              pointer-events: none;
            }
          #split-to-upload-panel {
            overflow-y: auto;
            max-height: 80vh;
          }
          `;
          document.head.appendChild(style);
        }

        // Panel HTML
        root.innerHTML = `
          <style>
            .split-to-upload-segment-btn {
              border: 1px solid #004E36;
              background: #fff;
              color: #004E36;
              font-weight: 500;
              transition: background 0.2s, color 0.2s;
              cursor: pointer;
              outline: none;
              box-shadow: none;
            }
            .split-to-upload-segment-btn.active, .split-to-upload-segment-btn[aria-pressed="true"] {
              background: #004E36 !important;
              color: #fff !important;
              z-index: 1;
            }
            .split-to-upload-segment-btn:not(.active):not([aria-pressed="true"]) {
              background: #fff !important;
              color: #004E36 !important;
            }
            #split-to-upload-segmented {
              border-radius: 5px;
              overflow: hidden;
              border: 1px solid #004E36;
              width: 100%;
              margin-bottom: 0;
            }
            #split-to-upload-segmented .split-to-upload-segment-btn {
              border-radius: 0;
              border: none;
              border-right: 1px solid #004E36;
            }
            #split-to-upload-segmented .split-to-upload-segment-btn:last-child {
              border-right: none;
            }
            #split-to-upload-region-btn { border-radius: 5px 0 0 5px; }
            #split-to-upload-mid-btn { border-radius: 0 5px 5px 0; }
          </style>
          <div style="display:flex;align-items:center;margin-bottom:12px;">
            <h3 style="margin:0;flex:1;">Split To Upload Files</h3>
            <span id="split-to-upload-info" title="Show info" style="cursor:pointer;font-size:20px;color:#004E36;margin-left:8px;">&#9432;</span>
          </div>
          <div id="split-to-upload-info-modal" style="display:none;position:fixed;top:10vh;left:50%;transform:translateX(-50%);background:#fff;border:2px solid #004E36;border-radius:10px;box-shadow:0 4px 24px rgba(0,0,0,0.13);z-index:99999;padding:28px 32px 24px 32px;max-width:600px;width:90vw;">
            <div style="display:flex;align-items:center;margin-bottom:10px;">
              <b style="font-size:18px;flex:1;">About: Split To Upload Files</b>
              <button id="split-to-upload-info-close" style="font-size:18px;background:none;border:none;cursor:pointer;color:#004E36;">&times;</button>
            </div>
            <div style="font-size:15px;line-height:1.6;">
              <p>
                <b>Purpose:</b> This tool splits a product upload file by region, generates region-specific upload files, MID lists, and ATC (cartesian) files, and outputs all as .xlsx in a zip.
              </p>
              <p>
                <b>Required Inputs:</b>
                <ul>
                  <li><b>Product Upload File</b> (uploaded in the main sidebar): Must contain these columns:<br>
                    <code>feed_product_type, item_sku, update_delete, standard_price, offering_start_date, offering_end_date, condition_type, main_image_url, external_product_id, external_product_id_type, quantity, alternate_tax_code</code>
                  </li>
                  <li><b>Store-Region-MID Map File</b>: Must contain these columns:<br>
                    <code>Acro, Region, Store name, MID</code>
                  </li>
                </ul>
              </p>
              <p>
                <b>Outputs:</b>
                <ul>
                  <li><b>Upload File (.xlsx):</b> For each region, a file with metadata, human-readable labels, system keys, and product rows (ATC column is omitted).</li>
                  <li><b>MIDs File (.xlsx):</b> For each region, a file listing all MIDs for that region.</li>
                  <li><b>ATC File (.xlsx):</b> For each region, a file with the cartesian product of region MIDs × SKUs, columns: <code>catering_mid, asin, sku, alternate_tax_code</code>.</li>
                </ul>
              </p>
              <p>
                <b>Templates:</b>
                <ul>
                  <li><a id="split-to-upload-template-upload" href="#" download="upload-template.xlsx">Download Upload File Template (.xlsx)</a></li>
                  <li><a id="split-to-upload-template-map" href="#" download="store-region-mid-template.xlsx">Download Store-Region-MID Map Template (.xlsx)</a></li>
                </ul>
              </p>
            </div>
          </div>
          <div id="split-to-upload-warning" style="color:#b85c00;font-weight:bold;margin-bottom:8px;display:none;"></div>
          <label for="split-to-upload-map">Store-Region-ID Map File (.csv, .xlsx, .xls)</label>
          <input type="file" id="split-to-upload-map" accept=".csv,.xlsx,.xls" aria-label="Store-Region-ID Map File" />
          <div id="split-to-upload-map-status" style="font-size:13px;color:#004E36;margin-bottom:8px;"></div>
          <div style="margin-bottom:12px;">
            <div id="split-to-upload-segmented" style="display:flex;gap:0;">
              <button type="button" id="split-to-upload-region-btn" class="split-to-upload-segment-btn active" aria-pressed="true" style="flex:1 1 0;padding:7px 0;font-size:15px;border-radius:5px 0 0 5px;border:1px solid #004E36;background:#004E36;color:#fff;cursor:pointer;transition:background 0.2s, color 0.2s;font-weight:500;border-right:none;">
                Split by Region
              </button>
              <button type="button" id="split-to-upload-mid-btn" class="split-to-upload-segment-btn" aria-pressed="false" style="flex:1 1 0;padding:7px 0;font-size:15px;border-radius:0 5px 5px 0;border:1px solid #004E36;background:#fff;color:#004E36;cursor:pointer;transition:background 0.2s, color 0.2s;font-weight:500;">
                Split by MID
              </button>
            </div>
          </div>
          <label for="split-to-upload-column">Column to split by</label>
          <select id="split-to-upload-column" aria-label="Column to split by">
            <option value="">Select column</option>
          </select>
          <label for="split-to-upload-suffix">File name suffix</label>
          <input type="text" id="split-to-upload-suffix" value="upload" aria-label="File name suffix" />
          <button id="split-to-upload-go" disabled aria-label="Split and download zip">Split & Download Zip</button>
          <button id="split-to-upload-uploadsonly" disabled aria-label="Download upload files only" style="margin-top:6px;">Download Upload Files Only</button>
          <button id="split-to-upload-midsonly" disabled aria-label="Download MID lists only" style="margin-top:6px;">Download MID Lists Only</button>
          <button id="split-to-upload-cartesianonly" disabled aria-label="Download Cartesian product only" style="margin-top:6px;">Download Cartesian Product Only</button>
          <div id="split-to-upload-status"></div>
        `;

        // Elements
        const columnSelect = root.querySelector('#split-to-upload-column');
        const suffixInput = root.querySelector('#split-to-upload-suffix');
        const goBtn = root.querySelector('#split-to-upload-go');
        const uploadsOnlyBtn = root.querySelector('#split-to-upload-uploadsonly');
        const midsOnlyBtn = root.querySelector('#split-to-upload-midsonly');
        const cartesianOnlyBtn = root.querySelector('#split-to-upload-cartesianonly');
        const statusDiv = root.querySelector('#split-to-upload-status');
        const warningDiv = root.querySelector('#split-to-upload-warning');
        const mapInput = root.querySelector('#split-to-upload-map');
        const mapStatus = root.querySelector('#split-to-upload-map-status');
        const regionBtn = root.querySelector('#split-to-upload-region-btn');
        const midBtn = root.querySelector('#split-to-upload-mid-btn');
        let splitByMID = false;
        let mapData = null;
        const MAP_STORAGE_KEY = "splitToUploadFiles_mapData";
        // Try to load persisted map on panel load
        (function loadPersistedMap() {
          try {
            const saved = localStorage.getItem(MAP_STORAGE_KEY);
            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                mapData = parsed;
                mapStatus.textContent = `Loaded persisted map file (${parsed.length} rows)`;
              }
            }
          } catch (e) {}
        })();

        // Validation logic
        function isValidInput(state) {
          // Require all specified columns to be present
          const requiredCols = [
            "feed_product_type",
            "item_sku",
            "update_delete",
            "standard_price",
            "offering_start_date",
            "offering_end_date",
            "condition_type",
            "main_image_url",
            "external_product_id",
            "external_product_id_type",
            "quantity",
            "alternate_tax_code"
          ];
          if (!state.sheetData || state.sheetData.length === 0) return false;
          const cols = state.sheetData[0] ? Object.keys(state.sheetData[0]) : [];
          return requiredCols.every(col => cols.includes(col));
        }

        // Populate columns from file state and validate
        function updateUI() {
          const state = window.TM_FileState.getState();
          columnSelect.innerHTML = '<option value="">Select column</option>';
          let valid = isValidInput(state);
          if (valid && state.sheetData && state.sheetData.length > 0) {
            Object.keys(state.sheetData[0]).forEach(col => {
              const opt = document.createElement('option');
              opt.value = col;
              opt.textContent = col;
              columnSelect.appendChild(opt);
            });
            columnSelect.disabled = false;
            goBtn.disabled = !columnSelect.value;
            uploadsOnlyBtn.disabled = !columnSelect.value;
            midsOnlyBtn.disabled = !columnSelect.value;
            cartesianOnlyBtn.disabled = !columnSelect.value;
            root.classList.remove('disabled');
            warningDiv.style.display = 'none';
          } else {
            columnSelect.disabled = true;
            goBtn.disabled = true;
            uploadsOnlyBtn.disabled = true;
            midsOnlyBtn.disabled = true;
            cartesianOnlyBtn.disabled = true;
            root.classList.add('disabled');
            warningDiv.textContent = 'Input file does not meet requirements for this tool.';
            warningDiv.style.display = '';
          }
        }

        // Handle map file upload
        mapInput.addEventListener('change', function() {
          const file = mapInput.files[0];
          if (!file) {
            mapStatus.textContent = 'No map file selected.';
            mapData = null;
            return;
          }
          mapStatus.textContent = 'Reading map file...';
          const requiredMapCols = ["Acro", "Region", "Store name", "MID"];
          const reader = new FileReader();
          reader.onload = function(e) {
            try {
              let data = e.target.result;
              let rows, headers;
              if (file.name.endsWith('.csv')) {
                // Parse CSV
                const lines = data.split(/\r?\n/).filter(Boolean);
                headers = lines[0].split(',').map(h => h.trim());
                rows = lines.slice(1).map(line => {
                  const vals = line.split(',');
                  const obj = {};
                  headers.forEach((h, i) => obj[h] = vals[i] ? vals[i].trim() : "");
                  return obj;
                });
              } else {
                // Parse XLSX
                const wb = XLSX.read(data, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
                headers = rows.length > 0 ? Object.keys(rows[0]) : [];
              }
              // Validate required columns
              const missing = requiredMapCols.filter(col => !headers.includes(col));
              if (missing.length > 0) {
                mapData = null;
                mapStatus.textContent = `Error: Map file missing columns: ${missing.join(', ')}`;
                return;
              }
              mapData = rows;
              // Persist to localStorage
              try {
                localStorage.setItem(MAP_STORAGE_KEY, JSON.stringify(rows));
              } catch (e) {}
              mapStatus.textContent = `Loaded map file: ${file.name} (${rows.length} rows)`;
            } catch (err) {
              mapData = null;
              mapStatus.textContent = 'Error reading map file: ' + err.message;
            }
          };
          if (file.name.endsWith('.csv')) {
            reader.readAsText(file);
          } else {
            reader.readAsArrayBuffer(file);
          }
        });

        // Enable/disable button
        columnSelect.addEventListener('change', function() {
          goBtn.disabled = !columnSelect.value;
        });

        // Subscribe to file state changes
        let unsub = null;
        function subscribe() {
          if (unsub) window.TM_FileState.unsubscribe(unsub);
          unsub = function() { updateUI(); };
          window.TM_FileState.subscribe(unsub);
          updateUI();
        }
        subscribe();

        // Split and download handler
        // Helper for all output types
        async function generateZip({ uploads = false, mids = false, cartesian = false, suffix, col, statusDiv, splitByMID = false }) {
          const state = window.TM_FileState.getState();
          if (!state.sheetData || !col) {
            statusDiv.textContent = 'No data or column selected. Please upload a file and select a column.';
            return;
          }
          if (!mapData) {
            statusDiv.textContent = 'No valid Store-Region-MID map file loaded.';
            return;
          }

          // Group rows by region or MID (split column)
          const groups = {};
          state.sheetData.forEach(row => {
            const key = row[col] || 'EMPTY';
            if (!groups[key]) groups[key] = [];
            groups[key].push(row);
          });

          // Pre-calculate summary
          let totalCartesian = 0;
          let totalUploadRows = 0;
          let totalMIDs = 0;
          if (splitByMID) {
            // Each group is a MID
            for (const mid in groups) {
              const midRows = groups[mid];
              totalUploadRows += midRows.length;
              totalMIDs += 1;
              totalCartesian += midRows.length; // Each MID × its SKUs (1:1)
            }
            statusDiv.innerHTML = `Preparing to process ${Object.keys(groups).length} MIDs.<br>
              Total upload rows: ${totalUploadRows}<br>
              Total MIDs: ${totalMIDs}<br>
              Total cartesian rows: ${totalCartesian}<br>
              <b>Processing...</b>`;
          } else {
            for (const region in groups) {
              const regionRows = groups[region];
              const midsArr = mapData
                .filter(m => m.Region === region)
                .map(m => m.MID)
                .filter(mid => typeof mid === "string" ? mid.trim() !== "" : (mid !== null && mid !== undefined && String(mid).trim() !== ""));
              totalUploadRows += regionRows.length;
              totalMIDs += midsArr.length;
              totalCartesian += regionRows.length * midsArr.length;
            }
            statusDiv.innerHTML = `Preparing to process ${Object.keys(groups).length} regions.<br>
              Total upload rows: ${totalUploadRows}<br>
              Total MIDs: ${totalMIDs}<br>
              Total cartesian rows: ${totalCartesian}<br>
              <b>Processing...</b>`;
          }

          // Create zip with folders for each region or MID
          const zip = new JSZip();
          let fileCount = 0;
          function sanitizeFilename(name) {
            return String(name).replace(/[^a-zA-Z0-9_\-\.]/g, '_').slice(0, 50);
          }

          let regionIndex = 0;
          for (const groupKey in groups) {
            regionIndex++;
            const regionRows = groups[groupKey];
            // If splitByMID, groupKey is MID, else it's region
            const region = groupKey;
            const regionFolder = zip.folder(sanitizeFilename(region));

            // 1. Split upload file (XLSX)
            if (uploads) {
              statusDiv.innerHTML = `Processing region ${regionIndex} of ${Object.keys(groups).length}: <b>${region}</b> (upload rows: ${regionRows.length})...`;
              await new Promise(r => setTimeout(r, 0));
              // --- Custom Upload File Format as XLSX ---
              // 1. Metadata line (single cell, rest empty)
              const now = new Date();
              const isoTimestamp = now.toISOString();
              const metadataLine = [
                "TemplateType=fptcustom",
                "Version=2025.0401",
                "TemplateSignature=Rk9PRA==",
                "settings=attributeRow=3&contentLanguageTag=en_US&dataRow=4&feedType=113&headerLanguageTag=en_US&isEdit=false&isProcessingSummary=false&labelRow=2&metadataVersion=MatprodVm9MVFByb2RfMTIzNA%3D%3D&primaryMarketplaceId=amzn1.mp.o.ATVPDKIKX0DER&ptds=Rk9PRA%3D%3D&reportProvenance=false&templateIdentifier=5dd18c07-9366-4278-8b7c-ed2710400e03&timestamp=2025-04-01T13%3A22%3A35.302Z"
              ];

              // 2. Human-readable labels (array)
              const labelLine = [
                "Product Type", "Seller SKU", "Record Action", "Your Price", "Offering Release Date", "Stop Selling Date",
                "Offering Condition Type", "Main Image URL", "External Product ID", "External Product ID Type", "Quantity"
              ];

              // 3. System column keys (array)
              const keyLine = [
                "feed_product_type", "item_sku", "update_delete", "standard_price", "offering_start_date", "offering_end_date",
                "condition_type", "main_image_url", "external_product_id", "external_product_id_type", "quantity"
              ];

              // 4. Data rows (array of arrays, in order)
              // Helper to robustly format date as YYYY-MM-DD if not blank
              function formatDateYMD(val) {
                if (val === null || val === undefined || String(val).trim() === "") return "";
                let str = String(val).trim();

                // Excel serial date (days since 1899-12-30)
                if (!isNaN(str) && Number(str) > 20000 && Number(str) < 60000) {
                  // Excel's day 1 is 1899-12-31, but JS Date epoch is 1970-01-01
                  // Excel's 0 is 1899-12-30 (due to Lotus 1-2-3 bug)
                  let base = new Date(Date.UTC(1899, 11, 30));
                  let dt = new Date(base.getTime() + Number(str) * 86400000);
                  if (!isNaN(dt)) return dt.toISOString().slice(0, 10);
                }

                // Already in YYYY-MM-DD
                if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

                // UNIX timestamp (seconds or ms)
                if (/^\d{10}$/.test(str)) {
                  // 10 digits: seconds
                  let dt = new Date(Number(str) * 1000);
                  if (!isNaN(dt)) return dt.toISOString().slice(0, 10);
                }
                if (/^\d{13}$/.test(str)) {
                  // 13 digits: ms
                  let dt = new Date(Number(str));
                  if (!isNaN(dt)) return dt.toISOString().slice(0, 10);
                }

                // MM-DD-YYYY or MM/DD/YYYY
                let mdy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
                if (mdy) {
                  let [_, mm, dd, yyyy] = mdy;
                  let dt = new Date(`${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`);
                  if (!isNaN(dt)) return dt.toISOString().slice(0, 10);
                }

                // DD-MM-YYYY or DD/MM/YYYY
                let dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
                if (dmy) {
                  let [_, dd, mm, yyyy] = dmy;
                  // If MM > 12, assume DD-MM-YYYY
                  if (Number(mm) > 12) {
                    let dt = new Date(`${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`);
                    if (!isNaN(dt)) return dt.toISOString().slice(0, 10);
                  }
                }

                // YYYY/MM/DD
                let ymd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
                if (ymd) {
                  let [_, yyyy, mm, dd] = ymd;
                  let dt = new Date(`${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`);
                  if (!isNaN(dt)) return dt.toISOString().slice(0, 10);
                }

                // Try Date.parse fallback
                let parsed = Date.parse(str);
                if (!isNaN(parsed)) {
                  let dt = new Date(parsed);
                  return dt.toISOString().slice(0, 10);
                }
                return str; // fallback: return as-is
              }
              const dataRows = regionRows.map(r => [
                r.feed_product_type ?? "",
                r.item_sku ?? "",
                r.update_delete ?? "",
                r.standard_price ?? "",
                formatDateYMD(r.offering_start_date),
                formatDateYMD(r.offering_end_date),
                r.condition_type ?? "",
                r.main_image_url ?? "",
                r.external_product_id ?? "",
                r.external_product_id_type ?? "",
                r.quantity ?? ""
              ]);

              // Build worksheet as array-of-arrays
              const aoa = [metadataLine, labelLine, keyLine, ...dataRows];
              const ws = XLSX.utils.aoa_to_sheet(aoa);

              // Save as .xlsx
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
              const uploadFname = `${sanitizeFilename(region)}-${sanitizeFilename(suffix)}.xlsx`;
              const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
              regionFolder.file(uploadFname, wbout);
              fileCount++;
            }

            // 2. List of MIDs for the region (CSV)
            let midsArr;
            if (splitByMID) {
              midsArr = [region]; // region is actually MID
            } else {
              midsArr = mapData
                .filter(m => m.Region === region)
                .map(m => m.MID)
                .filter(mid => typeof mid === "string" ? mid.trim() !== "" : (mid !== null && mid !== undefined && String(mid).trim() !== ""));
            }
            if (mids) {
              statusDiv.innerHTML = splitByMID
                ? `Processing MID ${regionIndex} of ${Object.keys(groups).length}: <b>${region}</b>...`
                : `Processing region ${regionIndex} of ${Object.keys(groups).length}: <b>${region}</b> (MIDs: ${midsArr.length})...`;
              await new Promise(r => setTimeout(r, 0));
              // MIDs as XLSX
              const midsSheet = XLSX.utils.aoa_to_sheet([["MID"], ...midsArr.map(mid => [String(mid)])]);
              // Force all MID cells to type "s" (string)
              const midsRange = XLSX.utils.decode_range(midsSheet['!ref']);
              for (let R = 1; R <= midsRange.e.r; ++R) { // skip header row
                const cell = midsSheet['A' + (R + 1)];
                if (cell) cell.t = 's';
              }
              const midsWb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(midsWb, midsSheet, "MIDs");
              const midsFname = `${sanitizeFilename(region)} MIDs.xlsx`;
              const midsWbout = XLSX.write(midsWb, { bookType: 'xlsx', type: 'array' });
              regionFolder.file(midsFname, midsWbout);
              fileCount++;
            }

            // 4. Summary .txt file
            const uniqueSkus = new Set(regionRows.map(r => r.item_sku)).size;
            const uniqueMIDs = new Set(midsArr.map(m => String(m))).size;
            const summaryTxt =
              `Region: ${region}\n` +
              `Number of SKUs in upload file: ${uniqueSkus}\n` +
              `Number of unique MIDs in region: ${uniqueMIDs}\n`;
            regionFolder.file("Summary.txt", summaryTxt);
            fileCount++;

            // 3. Cartesian product: region MIDs × SKUs
            if (cartesian) {
              statusDiv.innerHTML = splitByMID
                ? `Processing MID ${regionIndex} of ${Object.keys(groups).length}: <b>${region}</b> (cartesian rows: ${regionRows.length})...`
                : `Processing region ${regionIndex} of ${Object.keys(groups).length}: <b>${region}</b> (cartesian rows: ${midsArr.length * regionRows.length})...`;
              await new Promise(r => setTimeout(r, 0));
              const regionSkus = regionRows.map(r => ({
                asin: r.external_product_id,
                sku: r.item_sku,
                alternate_tax_code: r.alternate_tax_code
              }));
              const cartesianRows = [];
              if (splitByMID) {
                // Only one MID per group
                regionSkus.forEach(skuRow => {
                  cartesianRows.push({
                    catering_mid: String(region),
                    asin: skuRow.asin,
                    sku: skuRow.sku,
                    alternate_tax_code: skuRow.alternate_tax_code
                  });
                });
              } else {
                midsArr.forEach(mid => {
                  regionSkus.forEach(skuRow => {
                    cartesianRows.push({
                      catering_mid: String(mid),
                      asin: skuRow.asin,
                      sku: skuRow.sku,
                      alternate_tax_code: skuRow.alternate_tax_code
                    });
                  });
                });
              }
              // Cartesian as XLSX
              const cartesianAoa = [
                ["catering_mid", "asin", "sku", "alternate_tax_code"],
                ...cartesianRows.map(row =>
                  [
                    String(row.catering_mid),
                    row.asin,
                    row.sku,
                    row.alternate_tax_code
                  ]
                )
              ];
              const cartesianSheet = XLSX.utils.aoa_to_sheet(cartesianAoa);
              // Force all catering_mid cells to type "s" (string)
              const cartRange = XLSX.utils.decode_range(cartesianSheet['!ref']);
              for (let R = 1; R <= cartRange.e.r; ++R) { // skip header row
                const cell = cartesianSheet['A' + (R + 1)];
                if (cell) cell.t = 's';
              }
              const cartesianWb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(cartesianWb, cartesianSheet, "ATC");
              const cartesianFname = `${sanitizeFilename(region)} ATC File.xlsx`;
              const cartesianWbout = XLSX.write(cartesianWb, { bookType: 'xlsx', type: 'array' });
              regionFolder.file(cartesianFname, cartesianWbout);
              fileCount++;
            }
          }

          // Generate and download zip
          try {
            statusDiv.innerHTML = "Generating zip file (this may take a moment)...";
            await new Promise(r => setTimeout(r, 0));
            const content = await zip.generateAsync({ type: 'blob' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(content);
            let label = '';
            if (uploads && mids && cartesian) label = 'split-upload';
            else if (uploads) label = 'uploads';
            else if (mids) label = 'mids';
            else if (cartesian) label = 'cartesian';
            a.download = `${label}-${col}.zip`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => document.body.removeChild(a), 100);
            // Detailed status message
            let msg = `Created zip with ${Object.keys(groups).length} ${splitByMID ? 'MID' : 'region'} folders, ${fileCount} files total.<br>`;
            for (const groupKey in groups) {
              const regionRows = groups[groupKey];
              let midsArr, cartesianCount;
              if (splitByMID) {
                midsArr = [groupKey];
                cartesianCount = regionRows.length;
              } else {
                midsArr = mapData
                  .filter(m => m.Region === groupKey)
                  .map(m => m.MID)
                  .filter(mid => typeof mid === "string" ? mid.trim() !== "" : (mid !== null && mid !== undefined && String(mid).trim() !== ""));
                cartesianCount = midsArr.length * regionRows.length;
              }
              msg += `<b>${groupKey}</b>: `;
              if (uploads) msg += `${regionRows.length} upload rows, `;
              if (mids) msg += `${midsArr.length} MIDs, `;
              if (cartesian) msg += `${cartesianCount} cartesian rows, `;
              msg = msg.replace(/, $/, '');
              msg += '<br>';
            }
            msg += "Download should start automatically.";
            statusDiv.innerHTML = msg;
          } catch (err) {
            statusDiv.textContent = 'Error creating zip: ' + err.message;
          }
        }

        // Segmented control logic
        regionBtn.addEventListener('click', function() {
          splitByMID = false;
          regionBtn.classList.add('active');
          regionBtn.setAttribute('aria-pressed', 'true');
          midBtn.classList.remove('active');
          midBtn.setAttribute('aria-pressed', 'false');
        });
        midBtn.addEventListener('click', function() {
          splitByMID = true;
          midBtn.classList.add('active');
          midBtn.setAttribute('aria-pressed', 'true');
          regionBtn.classList.remove('active');
          regionBtn.setAttribute('aria-pressed', 'false');
        });

        goBtn.addEventListener('click', function() {
          generateZip({
            uploads: true,
            mids: true,
            cartesian: true,
            suffix: suffixInput.value.trim() || 'upload',
            col: columnSelect.value,
            statusDiv,
            splitByMID: splitByMID
          });
        });

        uploadsOnlyBtn.addEventListener('click', function() {
          generateZip({
            uploads: true,
            mids: false,
            cartesian: false,
            suffix: suffixInput.value.trim() || 'upload',
            col: columnSelect.value,
            statusDiv,
            splitByMID: splitByMID
          });
        });

        midsOnlyBtn.addEventListener('click', function() {
          generateZip({
            uploads: false,
            mids: true,
            cartesian: false,
            suffix: suffixInput.value.trim() || 'upload',
            col: columnSelect.value,
            statusDiv,
            splitByMID: splitByMID
          });
        });

        cartesianOnlyBtn.addEventListener('click', function() {
          generateZip({
            uploads: false,
            mids: false,
            cartesian: true,
            suffix: suffixInput.value.trim() || 'upload',
            col: columnSelect.value,
            statusDiv,
            splitByMID: splitByMID
          });
        });

        // Clean up on panel removal
        root.addEventListener('DOMNodeRemoved', function(e) {
          if (e.target === root && unsub) {
            window.TM_FileState.unsubscribe(unsub);
          }
        });

        // Info icon/modal logic
        const infoIcon = root.querySelector('#split-to-upload-info');
        const infoModal = root.querySelector('#split-to-upload-info-modal');
        const infoClose = root.querySelector('#split-to-upload-info-close');
        infoIcon.onclick = () => { infoModal.style.display = "block"; };
        infoClose.onclick = () => { infoModal.style.display = "none"; };
        window.addEventListener('keydown', function(e) {
          if (e.key === "Escape") infoModal.style.display = "none";
        });

        // Template download logic
        function makeXlsxTemplate(headers, filename) {
          const ws = XLSX.utils.aoa_to_sheet([headers]);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Template");
          const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          const blob = new Blob([wbout], { type: "application/octet-stream" });
          const url = URL.createObjectURL(blob);
          return url;
        }
        setTimeout(() => {
          const uploadTemplate = root.querySelector('#split-to-upload-template-upload');
          const mapTemplate = root.querySelector('#split-to-upload-template-map');
          if (uploadTemplate) {
            uploadTemplate.href = makeXlsxTemplate([
              "feed_product_type", "item_sku", "update_delete", "standard_price", "offering_start_date", "offering_end_date",
              "condition_type", "main_image_url", "external_product_id", "external_product_id_type", "quantity", "alternate_tax_code"
            ], "upload-template.xlsx");
          }
          if (mapTemplate) {
            mapTemplate.href = makeXlsxTemplate([
              "Acro", "Region", "Store name", "MID"
            ], "store-region-mid-template.xlsx");
          }
        }, 500);

        return root;
      }
    });
  });

})();