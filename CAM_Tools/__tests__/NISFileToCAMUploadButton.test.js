import { addNISFileToCAMUploadFunctionality } from '../JS/NISFileToCAMUploadButton.js';

describe('NISFileToCAMUploadButton module', () => {
  beforeEach(() => {
    // Clear the document body before each test to ensure a fresh start.
    document.body.innerHTML = '';
  });

  test('should add the NIS File to CAM Upload button to the document', () => {
    addNISFileToCAMUploadFunctionality();
    const button = document.getElementById('nisFileToCAMUploadButton');
    expect(button).not.toBeNull();
    expect(button.innerHTML).toBe('NIS File to CAM Upload');
  });

  test('should not add the button if it already exists', () => {
    const button = document.createElement('button');
    button.id = 'nisFileToCAMUploadButton';
    document.body.appendChild(button);

    addNISFileToCAMUploadFunctionality();
    const buttons = document.querySelectorAll('#nisFileToCAMUploadButton');
    expect(buttons.length).toBe(1);
  });
});
