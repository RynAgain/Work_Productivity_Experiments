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
    expect(button.innerHTML).toBe('Download Data');
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
