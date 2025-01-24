// Create a button element
const button = document.createElement('button');
button.innerText = 'Inventory to Upload Converter';

// Style the button
button.style.position = 'fixed';
button.style.bottom = '10px';
button.style.left = '10px';
button.style.zIndex = '1000';
button.style.padding = '10px 20px';
button.style.backgroundColor = '#007bff';
button.style.color = '#fff';
button.style.border = 'none';
button.style.borderRadius = '5px';
button.style.cursor = 'pointer';

button.addEventListener('click', function() {
    // Logic to read and process XLSX files
    console.log('Button clicked. Processing XLSX files...');
    // Placeholder for XLSX processing logic
    // Use a library like xlsx to read the Excel file
    // Example: const workbook = XLSX.readFile('path/to/input.xlsx');

    // Iterate over each sheet
    // Example: workbook.SheetNames.forEach(sheetName => {
    //     const sheet = workbook.Sheets[sheetName];
    //     const data = XLSX.utils.sheet_to_json(sheet);
    //     // Process data and map to upload format
    // });

    // Example mapping logic
    // const uploadData = data.map(item => ({
    //     'Store - 3 Letter Code': item['Store Code'],
    //     'Item Name': item['Item Name'],
    //     'Item PLU/UPC': item['UPC'],
    //     'Availability': 'Unlimited', // or other logic
    //     'Current Inventory': item['Inventory'],
    //     // Add other fields as needed
    // }));

    // Output the transformed data
    // Example: console.log(uploadData);
});

// Append the button to the body
document.body.appendChild(button);
