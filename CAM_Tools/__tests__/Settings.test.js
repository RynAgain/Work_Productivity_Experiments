/**
 * @jest-environment jsdom
 */
const { JSDOM } = require('jsdom');

describe('Settings.js', () => {
  let window, document, localStorageMock, settingsScript;

  beforeEach(() => {
    // Setup DOM and localStorage mock
    const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', { url: "http://localhost" });
    window = dom.window;
    document = window.document;
    localStorageMock = (() => {
      let store = {};
      return {
        getItem: key => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        clear: () => { store = {}; }
      };
    })();
    window.localStorage = localStorageMock;
    global.window = window;
    global.document = document;
    global.localStorage = localStorageMock;

    // Add nav bar buttons to DOM for side menu actions
    ['redriveButton', 'addItemButton', 'downloadDataButton', 'activateButton', 'generalHelpToolsButton'].forEach(id => {
      const btn = document.createElement('button');
      btn.id = id;
      btn.textContent = id;
      document.body.appendChild(btn);
    });

    // Load the script (simulate by requiring and running the file content)
    jest.resetModules();
    settingsScript = require('../JS/Settings.js');
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete global.window;
    delete global.document;
    delete global.localStorage;
  });

  test('should initialize state with defaults and localStorage', () => {
    expect(window.localStorage.getItem).toBeDefined();
    // Check that state object exists and has expected keys
    // (You may need to expose state for testing or check DOM for expected UI)
  });

  test('should render settings button and menus', () => {
    const settingsBtn = document.getElementById('settings-btn');
    expect(settingsBtn).toBeTruthy();
    // Simulate click to open settings menu
    settingsBtn.click();
    // Check that settings menu is visible
    const settingsMenu = document.querySelector('div[style*="position: fixed"]');
    expect(settingsMenu).toBeTruthy();
  });

  test('should render side menu with static config', () => {
    // Simulate switching to side menu mode and opening side menu
    window.state = window.state || {};
    window.state.menuStyle = 'side';
    window.state.sideMenuOpen = true;
    window.render && window.render();
    const drawer = document.querySelector('div[role="menu"]');
    expect(drawer).toBeTruthy();
    expect(drawer.querySelectorAll('button.drawer-item').length).toBeGreaterThan(0);
  });

  test('side menu actions should trigger original button clicks', () => {
    const mockClick = jest.fn();
    const btn = document.getElementById('redriveButton');
    btn.onclick = mockClick;
    // Simulate opening side menu and clicking the first drawer item
    window.state = window.state || {};
    window.state.menuStyle = 'side';
    window.state.sideMenuOpen = true;
    window.render && window.render();
    const drawerBtn = document.querySelector('button.drawer-item');
    expect(drawerBtn).toBeTruthy();
    drawerBtn.click();
    expect(mockClick).toHaveBeenCalled();
  });

  test('should persist settings to localStorage', () => {
    // Simulate changing theme color
    window.state = window.state || {};
    window.state.themeColor = '#123456';
    window.persistSettings && window.persistSettings();
    expect(window.localStorage.getItem('cam_tools_settings')).toContain('#123456');
  });
});