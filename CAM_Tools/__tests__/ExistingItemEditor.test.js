import { openExistingItemEditor } from '../JS/ExistingItemEditor';

describe('ExistingItemEditor', () => {
  let container;

  beforeEach(() => {
    // Set up our document body
    document.body.innerHTML = '<div id="editorContainer"></div>';
    container = document.getElementById('editorContainer');
  });

  test('should create overlay and container if not exist', () => {
    openExistingItemEditor();
    openExistingItemEditor();
    expect(overlay).not.toBeNull();
    expect(container).not.toBeNull();
    expect(document.getElementById('editorContainer')).not.toBeNull();
  });

  test('should initialize Handsontable', () => {
    openExistingItemEditor();
    const sheetWrapper = document.querySelector('#sheetWrapper');
    expect(sheetWrapper).not.toBeNull();
    expect(sheetWrapper.children.length).toBeGreaterThanOrEqual(1); // Handsontable should be initialized
  });

  test('should show download and upload buttons after fetching data', () => {
    openExistingItemEditor();
    const fetchDataButton = document.querySelector('#fetchDataButton');
    fetchDataButton.click();
    const downloadBtn = document.getElementById('downloadBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    expect(downloadBtn.style.display).toBe('block');
    expect(uploadBtn.style.display).toBe('block');
    expect(document.getElementById('uploadBtn').style.display).toBe('block');
  });

  test('should handle fetchData error', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() => Promise.reject(new Error('API is down')));
    openExistingItemEditor();
    const fetchDataButton = document.getElementById('fetchDataButton');
    await fetchDataButton.click();
    expect(console.error).toHaveBeenCalledWith('[ExistingItemEditor] fetchData error:', 'API is down');
  });
});