
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
          `;
          document.head.appendChild(style);
        }

        // Panel HTML
        root.innerHTML = `
          <h3 style="margin-top:0;margin-bottom:12px;">Split To Upload Files</h3>
          <div id="split-to-upload-warning" style="color:#b85c00;font-weight:bold;margin-bottom:8px;display:none;"></div>
          <label for="split-to-upload-map">Store-Region-ID Map File (.csv, .xlsx, .xls)</label>
          <input type="file" id="split-to-upload-map" accept=".csv,.xlsx,.xls" aria-label="Store-Region-ID Map File" />
          <div id="split-to-upload-map-status" style="font-size:13px;color:#004E36;margin-bottom:8px;"></div>
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
        let mapData = null;

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
        async function generateZip({ uploads = false, mids = false, cartesian = false, suffix, col, statusDiv }) {
          const state = window.TM_FileState.getState();
          if (!state.sheetData || !col) {
            statusDiv.textContent = 'No data or column selected. Please upload a file and select a column.';
            return;
          }
          if (!mapData) {
            statusDiv.textContent = 'No valid Store-Region-MID map file loaded.';
            return;
          }

          // Group rows by region (split column)
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

          // Create zip with folders for each region
          const zip = new JSZip();
          let fileCount = 0;
          function sanitizeFilename(name) {
            return String(name).replace(/[^a-zA-Z0-9_\-\.]/g, '_').slice(0, 50);
          }

          let regionIndex = 0;
          for (const region in groups) {
            regionIndex++;
            const regionRows = groups[region];
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
                "TemplateType=fptcustom Version=2025.0401 TemplateSignature=Rk9PRA== " +
                "settings=attributeRow=3&contentLanguageTag=en_US&dataRow=4&feedType=113&headerLanguageTag=en_US&isEdit=false&isProcessingSummary=false&labelRow=2&metadataVersion=MatprodVm9MVFByb2RfMTIzNA%3D%3D&primaryMarketplaceId=amzn1.mp.o.ATVPDKIKX0DER&ptds=Rk9PRA%3D%3D&reportProvenance=false&templateIdentifier=5dd18c07-9366-4278-8b7c-ed2710400e03&timestamp=" + isoTimestamp
              ];

              // 2. Human-readable labels (array)
              const labelLine = [
                "Product Type", "Seller SKU", "Record Action", "Your Price", "Offering Release Date", "Stop Selling Date",
                "Offering Condition Type", "Main Image URL", "External Product ID", "External Product ID Type", "Quantity", "ATC"
              ];

              // 3. System column keys (array)
              const keyLine = [
                "feed_product_type", "item_sku", "update_delete", "standard_price", "offering_start_date", "offering_end_date",
                "condition_type", "main_image_url", "external_product_id", "external_product_id_type", "quantity", "alternate_tax_code"
              ];

              // 4. Data rows (array of arrays, in order)
              const dataRows = regionRows.map(r => [
                r.feed_product_type ?? "",
                r.item_sku ?? "",
                r.update_delete ?? "",
                r.standard_price ?? "",
                r.offering_start_date ?? "",
                r.offering_end_date ?? "",
                r.condition_type ?? "",
                r.main_image_url ?? "",
                r.external_product_id ?? "",
                r.external_product_id_type ?? "",
                r.quantity ?? "",
                r.alternate_tax_code ?? ""
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
            const midsArr = mapData
              .filter(m => m.Region === region)
              .map(m => m.MID)
              .filter(mid => typeof mid === "string" ? mid.trim() !== "" : (mid !== null && mid !== undefined && String(mid).trim() !== ""));
            if (mids) {
              statusDiv.innerHTML = `Processing region ${regionIndex} of ${Object.keys(groups).length}: <b>${region}</b> (MIDs: ${midsArr.length})...`;
              await new Promise(r => setTimeout(r, 0));
              // Force MID as string in CSV: ="MID"
              // MIDs as XLSX
              const midsSheet = XLSX.utils.aoa_to_sheet([["MID"], ...midsArr.map(mid => ['="' + String(mid) + '"'])]);
              const midsWb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(midsWb, midsSheet, "MIDs");
              const midsFname = `${sanitizeFilename(region)} MIDs.xlsx`;
              const midsWbout = XLSX.write(midsWb, { bookType: 'xlsx', type: 'array' });
              regionFolder.file(midsFname, midsWbout);
              fileCount++;
            }

            // 3. Cartesian product: region MIDs × SKUs
            if (cartesian) {
              statusDiv.innerHTML = `Processing region ${regionIndex} of ${Object.keys(groups).length}: <b>${region}</b> (cartesian rows: ${midsArr.length * regionRows.length})...`;
              await new Promise(r => setTimeout(r, 0));
              const regionSkus = regionRows.map(r => ({
                asin: r.external_product_id,
                sku: r.item_sku,
                alternate_tax_code: r.alternate_tax_code
              }));
              const cartesianRows = [];
              midsArr.forEach(mid => {
                regionSkus.forEach(skuRow => {
                  cartesianRows.push({
                    catering_mid: "'" + String(mid),
                    asin: skuRow.asin,
                    sku: skuRow.sku,
                    alternate_tax_code: skuRow.alternate_tax_code
                  });
                });
              });
              // Write as CSV
              // Cartesian as XLSX
              const cartesianAoa = [
                ["catering_mid", "asin", "sku", "alternate_tax_code"],
                ...cartesianRows.map(row =>
                  [
                    '="' + String(row.catering_mid) + '"',
                    row.asin,
                    row.sku,
                    row.alternate_tax_code
                  ]
                )
              ];
              const cartesianSheet = XLSX.utils.aoa_to_sheet(cartesianAoa);
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
            let msg = `Created zip with ${Object.keys(groups).length} region folders, ${fileCount} files total.<br>`;
            for (const region in groups) {
              const regionRows = groups[region];
              const midsArr = mapData
                .filter(m => m.Region === region)
                .map(m => m.MID)
                .filter(mid => typeof mid === "string" ? mid.trim() !== "" : (mid !== null && mid !== undefined && String(mid).trim() !== ""));
              const cartesianCount = midsArr.length * regionRows.length;
              msg += `<b>${region}</b>: `;
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

        goBtn.addEventListener('click', function() {
          generateZip({
            uploads: true,
            mids: true,
            cartesian: true,
            suffix: suffixInput.value.trim() || 'upload',
            col: columnSelect.value,
            statusDiv
          });
        });

        uploadsOnlyBtn.addEventListener('click', function() {
          generateZip({
            uploads: true,
            mids: false,
            cartesian: false,
            suffix: suffixInput.value.trim() || 'upload',
            col: columnSelect.value,
            statusDiv
          });
        });

        midsOnlyBtn.addEventListener('click', function() {
          generateZip({
            uploads: false,
            mids: true,
            cartesian: false,
            suffix: suffixInput.value.trim() || 'upload',
            col: columnSelect.value,
            statusDiv
          });
        });

        cartesianOnlyBtn.addEventListener('click', function() {
          generateZip({
            uploads: false,
            mids: false,
            cartesian: true,
            suffix: suffixInput.value.trim() || 'upload',
            col: columnSelect.value,
            statusDiv
          });
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