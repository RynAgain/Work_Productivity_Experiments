import { addRedriveButton } from '../JS/RedriveButton.js';

describe('RedriveButton module', () => {
  beforeEach(() => {
    // Clear the document body before each test to ensure a fresh start.
    document.body.innerHTML = '';
  });

  test('should add the Redrive button to the document', () => {
    addRedriveButton();
    const button = document.getElementById('redriveButton');
    expect(button).not.toBeNull();
    expect(button.innerHTML).toBe('Redrive');
  });

  test('should not add the button if it already exists', () => {
    const button = document.createElement('button');
    button.id = 'redriveButton';
    document.body.appendChild(button);

    addRedriveButton();
    const buttons = document.querySelectorAll('#redriveButton');
    expect(buttons.length).toBe(1);
  });
});
