import { addAddItemButton } from '../JS/AddItemButton.js';

describe('AddItemButton module', () => {
  beforeEach(() => {
    // Clear the document body before each test to ensure a fresh start.
    document.body.innerHTML = '';
  });

  test('should add the add item button to the document', () => {
    addAddItemButton();
    const button = document.getElementById('addItemButton');
    expect(button).not.toBeNull();
    expect(button.innerHTML).toBe('Add New Item(s)');
  });

  test('should not add the button if it already exists', () => {
    const button = document.createElement('button');
    button.id = 'addItemButton';
    document.body.appendChild(button);

    addAddItemButton();
    const buttons = document.querySelectorAll('#addItemButton');
    expect(buttons.length).toBe(1);
  });
});
