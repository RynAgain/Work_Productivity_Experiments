import { addMassUploaderFunctionality } from '../JS/MassUploaderButton.js';

describe('MassUploaderButton module', () => {
  beforeEach(() => {
    // Clear the document body before each test to ensure a fresh start.
    document.body.innerHTML = '';
  });

  test('should add the Mass Uploader button to the document', () => {
    addMassUploaderFunctionality();
    const button = document.getElementById('massUploaderButton');
    expect(button).not.toBeNull();
    expect(button.innerHTML).toBe('Mass Upload');
  });

  test('should not add the button if it already exists', () => {
    const button = document.createElement('button');
    button.id = 'massUploaderButton';
    document.body.appendChild(button);

    addMassUploaderFunctionality();
    const buttons = document.querySelectorAll('#massUploaderButton');
    expect(buttons.length).toBe(1);
  });
});
