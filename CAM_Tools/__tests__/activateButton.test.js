import '../jest.setup.js';
import { addActivateButton } from '../JS/activateButton.js';

describe('activateButton module', () => {
  beforeEach(() => {
    // Clear the document body before each test to ensure a fresh start.
    document.body.innerHTML = '';
  });

  test('should add the activate button to the document', () => {
    addActivateButton();
    const button = document.getElementById('activateButton');
    expect(button).not.toBeNull();
    expect(button.innerHTML).toBe('Activate/Deactivate Item(s)');
  });

  test('should not add the button if it already exists', () => {
    const button = document.createElement('button');
    button.id = 'activateButton';
    document.body.appendChild(button);

    addActivateButton();
    const buttons = document.querySelectorAll('#activateButton');
    expect(buttons.length).toBe(1);
  });
});
