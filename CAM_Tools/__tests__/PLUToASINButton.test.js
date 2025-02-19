import { addPLUToASINFunctionality } from '../JS/PLUToASINButton.js';

describe('PLUToASINButton module', () => {
  beforeEach(() => {
    // Clear the document body before each test to ensure a fresh start.
    document.body.innerHTML = '';
  });

  test('should add the PLU to ASIN button to the document', () => {
    addPLUToASINFunctionality();
    const button = document.getElementById('pluToAsinButton');
    expect(button).not.toBeNull();
    expect(button.innerHTML).toBe('PLU to ASIN');
  });

  test('should not add the button if it already exists', () => {
    const button = document.createElement('button');
    button.id = 'pluToAsinButton';
    document.body.appendChild(button);

    addPLUToASINFunctionality();
    const buttons = document.querySelectorAll('#pluToAsinButton');
    expect(buttons.length).toBe(1);
  });
});
