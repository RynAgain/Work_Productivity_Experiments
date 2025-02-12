import { fireEvent } from '@testing-library/dom';

describe('EasterEgg module', () => {
  beforeEach(() => {
    // Clear the document body before each test to ensure a fresh start.
    document.body.innerHTML = '';
  });

  test('should activate the Easter Egg when the correct key sequence is entered', () => {
    const keySequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    keySequence.forEach(key => {
      fireEvent.keyDown(window, { key });
    });

    const overlay = document.querySelector('div[style*="z-index: 10000"]');
    expect(overlay).not.toBeNull();
  });

  test('should not activate the Easter Egg with an incorrect key sequence', () => {
    const incorrectSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'b'];
    incorrectSequence.forEach(key => {
      fireEvent.keyDown(window, { key });
    });

    const overlay = document.querySelector('div[style*="z-index: 10000"]');
    expect(overlay).toBeNull();
  });
});
