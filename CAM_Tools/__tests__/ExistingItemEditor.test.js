import { fireEvent } from '@testing-library/dom';
import '../JS/ExistingItemEditor.js';

describe('ExistingItemEditor module', () => {
  // The IIFE runs once on import, injecting styles into document.head
  // and adding the edit button to document.body.
  // MutationObserver is stubbed (no-op) so the button will not be
  // re-added automatically after removal.

  afterEach(() => {
    // Remove overlay between tests so each overlay test starts clean.
    const overlay = document.getElementById('tm-ei-overlay');
    if (overlay) overlay.remove();
  });

  /* -------------------------------------------------- *
   *  Group 1 -- Module Initialization & Edit Button
   * -------------------------------------------------- */
  describe('Module Initialization & Edit Button', () => {
    test('should inject styles with tm-ei-style id', () => {
      const style = document.getElementById('tm-ei-style');
      expect(style).not.toBeNull();
      expect(style.tagName.toLowerCase()).toBe('style');
    });

    test('should add the edit button to the document', () => {
      const btn = document.getElementById('tm-ei-openEditor');
      expect(btn).not.toBeNull();
    });

    test('should use tm-ei-btn class on the edit button', () => {
      const btn = document.getElementById('tm-ei-openEditor');
      expect(btn.classList.contains('tm-ei-btn')).toBe(true);
    });

    test('should have "Edit Existing Item" text in the button', () => {
      const btn = document.getElementById('tm-ei-openEditor');
      expect(btn.textContent).toContain('Edit Existing Item');
    });
  });

  /* -------------------------------------------------- *
   *  Group 2 -- Overlay / Dialog Opening
   * -------------------------------------------------- */
  describe('Overlay / Dialog Opening', () => {
    test('should open overlay when edit button is clicked', () => {
      const btn = document.getElementById('tm-ei-openEditor');
      btn.click();

      const overlay = document.getElementById('tm-ei-overlay');
      expect(overlay).not.toBeNull();
    });

    test('should use correct tm-ei-* class names on overlay elements', () => {
      document.getElementById('tm-ei-openEditor').click();

      const overlay = document.getElementById('tm-ei-overlay');
      expect(overlay.classList.contains('tm-ei-overlay')).toBe(true);

      const card = overlay.querySelector('.tm-ei-card');
      expect(card).not.toBeNull();

      const header = overlay.querySelector('.tm-ei-header');
      expect(header).not.toBeNull();

      const body = overlay.querySelector('.tm-ei-body');
      expect(body).not.toBeNull();
    });

    test('should not create duplicate overlays on double click', () => {
      const btn = document.getElementById('tm-ei-openEditor');
      btn.click();
      btn.click();

      const overlays = document.querySelectorAll('#tm-ei-overlay');
      expect(overlays.length).toBe(1);
    });

    test('should contain PLU and Store input fields in the overlay', () => {
      document.getElementById('tm-ei-openEditor').click();

      expect(document.getElementById('ei-plu')).not.toBeNull();
      expect(document.getElementById('ei-store')).not.toBeNull();
    });

    test('should contain All PLUs and All Stores checkboxes', () => {
      document.getElementById('tm-ei-openEditor').click();

      expect(document.getElementById('ei-all-plus')).not.toBeNull();
      expect(document.getElementById('ei-all-stores')).not.toBeNull();
    });

    test('should contain team filter dropdown', () => {
      document.getElementById('tm-ei-openEditor').click();

      expect(document.getElementById('ei-team-filter')).not.toBeNull();
    });

    test('should contain Edit Items fetch button', () => {
      document.getElementById('tm-ei-openEditor').click();

      const fetchBtn = document.getElementById('ei-fetch');
      expect(fetchBtn).not.toBeNull();
      expect(fetchBtn.textContent).toContain('Edit Items');
    });

    test('should close overlay when close button is clicked', () => {
      document.getElementById('tm-ei-openEditor').click();

      const closeBtn = document.querySelector('.tm-ei-header button');
      expect(closeBtn).not.toBeNull();
      closeBtn.click();

      expect(document.getElementById('tm-ei-overlay')).toBeNull();
    });

    test('should close overlay when clicking outside the card (on overlay background)', () => {
      document.getElementById('tm-ei-openEditor').click();

      const overlay = document.getElementById('tm-ei-overlay');
      expect(overlay).not.toBeNull();

      // Dispatch click directly on the overlay element so e.target === overlay
      overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(document.getElementById('tm-ei-overlay')).toBeNull();
    });
  });

  /* -------------------------------------------------- *
   *  Group 3 -- CSS Class Name Regression Prevention
   * -------------------------------------------------- */
  describe('CSS Class Name Regression Prevention', () => {
    let styleContent;

    beforeAll(() => {
      styleContent = document.getElementById('tm-ei-style').textContent;
    });

    test('should have tm-ei-overlay CSS rule in injected styles', () => {
      expect(styleContent).toContain('.tm-ei-overlay');
    });

    test('should have tm-ei-card CSS rule in injected styles', () => {
      expect(styleContent).toContain('.tm-ei-card');
    });

    test('should have tm-ei-header CSS rule in injected styles', () => {
      expect(styleContent).toContain('.tm-ei-header');
    });

    test('should have tm-ei-btn CSS rule in injected styles', () => {
      expect(styleContent).toContain('.tm-ei-btn');
    });

    test('should have tm-ei-table CSS rule in injected styles', () => {
      expect(styleContent).toContain('.tm-ei-table');
    });

    test('should have tm-ei-toolbar CSS rule in injected styles', () => {
      expect(styleContent).toContain('.tm-ei-toolbar');
    });

    test('should have tm-ei-filter-bar CSS rule in injected styles', () => {
      expect(styleContent).toContain('.tm-ei-filter-bar');
    });

    test('should have tm-ei-bulk-ops CSS rule in injected styles', () => {
      expect(styleContent).toContain('.tm-ei-bulk-ops');
    });

    test('CSS class names in overlay elements should match CSS selectors', () => {
      document.getElementById('tm-ei-openEditor').click();

      const overlay = document.getElementById('tm-ei-overlay');
      const allElements = overlay.querySelectorAll('[class]');
      const css = document.getElementById('tm-ei-style').textContent;

      allElements.forEach(el => {
        el.classList.forEach(cls => {
          if (cls.startsWith('tm-ei-')) {
            expect(css).toContain('.' + cls);
          }
        });
      });
    });
  });

  /* -------------------------------------------------- *
   *  Group 4 -- Form Interaction
   * -------------------------------------------------- */
  describe('Form Interaction', () => {
    test('should disable PLU input when All PLUs checkbox is checked', () => {
      document.getElementById('tm-ei-openEditor').click();

      const checkbox = document.getElementById('ei-all-plus');
      const pluInput = document.getElementById('ei-plu');

      checkbox.checked = true;
      fireEvent.change(checkbox);

      expect(pluInput.disabled).toBe(true);
    });

    test('should disable Store input when All Stores checkbox is checked', () => {
      document.getElementById('tm-ei-openEditor').click();

      const checkbox = document.getElementById('ei-all-stores');
      const storeInput = document.getElementById('ei-store');

      checkbox.checked = true;
      fireEvent.change(checkbox);

      expect(storeInput.disabled).toBe(true);
    });

    test('should re-enable PLU input when All PLUs checkbox is unchecked', () => {
      document.getElementById('tm-ei-openEditor').click();

      const checkbox = document.getElementById('ei-all-plus');
      const pluInput = document.getElementById('ei-plu');

      // Check then uncheck
      checkbox.checked = true;
      fireEvent.change(checkbox);
      expect(pluInput.disabled).toBe(true);

      checkbox.checked = false;
      fireEvent.change(checkbox);
      expect(pluInput.disabled).toBe(false);
    });
  });

  /* -------------------------------------------------- *
   *  Group 5 -- Edit Button Action Class
   * -------------------------------------------------- */
  describe('Edit Button Action Class', () => {
    test('Edit Items button should use tm-ei-action class', () => {
      document.getElementById('tm-ei-openEditor').click();

      const fetchBtn = document.getElementById('ei-fetch');
      expect(fetchBtn.classList.contains('tm-ei-action')).toBe(true);
    });
  });
});
