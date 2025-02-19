import { addPLUDedupeListFunctionality } from '../JS/PLUDedupeListButton.js';

describe('PLUDedupeListButton module', () => {
  beforeEach(() => {
    // Clear the document body before each test to ensure a fresh start.
    document.body.innerHTML = '';
  });

  test('should add the PLU Dedupe & List button to the document', () => {
    addPLUDedupeListFunctionality();
    const button = document.getElementById('pluDedupeListButton');
    expect(button).not.toBeNull();
    expect(button.innerHTML).toBe('PLU Dedupe & List');
  });

  test('should not add the button if it already exists', () => {
    const button = document.createElement('button');
    button.id = 'pluDedupeListButton';
    document.body.appendChild(button);

    addPLUDedupeListFunctionality();
    const buttons = document.querySelectorAll('#pluDedupeListButton');
    expect(buttons.length).toBe(1);
  });
});
