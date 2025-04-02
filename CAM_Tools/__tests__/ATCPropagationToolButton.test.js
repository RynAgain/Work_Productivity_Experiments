import { addATCPropagationToolButton } from '../JS/ATCPropagationToolButton.js';

describe('ATCPropagationToolButton module', () => {
  beforeEach(() => {
    // Clear the document body before each test to ensure a fresh start.
    document.body.innerHTML = '';
  });

  test('should add the ATC Propagation Tool button to the document', (done) => {
    jest.setTimeout(10000); // Increase timeout to 10 seconds
    // Simulate a DOM change
    const observerCallback = () => {
      const button = document.getElementById('atcpropButton');
      expect(button).not.toBeNull();
      expect(button.innerHTML).toBe('ATC Propagation Tool');
      done();
    };

    // Observe the document body for changes
    const observer = new MutationObserver(observerCallback);
    observer.observe(document.body, { childList: true, subtree: true });

    // Trigger a DOM change
    const div = document.createElement('div');
    document.body.appendChild(div);
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
