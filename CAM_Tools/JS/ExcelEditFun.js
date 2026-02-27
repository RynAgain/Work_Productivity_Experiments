// ==UserScript==
 // @name         Excel Edit Fun
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Excel explode column utility for /editor page
// @match        https://*.cam.wfm.amazon.dev/editor*
// @require      https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.0/xlsx.full.min.js
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  // Only run on /editor
  if (!/\/editor($|\?)/.test(window.location.pathname)) return;

  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    #excel-edit-fun-container {
      position: fixed;
      top: 60px;
      right: 40px;
      background: #1a1a1a;
      border: 1px solid #303030;
      color: #f1f1f1;
      border-radius: 10px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.13);
      padding: 24px 28px 20px 28px;
      z-index: 9999;
      min-width: 340px;
      font-family: 'Segoe UI', Arial, sans-serif;
    }
    #excel-edit-fun-container label {
      font-weight: 500;
      margin-top: 10px;
      display: block;
    }
    #excel-edit-fun-container input, #excel-edit-fun-container select {
      width: 100%;
      margin-bottom: 10px;
      padding: 7px 10px;
      border: 1px solid #ccc;
      border-radius: 5px;
      font-size: 15px;
    }
    #excel-edit-fun-container button {
      background: var(--tm-accent-primary, #3ea6ff);
      color: #0f0f0f;
      border: none;
      border-radius: 5px;
      padding: 10px 0;
      font-size: 16px;
      cursor: pointer;
      width: 100%;
      margin-top: 10px;
      transition: background 0.2s;
    }
    #excel-edit-fun-container button:hover {
      background: #218838;
    }
    #excel-edit-fun-container .row {
      margin-bottom: 10px;
    }
    #excel-edit-fun-status {
      color: #004E36;
      font-size: 14px;
      margin-top: 8px;
      min-height: 18px;
    }
  `;
  document.head.appendChild(style);

  // Create container
  const container = document.createElement('div');
  container.id = 'excel-edit-fun-container';
  container.innerHTML = `
    <h3 style="margin-top:0;margin-bottom:12px;">Excel Explode Column</h3>
    <label>Excel File (.xlsx, .xls, .csv)</label>
    <input type="file" id="eef-file" accept=".xlsx,.xls,.csv" />
    <label>Sheet</label>
    <select id="eef-sheet" disabled>
      <option value="">Select sheet</option>
    </select>
    <label>Column</label>
    <select id="eef-column" disabled>
      <option value="">Select column</option>
    </select>
    <label>Delimiter</label>
    <input type="text" id="eef-delim" value="," maxlength="5" />
    <label>Output File Name</label>
    <input type="text" id="eef-filename" value="exploded.xlsx" />
    <button id="eef-explode" disabled>Explode & Download</button>
    <div id="excel-edit-fun-status"></div>
  `;
  document.body.appendChild(container);

  // Elements
  const fileInput = document.getElementById('eef-file');
  const sheetSelect = document.getElementById('eef-sheet');
  const columnSelect = document.getElementById('eef-column');
  const delimInput = document.getElementById('eef-delim');
  const filenameInput = document.getElementById('eef-filename');
  const explodeBtn = document.getElementById('eef-explode');
  const statusDiv = document.getElementById('excel-edit-fun-status');

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

})();