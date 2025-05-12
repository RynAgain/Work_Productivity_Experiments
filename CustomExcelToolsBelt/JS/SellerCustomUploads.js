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
        let rows = [];

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
            input = document.createElement('input');
            input.type = 'text';
            input.id = 'scu-' + field.key;
            input.placeholder = '13-digit SKU (e.g. 0001234567890)';
            input.maxLength = 13;
            input.pattern = '\\d{13}';
            input.autocomplete = 'off';
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
              const val = input.value.replace(/\D/g, '');
              if (!val || val.length < 6 || val.length > 12) {
                input.value = '';
                input.focus();
                statusDiv.textContent = 'Enter a numeric SKU between 6 and 12 digits to convert.';
                return;
              }
              const upc = getUPC(val);
              const ean = getEAN(upc);
              if (ean.length === 13) {
                input.value = ean;
                statusDiv.textContent = 'Converted to 13-digit SKU: ' + ean;
              } else {
                statusDiv.textContent = 'Could not convert to 13-digit SKU.';
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
          // Gather values
          const row = {};
          let hasValue = false;
          let errorMsg = '';

          FIELDS.forEach(field => {
            let val = inputs[field.key].value;

            // item_sku: must be exactly 13 digits, not blank
            if (field.key === 'item_sku') {
              if (!val || !/^\d{13}$/.test(val)) {
                errorMsg = 'Seller SKU must be exactly 13 digits (including leading zeros).';
              }
            }

            // feed_product_type: default to "food" if blank
            if (field.key === 'feed_product_type' && !val) {
              val = 'food';
            }

            // condition_type: always "New"
            if (field.key === 'condition_type') {
              val = 'New';
            }

            // Dates: store as entered, format on output
            if (inputs[field.key].type === 'date' && val) {
              // Store as yyyy-mm-dd, format on output
              val = val;
            }

            if (val !== '') hasValue = true;
            row[field.key] = val;
          });

          if (errorMsg) {
            statusDiv.textContent = errorMsg;
            return;
          }
          if (!hasValue) {
            statusDiv.textContent = 'Please enter at least one value to add a row.';
            return;
          }
          rows.push(row);
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
          renderTable();
        };

        // Render table of rows
        function renderTable() {
          if (rows.length === 0) {
            tableDiv.innerHTML = '<div style="color:#888;">No rows added yet.</div>';
            downloadBtn.disabled = true;
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

          // Attach remove handlers
          Array.from(tableDiv.querySelectorAll('.remove-row-btn')).forEach(btn => {
            btn.onclick = function(e) {
              e.preventDefault();
              const idx = parseInt(btn.getAttribute('data-idx'), 10);
              if (!isNaN(idx)) {
                rows.splice(idx, 1);
                renderTable();
              }
            };
          });
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
            "TemplateType=fptcustom Version=2025.0401 TemplateSignature=Rk9PRA== " +
            "settings=attributeRow=3&contentLanguageTag=en_US&dataRow=4&feedType=113&headerLanguageTag=en_US&isEdit=false&isProcessingSummary=false&labelRow=2&metadataVersion=MatprodVm9MVFByb2RfMTIzNA%3D%3D&primaryMarketplaceId=amzn1.mp.o.ATVPDKIKX0DER&ptds=Rk9PRA%3D%3D&reportProvenance=false&templateIdentifier=5dd18c07-9366-4278-8b7c-ed2710400e03&timestamp=" + isoTimestamp
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

        // Initial render
        renderTable();

        // Compose UI
        root.appendChild(form);
        root.appendChild(tableDiv);
        root.appendChild(downloadBtn);
        root.appendChild(statusDiv);

        return root;
      }
    });
  });
})();