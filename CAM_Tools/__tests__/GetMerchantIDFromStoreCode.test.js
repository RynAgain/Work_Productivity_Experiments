import { getMerchantIDFromStoreCode } from '../JS/GetMerchantIDFromStoreCode.js';

describe('GetMerchantIDFromStoreCode module', () => {
  beforeEach(() => {
    // Clear the document body before each test to ensure a fresh start.
    document.body.innerHTML = '';
  });

  test('should add the merchant ID overlay to the document', () => {
    getMerchantIDFromStoreCode();
    const overlay = document.getElementById('merchantIdOverlay');
    expect(overlay).not.toBeNull();
  });

  test('should remove the overlay when the close button is clicked', () => {
    getMerchantIDFromStoreCode();
    const closeButton = document.querySelector('#merchantIdOverlay .close-button');
    closeButton.click();
    const overlay = document.getElementById('merchantIdOverlay');
    expect(overlay).toBeNull();
  });
});
