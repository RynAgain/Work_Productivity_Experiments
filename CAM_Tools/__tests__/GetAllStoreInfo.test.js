import { getAllStoreInfo } from '../JS/GetAllStoreInfo.js';

describe('GetAllStoreInfo module', () => {
  beforeEach(() => {
    // Clear the document body before each test to ensure a fresh start.
    document.body.innerHTML = '';
  });

  test('should log store data when the function is called', () => {
    console.log = jest.fn();
    getAllStoreInfo();
    expect(console.log).toHaveBeenCalledWith('[GetAllStoreInfo.js] Get All Store Info button clicked');
  });
});
