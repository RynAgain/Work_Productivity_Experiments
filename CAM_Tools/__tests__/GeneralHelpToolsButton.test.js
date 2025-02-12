import { addGeneralHelpToolsButton } from '../JS/GeneralHelpToolsButton.js';

describe('GeneralHelpToolsButton module', () => {
  beforeEach(() => {
    // Clear the document body before each test to ensure a fresh start.
    document.body.innerHTML = '';
  });

  test('should add the general help tools button to the document', () => {
    addGeneralHelpToolsButton();
    const button = document.getElementById('generalHelpToolsButton');
    expect(button).not.toBeNull();
    expect(button.innerHTML).toBe('General Help Tools');
  });

  test('should not add the button if it already exists', () => {
    const button = document.createElement('button');
    button.id = 'generalHelpToolsButton';
    document.body.appendChild(button);

    addGeneralHelpToolsButton();
    const buttons = document.querySelectorAll('#generalHelpToolsButton');
    expect(buttons.length).toBe(1);
  });
});
