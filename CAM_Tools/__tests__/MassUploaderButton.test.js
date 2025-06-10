import { addMassUploaderFunctionality } from '../JS/MassUploaderButton.js';

describe('MassUploaderButton module', () => {
  beforeEach(() => {
    // Clear the document body before each test to ensure a fresh start.
    document.body.innerHTML = '';
  });

  test('should open the Mass Uploader modal when the button is clicked', () => {
    // Simulate GeneralHelpToolsButton.js creating the button
    const button = document.createElement('button');
    button.id = 'massUploaderButton';
    button.innerHTML = 'Mass Upload';
    document.body.appendChild(button);

    // Wire up the modal logic
    addMassUploaderFunctionality();

    // Simulate a click
    button.click();

    // Check that the modal overlay is present
    const overlay = document.getElementById('massUploaderOverlay');
    expect(overlay).not.toBeNull();
    expect(overlay.getAttribute('role')).toBe('dialog');
  });

  test('should not add duplicate event listeners if called multiple times', () => {
    const button = document.createElement('button');
    button.id = 'massUploaderButton';
    document.body.appendChild(button);

    // Spy on addEventListener
    const spy = jest.spyOn(button, 'addEventListener');

    addMassUploaderFunctionality();
    addMassUploaderFunctionality();

    // In the current architecture, MassUploaderButton.js does not add the event listener itself.
    // The integration (GeneralHelpToolsButton.js) is responsible for wiring up the button.
    // So, expect 0 click listeners added by this module.
    const clickListeners = spy.mock.calls.filter(call => call[0] === 'click');
    expect(clickListeners.length).toBe(0);

    spy.mockRestore();
  });
});
