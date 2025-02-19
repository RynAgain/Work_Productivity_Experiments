import { addMeatInventoryToUploadConverterFunctionality } from '../JS/MeatInventoryToUploadConverter.js';

describe('MeatInventoryToUploadConverter module', () => {
  beforeEach(() => {
    // Clear the document body before each test to ensure a fresh start.
    document.body.innerHTML = '';
  });

  test('should add the Meat Inventory to Upload Converter button to the document', () => {
    addMeatInventoryToUploadConverterFunctionality();
    const button = document.getElementById('meatInventoryToUploadConverterButton');
    expect(button).not.toBeNull();
    expect(button.innerHTML).toBe('Meat Inventory to Upload Converter');
  });

  test('should not add the button if it already exists', () => {
    const button = document.createElement('button');
    button.id = 'meatInventoryToUploadConverterButton';
    document.body.appendChild(button);

    addMeatInventoryToUploadConverterFunctionality();
    const buttons = document.querySelectorAll('#meatInventoryToUploadConverterButton');
    expect(buttons.length).toBe(1);
  });
});
