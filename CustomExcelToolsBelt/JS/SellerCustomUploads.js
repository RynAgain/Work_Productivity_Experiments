(function() {
  'use strict';

  // Only run on /editor
  if (!/\/editor($|\?)/.test(window.location.pathname)) return;

  // Wait for TM_UI to be ready
  function onReady(fn) {
    if (window.TM_UI) {
      fn();
    } else {
      window.addEventListener('TM_UI_READY', fn, { once: true });
    }
  }

  onReady(function() {
    window.TM_UI.registerPanel({
      id: 'seller-custom-uploads',
      title: 'Seller Custom Uploads',
      render: function() {
        // Panel root
        const root = document.createElement('div');
        root.id = 'seller-custom-uploads-panel';

        // Styles (scoped)
        if (!document.getElementById('seller-custom-uploads-style')) {
          const style = document.createElement('style');
          style.id = 'seller-custom-uploads-style';
          style.textContent = `
            #seller-custom-uploads-panel label {
              font-weight: 500;
              margin-top: 10px;
              display: block;
            }
            #seller-custom-uploads-panel input, #seller-custom-uploads-panel select {
              width: 100%;
              margin-bottom: 10px;
              padding: 7px 10px;
              border: 1px solid #ccc;
              border-radius: 5px;
              font-size: 15px;
            }
            #seller-custom-uploads-panel button {
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
            #seller-custom-uploads-panel button:disabled {
              background: #ccc;
              color: #888;
              cursor: not-allowed;
            }
            #seller-custom-uploads-status {
              color: #004E36;
              font-size: 14px;
              margin-top: 8px;
              min-height: 18px;
            }
            #seller-custom-uploads-panel table {
              border-collapse: collapse;
              width: 100%;
              font-size: 14px;
              margin-top: 12px;
              margin-bottom: 12px;
            }
            #seller-custom-uploads-panel th, #seller-custom-uploads-panel td {
              border: 1px solid #ccc;
              padding: 4px 7px;
              text-align: left;
              max-width: 180px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            #seller-custom-uploads-panel th {
              background: #f2f2f2;
              font-weight: 600;
            }
            #seller-custom-uploads-panel .remove-row-btn {
              background: #b85c00;
              color: #fff;
              border: none;
              border-radius: 4px;
              padding: 4px 10px;
              font-size: 13px;
              cursor: pointer;
              margin: 0;
              width: auto;
              margin-left: 4px;
            }
            #seller-custom-uploads-panel .remove-row-btn:hover {
              background: #e67c00;
            }
          `;
          document.head.appendChild(style);
        }

        // Fields for upload file
        const FIELDS = [
          { key: "feed_product_type", label: "Product Type" },
          { key: "item_sku", label: "Seller SKU" },
          { key: "update_delete", label: "Record Action" },
          { key: "standard_price", label: "Your Price" },
          { key: "offering_start_date", label: "Offering Release Date" },
          { key: "offering_end_date", label: "Stop Selling Date" },
          { key: "condition_type", label: "Offering Condition Type" },
          { key: "main_image_url", label: "Main Image URL" },
          { key: "external_product_id", label: "External Product ID" },
          { key: "external_product_id_type", label: "External Product ID Type" },
          { key: "quantity", label: "Quantity" },
          { key: "alternate_tax_code", label: "Alternate Tax Code" }
        ];

        // State: array of row objects
        // Persistence key
        const PERSIST_KEY = 'seller_custom_upload_rows';
        let rows = [];

        // Load persisted rows on panel render
        try {
          const saved = localStorage.getItem(PERSIST_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) rows = parsed;
          }
        } catch (e) {}

        // Status div
        const statusDiv = document.createElement('div');
        statusDiv.id = 'seller-custom-uploads-status';

        // Form for adding a new row
        const form = document.createElement('form');
        form.style.display = 'grid';
        form.style.gridTemplateColumns = 'repeat(2, 1fr)';
        form.style.gap = '10px 16px';
        form.style.marginBottom = '10px';

        // Store input elements for easy access
        const inputs = {};

        FIELDS.forEach(field => {
          const label = document.createElement('label');
          label.textContent = field.label;
          label.setAttribute('for', 'scu-' + field.key);
          label.style.gridColumn = 'span 1';

          let input;
          // feed_product_type: default "food"
          if (field.key === 'feed_product_type') {
            input = document.createElement('input');
            input.type = 'text';
            input.id = 'scu-' + field.key;
            input.placeholder = field.label;
            input.value = 'food';
            input.style.gridColumn = 'span 1';
          }
          // item_sku: 13 digits, required, leading zeros allowed
          else if (field.key === 'item_sku') {
            // Allow multiple SKUs (comma or newline separated)
            input = document.createElement('textarea');
            input.id = 'scu-' + field.key;
            input.placeholder = 'One or more 13-digit SKUs (comma or newline separated)';
            input.rows = 2;
            input.style.resize = 'vertical';
            input.style.gridColumn = 'span 1';

            // Add convert button and helper
            const convertBtn = document.createElement('button');
            convertBtn.type = 'button';
            convertBtn.textContent = 'Convert to 13-digit SKU';
            convertBtn.style.marginLeft = '6px';
            convertBtn.style.marginBottom = '10px';
            convertBtn.style.background = '#218838';
            convertBtn.style.color = '#fff';
            convertBtn.style.border = 'none';
            convertBtn.style.borderRadius = '4px';
            convertBtn.style.padding = '6px 10px';
            convertBtn.style.fontSize = '13px';
            convertBtn.style.cursor = 'pointer';

            // Helper text
            const helper = document.createElement('div');
            helper.style.fontSize = '12px';
            helper.style.color = '#888';
            helper.style.marginBottom = '6px';
            helper.textContent = 'Enter a short SKU (6-12 digits) and click "Convert" to auto-generate a valid 13-digit SKU (EAN-13).';

            // Conversion logic
            function getUPC(sku) {
              const upc = ('000000000000' + sku).slice(-12);
              return upc;
            }
            function calculateCheckDigit(code) {
              const oddSum = [0, 2, 4, 6, 8, 10].reduce((sum, i) => sum + parseInt(code[i]), 0);
              const evenSum = [1, 3, 5, 7, 9, 11].reduce((sum, i) => sum + parseInt(code[i]), 0);
              const totalSum = oddSum + evenSum * 3;
              const nextTen = Math.ceil(totalSum / 10) * 10;
              return nextTen - totalSum;
            }
            function getEAN(upc) {
              if (upc.length !== 12) {
                return '';
              }
              return upc + calculateCheckDigit(upc);
            }

            convertBtn.onclick = function(e) {
              e.preventDefault();
              // For multiple SKUs, convert each line/entry
              const lines = input.value.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
              if (lines.length === 0) {
                input.value = '';
                input.focus();
                statusDiv.textContent = 'Enter at least one SKU to convert.';
                return;
              }
              let converted = [];
              let failed = [];
              for (const val of lines) {
                const digits = val.replace(/\D/g, '');
                if (!digits || digits.length < 6 || digits.length > 12) {
                  failed.push(val);
                  continue;
                }
                const upc = getUPC(digits);
                const ean = getEAN(upc);
                if (ean.length === 13) {
                  converted.push(ean);
                } else {
                  failed.push(val);
                }
              }
              input.value = converted.join('\n');
              if (failed.length > 0) {
                statusDiv.textContent = `Some SKUs could not be converted: ${failed.join(', ')}`;
              } else {
                statusDiv.textContent = `Converted to 13-digit SKUs.`;
              }
            };

            // Insert helper and button after input
            form.appendChild(label);
            form.appendChild(input);
            form.appendChild(convertBtn);
            form.appendChild(helper);
            // Skip default append below
            inputs[field.key] = input;
            return;
          }
          // update_delete: dropdown
          else if (field.key === 'update_delete') {
            input = document.createElement('select');
            input.id = 'scu-' + field.key;
            input.style.gridColumn = 'span 1';
            ['Delete', 'PartialUpdate'].forEach(optVal => {
              const opt = document.createElement('option');
              opt.value = optVal;
              opt.textContent = optVal;
              input.appendChild(opt);
            });
          }
          // offering_start_date / offering_end_date: date input
          else if (field.key === 'offering_start_date' || field.key === 'offering_end_date') {
            input = document.createElement('input');
            input.type = 'date';
            input.id = 'scu-' + field.key;
            input.placeholder = field.label;
            input.style.gridColumn = 'span 1';
          }
          // condition_type: always "New", read-only
          else if (field.key === 'condition_type') {
            input = document.createElement('input');
            input.type = 'text';
            input.id = 'scu-' + field.key;
            input.value = 'New';
            input.readOnly = true;
            input.style.background = '#f2f2f2';
            input.style.gridColumn = 'span 1';
          }
          // standard_price, quantity: number
          else if (field.key === 'standard_price' || field.key === 'quantity') {
            input = document.createElement('input');
            input.type = 'number';
            input.step = 'any';
            input.min = '0';
            input.id = 'scu-' + field.key;
            input.placeholder = field.label;
            input.style.gridColumn = 'span 1';
          }
          // default: text
          else {
            input = document.createElement('input');
            input.type = 'text';
            input.id = 'scu-' + field.key;
            input.placeholder = field.label;
            input.style.gridColumn = 'span 1';
          }

          inputs[field.key] = input;
          form.appendChild(label);
          form.appendChild(input);
        });

        // Add Row button
        const addRowBtn = document.createElement('button');
        addRowBtn.type = 'submit';
        addRowBtn.textContent = 'Add Row';
        addRowBtn.style.gridColumn = 'span 2';

        form.appendChild(addRowBtn);

        // Table for displaying entered rows
        const tableDiv = document.createElement('div');

        // Download button
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'Download Upload File (.xlsx)';
        downloadBtn.style.marginTop = '10px';
        downloadBtn.disabled = true;

        // Handle form submit (add row)
        form.onsubmit = function(e) {
          e.preventDefault();
          // Gather values for all fields except item_sku
          const baseRow = {};
          let hasValue = false;

          FIELDS.forEach(field => {
            if (field.key === 'item_sku') return;
            let val = inputs[field.key].value;
            // feed_product_type: default to "food" if blank
            if (field.key === 'feed_product_type' && !val) {
              val = 'food';
            }
            // condition_type: always "New"
            if (field.key === 'condition_type') {
              val = 'New';
            }
            // Dates: store as entered, format on output
            if (inputs[field.key] && inputs[field.key].type === 'date' && val) {
              val = val;
            }
            if (val !== '') hasValue = true;
            baseRow[field.key] = val;
          });

          // Handle multiple SKUs
          const skuRaw = inputs['item_sku'].value;
          const skuList = skuRaw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
          if (skuList.length === 0) {
            statusDiv.textContent = 'Please enter at least one SKU.';
            return;
          }
          let invalid = skuList.filter(sku => !/^\d{13}$/.test(sku));
          if (invalid.length > 0) {
            statusDiv.textContent = 'All SKUs must be exactly 13 digits (including leading zeros). Invalid: ' + invalid.join(', ');
            return;
          }

          // Add a row for each SKU
          for (const sku of skuList) {
            rows.push({ ...baseRow, item_sku: sku });
          }

          // Clear inputs, except for feed_product_type and condition_type
          FIELDS.forEach(field => {
            if (field.key === 'feed_product_type') {
              inputs[field.key].value = 'food';
            } else if (field.key === 'condition_type') {
              inputs[field.key].value = 'New';
            } else {
              inputs[field.key].value = '';
            }
          });
          statusDiv.textContent = '';
          // Persist rows after add
          try {
            localStorage.setItem(PERSIST_KEY, JSON.stringify(rows));
          } catch (e) {}
          renderTable();
          renderCustomPreview();
        };

        // Render table of rows
        function renderTable() {
          if (rows.length === 0) {
            tableDiv.innerHTML = '<div style="color:#888;">No rows added yet.</div>';
            downloadBtn.disabled = true;
            // Persist empty
            try { localStorage.setItem(PERSIST_KEY, JSON.stringify([])); } catch (e) {}
            renderCustomPreview();
            return;
          }
          let html = '<table><thead><tr>';
          FIELDS.forEach(field => {
            html += `<th>${field.label}</th>`;
          });
          html += '<th>Remove</th></tr></thead><tbody>';
          rows.forEach((row, idx) => {
            html += '<tr>';
            FIELDS.forEach(field => {
              html += `<td>${row[field.key] || ''}</td>`;
            });
            html += `<td><button class="remove-row-btn" data-idx="${idx}" title="Remove row">&times;</button></td>`;
            html += '</tr>';
          });
          html += '</tbody></table>';
          tableDiv.innerHTML = html;
          downloadBtn.disabled = false;

          // Persist rows after change
          try {
            localStorage.setItem(PERSIST_KEY, JSON.stringify(rows));
          } catch (e) {}

          // Attach remove handlers
          Array.from(tableDiv.querySelectorAll('.remove-row-btn')).forEach(btn => {
            btn.onclick = function(e) {
              e.preventDefault();
              const idx = parseInt(btn.getAttribute('data-idx'), 10);
              if (!isNaN(idx)) {
                rows.splice(idx, 1);
                renderTable();
                renderCustomPreview();
              }
            };
          });
          renderCustomPreview();
        }

        // Download handler
        downloadBtn.onclick = function(e) {
          e.preventDefault();
          if (rows.length === 0) {
            statusDiv.textContent = 'No rows to download.';
            return;
          }
          // Build upload file format: metadata, label, key, data rows
          const now = new Date();
          const isoTimestamp = now.toISOString();
          const metadataLine = [
            "TemplateType=fptcustom",
            "Version=2025.0401",
            "TemplateSignature=Rk9PRA==",
            "settings=attributeRow=3&contentLanguageTag=en_US&dataRow=4&feedType=113"
          ];
          const labelLine = FIELDS.map(f => f.label);
          const keyLine = FIELDS.map(f => f.key);
          // Format dates as mm/dd/yyyy
          function formatDate(val) {
            if (!val) return "";
            // val is yyyy-mm-dd
            const parts = val.split('-');
            if (parts.length === 3) {
              return `${parts[1].padStart(2, '0')}/${parts[2].padStart(2, '0')}/${parts[0]}`;
            }
            return val;
          }
          const dataRows = rows.map(r => FIELDS.map(f => {
            if (f.key === 'offering_start_date' || f.key === 'offering_end_date') {
              return formatDate(r[f.key]);
            }
            if (f.key === 'feed_product_type') {
              return r[f.key] || 'food';
            }
            if (f.key === 'condition_type') {
              return 'New';
            }
            return r[f.key] ?? "";
          }));
          const aoa = [metadataLine, labelLine, keyLine, ...dataRows];
          const ws = XLSX.utils.aoa_to_sheet(aoa);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
          XLSX.writeFile(wb, 'custom-upload.xlsx');
          statusDiv.textContent = 'File downloaded: custom-upload.xlsx';
        };

        // Clear Data button
        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear Data';
        clearBtn.style.background = '#b85c00';
        clearBtn.style.color = '#fff';
        clearBtn.style.border = 'none';
        clearBtn.style.borderRadius = '5px';
        clearBtn.style.padding = '10px 0';
        clearBtn.style.fontSize = '16px';
        clearBtn.style.cursor = 'pointer';
        clearBtn.style.width = '100%';
        clearBtn.style.marginTop = '10px';
        clearBtn.onclick = function(e) {
          e.preventDefault();
          rows = [];
          try { localStorage.removeItem(PERSIST_KEY); } catch (e) {}
          renderTable();
          renderCustomPreview();
          statusDiv.textContent = 'Data cleared.';
        };

        // --- Custom Preview in right panel ---
        function renderCustomPreview() {
          // Only show if this panel is active
          if (!window.TM_UI || !window.TM_UI.getPanels) return;
          const panels = window.TM_UI.getPanels();
          const active = panels.find(p => p.id === 'seller-custom-uploads');
          // Try to detect if this panel is active
          let isActive = false;
          try {
            // Find the sidebar button with active class
            const btns = document.querySelectorAll('.tm-ui-feature-btn.active');
            btns.forEach(btn => {
              if (btn.textContent.trim() === 'Seller Custom Uploads') isActive = true;
            });
          } catch (e) {}
          const preview = document.getElementById('tm-file-preview');
          if (!preview) return;
          if (!isActive) {
            // Restore standard preview if needed
            if (preview.dataset.scuCustom === "1") {
              preview.innerHTML = '';
              delete preview.dataset.scuCustom;
              if (window.TM_RefreshPreview) window.TM_RefreshPreview();
            }
            return;
          }
          // Replace preview with custom table
          preview.innerHTML = '';
          preview.dataset.scuCustom = "1";
          const title = document.createElement('h3');
          title.textContent = 'Custom Upload Preview';
          preview.appendChild(title);
          if (rows.length === 0) {
            const empty = document.createElement('div');
            empty.style.color = '#888';
            empty.textContent = 'No rows to preview.';
            preview.appendChild(empty);
            return;
          }
          const table = document.createElement('table');
          const thead = document.createElement('thead');
          const headerRow = document.createElement('tr');
          FIELDS.forEach(f => {
            const th = document.createElement('th');
            th.textContent = f.label;
            headerRow.appendChild(th);
          });
          thead.appendChild(headerRow);
          table.appendChild(thead);
          const tbody = document.createElement('tbody');
          rows.forEach((r, rowIdx) => {
            const tr = document.createElement('tr');
            FIELDS.forEach(f => {
              const td = document.createElement('td');
              td.contentEditable = "true";
              td.textContent = r[f.key] || '';
              td.style.background = "#fff";
              td.style.cursor = "text";
              td.addEventListener('blur', function() {
                const newVal = td.textContent.trim();
                // Validate SKU
                if (f.key === 'item_sku' && !/^\d{13}$/.test(newVal)) {
                  td.style.background = "#ffe0e0";
                  statusDiv.textContent = 'SKU must be exactly 13 digits.';
                  td.textContent = r[f.key] || '';
                  return;
                }
                // Validate update_delete
                if (f.key === 'update_delete' && newVal && !['Delete', 'PartialUpdate'].includes(newVal)) {
                  td.style.background = "#ffe0e0";
                  statusDiv.textContent = 'Record Action must be "Delete" or "PartialUpdate".';
                  td.textContent = r[f.key] || '';
                  return;
                }
                // Validate dates
                if ((f.key === 'offering_start_date' || f.key === 'offering_end_date') && newVal && !/^\d{2}\/\d{2}\/\d{4}$/.test(newVal)) {
                  td.style.background = "#ffe0e0";
                  statusDiv.textContent = 'Date must be in mm/dd/yyyy format.';
                  td.textContent = r[f.key] || '';
                  return;
                }
                // Always "New" for condition_type
                if (f.key === 'condition_type') {
                  td.textContent = 'New';
                  return;
                }
                // Save edit
                rows[rowIdx][f.key] = newVal;
                try { localStorage.setItem(PERSIST_KEY, JSON.stringify(rows)); } catch (e) {}
                td.style.background = "#fff";
                statusDiv.textContent = '';
              });
              td.addEventListener('keydown', function(ev) {
                if (ev.key === 'Enter') {
                  ev.preventDefault();
                  td.blur();
                }
              });
              tr.appendChild(td);
            });
            tbody.appendChild(tr);
          });
          table.appendChild(tbody);
          preview.appendChild(table);
        }

        // Initial render
        renderTable();
        renderCustomPreview();

        // Compose UI
        root.appendChild(form);
        root.appendChild(tableDiv);
        root.appendChild(downloadBtn);
        root.appendChild(clearBtn);
        root.appendChild(statusDiv);

        // Listen for panel switches to update preview
        setTimeout(() => {
          // Listen for sidebar button clicks
          document.querySelectorAll('.tm-ui-feature-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              setTimeout(renderCustomPreview, 100);
            });
          });
        }, 500);

        return root;
      }
    });
  });
})();