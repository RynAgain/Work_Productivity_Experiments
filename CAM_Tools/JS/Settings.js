/* eslint-env browser */
(function () {
  'use strict';

  // ------------------------------------------------------------------
  //  SETTINGS STORAGE
  // ------------------------------------------------------------------
  const SETTINGS_KEY = 'cam_tools_settings';
  function getSettings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; }
    catch { return {}; }
  }
  function setSettings(s) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    window.dispatchEvent(new CustomEvent('camToolsSettingsChanged', { detail: s }));
  }

  // ------------------------------------------------------------------
  //  CENTRALIZED STATE
  // ------------------------------------------------------------------
  const defaultSettings = { menuStyle: 'side', themeColor: '#004E36' };
  const state = {
    settingsMenuOpen: false,
    sideMenuOpen: false,
    bottomBarVisible: false,
    ...defaultSettings,
    ...getSettings()
  };

  // Only persist these keys
  function persistSettings() {
    setSettings({
      menuStyle: state.menuStyle,
      themeColor: state.themeColor
    });
  }

  // Central state update
  function setState(partial) {
    Object.assign(state, partial);
    // Persist only relevant settings
    persistSettings();
    render();
  }

  // ------------------------------------------------------------------
  //  ELEMENT HELPERS
  // ------------------------------------------------------------------
  function createButton({ id, title, html, style, onClick }) {
    const btn = document.createElement('button');
    if (id) btn.id = id;
    if (title) btn.title = title;
    if (html) btn.innerHTML = html;
    Object.assign(btn.style, style);
    if (onClick) btn.onclick = onClick;
    return btn;
  }

  // ------------------------------------------------------------------
  //  UI ELEMENTS
  // ------------------------------------------------------------------
  // Settings Button
  const settingsBtn = createButton({
    id: 'settings-btn',
    title: 'Settings',
    html: `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
           stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2
                 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0
                 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0
                 1 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65
                 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1
                 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0
                 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0
                 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65
                 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0
                 1 1 2.83-2.83l.06.06A1.65 1.65 0 0
                 0 8 4.6a1.65 1.65 0 0 0 1-1.51V3a2
                 2 0 1 1 4 0v.09A1.65 1.65 0 0 0
                 16 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2
                 2 0 1 1 2.83 2.83l-.06-.06A1.65 1.65 0 0
                 0 19.4 8c.14.31.22.65.22 1v.09A1.65
                 1.65 0 0 0 21 12c0 .35-.08.69-.22 1z"/>
      </svg>`,
    style: {
      position: 'fixed', left: '0', top: 'calc(10vh + 192px)',
      width: '36px', height: '36px', zIndex: '3100',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: state.themeColor, color: '#fff',
      border: 'none', borderRadius: '0 5px 5px 0',
      boxShadow: '2px 2px 8px rgba(0,0,0,.2)',
      cursor: 'pointer', fontSize: '16px', padding: '0',
      transition: 'background .3s'
    }
  });

  // Hamburger/Close Button
  const hamburgerSVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <line x1="4" y1="7"  x2="20" y2="7"/>
    <line x1="4" y1="12" x2="20" y2="12"/>
    <line x1="4" y1="17" x2="20" y2="17"/></svg>`;
  const closeSVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <line x1="5"  y1="5"  x2="19" y2="19"/>
    <line x1="19" y1="5"  x2="5"  y2="19"/></svg>`;

  const toggleBtn = createButton({
    title: 'Show Menu',
    html: hamburgerSVG,
    style: {
      position: 'fixed', left: '0', top: 'calc(10vh + 150px)',
      width: '36px', height: '36px', zIndex: '3100',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#004E36', color: '#fff', border: 'none',
      borderRadius: '0 5px 5px 0', boxShadow: '2px 2px 8px rgba(0,0,0,.2)',
      cursor: 'pointer', fontSize: '16px', padding: '0', transition: 'background .3s'
    }
  });

  // Settings Menu Panel
  const settingsMenu = document.createElement('div');
  Object.assign(settingsMenu.style, {
    position: 'fixed',
    left: '0',
    top: 'calc(10vh + 192px)',
    width: '260px',
    height: 'calc(100vh - (10vh + 192px))',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    padding: '22px 18px 18px',
    fontFamily: 'Segoe UI, Arial, sans-serif',
    borderTopRightRadius: '12px',
    borderBottomRightRadius: '12px',
    transform: 'translateX(-100%)',
    transition: 'transform .25s cubic-bezier(.4,0,.2,1)',
    boxShadow: 'none',
    pointerEvents: 'none',
    zIndex: '3001'
  });

  // Drawer and Overlay
  const drawerOverlay = document.createElement('div');
  Object.assign(drawerOverlay.style, {
    position: 'fixed',
    left: '36px',
    top: 'calc(10vh + 192px)',
    width: 'calc(100vw - 36px)',
    height: 'calc(100vh - (10vh + 192px))',
    background: 'rgba(0,0,0,.15)',
    zIndex: '2999',
    display: 'none'
  });
  const drawer = document.createElement('div');
  Object.assign(drawer.style, {
    position: 'fixed',
    left: '-220px',
    top: 'calc(10vh + 192px)',
    width: '220px',
    height: 'calc(100vh - (10vh + 192px))',
    background: '#fff',
    boxShadow: '2px 0 12px rgba(0,0,0,.18)',
    borderTopRightRadius: '12px',
    borderBottomRightRadius: '12px',
    padding: '18px 10px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    transition: 'left .25s cubic-bezier(.4,0,.2,1)',
    zIndex: '3000'
  });
  const drawerClose = createButton({
    html: '&times;',
    style: {
      position: 'absolute', top: '8px', right: '10px',
      background: 'none', border: 'none', fontSize: '22px', color: '#888', cursor: 'pointer'
    }
  });
  drawer.appendChild(drawerClose);

  // IDs for bottom bar buttons
  const bottomButtonIds = ['redriveButton', 'addItemButton', 'downloadDataButton', 'activateButton', 'generalHelpToolsButton'];

  // ------------------------------------------------------------------
  //  RENDER FUNCTION
  // ------------------------------------------------------------------
  function render() {
    // Settings Button
    settingsBtn.style.background = state.themeColor;

    // Settings Menu
    if (state.settingsMenuOpen) {
      renderSettingsMenu();
      settingsMenu.style.transform = 'translateX(0)';
      settingsMenu.style.boxShadow = '2px 0 12px rgba(0,0,0,.18)';
      settingsMenu.style.pointerEvents = 'auto';
    } else {
      settingsMenu.style.transform = 'translateX(-100%)';
      settingsMenu.style.boxShadow = 'none';
      settingsMenu.style.pointerEvents = 'none';
    }

    // Hamburger/Close Button
    toggleBtn.innerHTML = (state.sideMenuOpen || state.bottomBarVisible) ? closeSVG : hamburgerSVG;
    toggleBtn.title = (state.sideMenuOpen || state.bottomBarVisible) ? 'Hide Menu' : 'Show Menu';

    // Drawer and Overlay (side menu)
    if (state.menuStyle === 'side') {
      // Always hide bottom bar in side menu mode
      if (state.bottomBarVisible) {
        state.bottomBarVisible = false;
      }
      // Populate drawer with nav bar buttons
      drawer.innerHTML = '';
      drawer.appendChild(drawerClose);
      if (bottomButtonIds.length === 0) {
        const warn = document.createElement('div');
        warn.textContent = 'No button IDs set in bottomButtonIds!';
        warn.style.color = 'red';
        warn.style.padding = '10px';
        drawer.appendChild(warn);
      } else {
        // Debug log for which IDs are being used
        console.debug('Populating drawer with IDs:', bottomButtonIds);
        bottomButtonIds.forEach(id => {
          const src = document.getElementById(id);
          if (!src) {
            // Show a warning in the drawer for missing elements
            const missing = document.createElement('div');
            missing.textContent = `Button with ID "${id}" not found`;
            missing.style.color = 'orange';
            missing.style.fontSize = '12px';
            drawer.appendChild(missing);
            return;
          }
          const clone = src.cloneNode(true);
          clone.classList.add('drawer-item');
          Object.assign(clone.style, {
            position: 'static', width: '100%', height: '40px',
            borderRadius: '6px', fontSize: '15px',
            background: '#004E36', color: '#fff', boxShadow: 'none',
            cursor: 'pointer'
          });
          clone.onmouseenter = () => clone.style.background = '#218838';
          clone.onmouseleave = () => clone.style.background = '#004E36';
          clone.onclick = () => src.click();
          drawer.appendChild(clone);
        });
      }
      if (state.sideMenuOpen) {
        drawerOverlay.style.display = 'block';
        drawer.style.display = 'flex';
        setTimeout(() => { drawer.style.left = '0'; }, 0);
      } else {
        drawer.style.left = '-220px';
        drawerOverlay.style.display = 'none';
        setTimeout(() => { drawer.style.display = 'none'; }, 250);
      }
      // Hide bottom bar buttons in side mode
      bottomButtonIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
    } else {
      // Hide drawer in bottom mode
      drawerOverlay.style.display = 'none';
      drawer.style.display = 'none';
      drawer.style.left = '-220px';
      // Show/hide bottom bar buttons
      bottomButtonIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = state.bottomBarVisible ? '' : 'none';
      });
    }
  }

  // ------------------------------------------------------------------
  //  SETTINGS MENU CONTENT
  // ------------------------------------------------------------------
  function renderSettingsMenu() {
    settingsMenu.innerHTML = `
      <div style="font-size:18px;font-weight:bold;color:#004E36;
                  display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span>Settings</span><span style="flex:1"></span>
        <button id="settings-close" style="background:none;border:none;
                font-size:22px;color:#888;cursor:pointer">&times;</button>
      </div>
      <label style="margin-bottom:10px;display:block">
        <span style="font-weight:500;display:block;margin-bottom:4px">Bottom Button Layout</span>
        <select id="menuStyle" style="width:100%;padding:7px 10px;border:1px solid #ccc;border-radius:5px">
          <option value="side"   ${state.menuStyle === 'side' ? 'selected' : ''}>Side Pop‑out Menu</option>
          <option value="bottom" ${state.menuStyle === 'bottom' ? 'selected' : ''}>Bottom Nav Bar</option>
        </select>
      </label>
      <label style="display:block">
        <span style="font-weight:500;display:block;margin-bottom:4px">Theme Color</span>
        <input type="color" id="themeColor" value="${state.themeColor}"
               style="width:40px;height:32px;border:none;vertical-align:middle">
        <span style="margin-left:10px;font-size:14px">${state.themeColor}</span>
      </label>
    `;
    // Wiring
    settingsMenu.querySelector('#settings-close').onclick = () => setState({ settingsMenuOpen: false });
    settingsMenu.querySelector('#menuStyle').onchange = e => {
      // Always reset both menu states when switching menuStyle
      setState({
        menuStyle: e.target.value,
        sideMenuOpen: false,
        bottomBarVisible: false,
        settingsMenuOpen: false // Optionally close settings menu on switch
      });
    };
    settingsMenu.querySelector('#themeColor').oninput = e => setState({ themeColor: e.target.value });
  }

  // ------------------------------------------------------------------
  //  EVENT HANDLERS
  // ------------------------------------------------------------------
  settingsBtn.onmouseenter = () => settingsBtn.style.background = '#218838';
  settingsBtn.onmouseleave = () => settingsBtn.style.background = state.themeColor;
  settingsBtn.onclick = () => setState({ settingsMenuOpen: !state.settingsMenuOpen });

  toggleBtn.onmouseenter = () => toggleBtn.style.background = '#218838';
  toggleBtn.onmouseleave = () => toggleBtn.style.background = '#004E36';
  toggleBtn.onclick = () => {
    if (state.menuStyle === 'side') {
      setState({ sideMenuOpen: !state.sideMenuOpen, bottomBarVisible: false });
    } else {
      setState({ bottomBarVisible: !state.bottomBarVisible, sideMenuOpen: false });
    }
  };

  drawerOverlay.onclick = () => setState({ sideMenuOpen: false });
  drawerClose.onclick = e => {
    e.stopPropagation();
    if (state.menuStyle === 'side') {
      setState({ sideMenuOpen: false });
    } else {
      setState({ bottomBarVisible: false });
    }
  };

  // Listen for settings changes from other tabs/windows
  window.addEventListener('camToolsSettingsChanged', () => {
    Object.assign(state, getSettings());
    render();
  });

  // ------------------------------------------------------------------
  //  MOUNT EVERYTHING
  // ------------------------------------------------------------------
  document.body.append(
    settingsBtn, settingsMenu,
    toggleBtn, drawerOverlay, drawer
  );

  // Initial render
// ------------------------------------------------------------------
//  DYNAMIC BUTTON OBSERVER FOR DRAWER POPULATION
// ------------------------------------------------------------------
(function observeNavButtons() {
  if (!Array.isArray(bottomButtonIds) || bottomButtonIds.length === 0) return;
  const found = () => bottomButtonIds.every(id => document.getElementById(id));
  if (found()) return; // All buttons already present

  const observer = new MutationObserver(() => {
    if (found()) {
      render();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
  render();

})();