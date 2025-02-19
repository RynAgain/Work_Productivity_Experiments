import { addATCPropagationToolButton } from '../JS/ATCPropagationToolButton.js';

describe('ATCPropagationToolButton module', () => {
  beforeEach(() => {
    // Clear the document body before each test to ensure a fresh start.
    document.body.innerHTML = '';
  });

  test('should add the ATC Propagation Tool button to the document', () => {
    addATCPropagationToolButton();
    const button = document.getElementById('atcPropagationToolButton');
    expect(button).not.toBeNull();
    expect(button.innerHTML).toBe('ATC Propagation Tool');
  });

  test('should not add the button if it already exists', () => {
    const button = document.createElement('button');
    button.id = 'atcPropagationToolButton';
    document.body.appendChild(button);

    addATCPropagationToolButton();
    const buttons = document.querySelectorAll('#atcPropagationToolButton');
    expect(buttons.length).toBe(1);
  });
});
