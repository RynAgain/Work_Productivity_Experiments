import { JSDOM } from 'jsdom';
import { addDownloadButton } from '../JS/DownloadButton.js';

describe('DownloadButton module', () => {
  beforeEach(() => {
    // Clear the document body before each test to ensure a fresh start.
    document.body.innerHTML = '';
  });

  test('should add the download button to the document', () => {
    addDownloadButton();
    const button = document.getElementById('downloadDataButton');
    expect(button).not.toBeNull();
    expect(button.innerHTML).toBe('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5-.5h4.5V1.5a.5.5 0 0 1 1 0v7.9h4.5a.5.5 0 0 1 .5.5v.5a.5.5 0 0 1-.5.5H6.5v4.5a.5.5 0 0 1-1 0V10.9H1a.5.5 0 0 1-.5-.5v-.5z"></path><path d="M5.5 10.9V1.5a.5.5 0 0 1 1 0v9.4h4.5a.5.5 0 0 1 .5.5v.5a.5.5 0 0 1-.5.5H6.5v4.5a.5.5 0 0 1-1 0V11.9H1a.5.5 0 0 1-.5-.5v-.5a.5.5 0 0 1 .5-.5h4.5z"></path></svg> Download Data');
  });

  test('should not add the button if it already exists', () => {
    const button = document.createElement('button');
    button.id = 'downloadDataButton';
    document.body.appendChild(button);

    addDownloadButton();
    const buttons = document.querySelectorAll('#downloadDataButton');
    expect(buttons.length).toBe(1);
  });

  test('should remove the overlay when the close button is clicked', () => {
    addDownloadButton();
    const downloadButton = document.getElementById('downloadDataButton');
    downloadButton.click();

    const overlay = document.getElementById('downloadOverlay');
    expect(overlay).not.toBeNull();

    const closeButton = overlay.querySelector('span');
    const removeChildSpy = jest.spyOn(document.body, 'removeChild');
    closeButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(removeChildSpy).toHaveBeenCalledWith(overlay);
    removeChildSpy.mockRestore();
  });
});
