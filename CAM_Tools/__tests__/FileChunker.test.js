import { addFileChunkerFunctionality } from '../JS/FileChunker.js';

describe('FileChunker module', () => {
  beforeEach(() => {
    // Clear the document body before each test to ensure a fresh start.
    document.body.innerHTML = '';
  });

  test('should add the file chunker overlay to the document', () => {
    addFileChunkerFunctionality();
    const overlay = document.getElementById('fileChunkerOverlay');
    expect(overlay).not.toBeNull();
  });

  test('should remove the overlay when the close button is clicked', () => {
    addFileChunkerFunctionality();
    const closeButton = document.querySelector('#fileChunkerOverlay .close-button');
    closeButton.click();
    const overlay = document.getElementById('fileChunkerOverlay');
    expect(overlay).toBeNull();
  });
});
