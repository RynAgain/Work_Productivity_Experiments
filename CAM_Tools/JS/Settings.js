/* eslint-env browser */
(function () {
  'use strict';
  // Expose internals for testing
  try {
    module.exports = {
      getSettings,
      setSettings,
      persistSettings,
      setState,
      state,
      render,
      sideMenuItems
    };
  } catch (e) {
    // Ignore if not in a module environment
  }

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
  const SETTINGS_VERSION = 1;
  const defaultSettings = { menuStyle: 'side', themeColor: '#004E36', __version: SETTINGS_VERSION };
  let state = {
    settingsMenuOpen: false,
    sideMenuOpen: false,
    bottomBarVisible: false,
    ...defaultSettings,
    ...getSettings()
  };
  // DO NOT use Proxy for state: all state changes must go through setState to avoid infinite render loops.

  // Only persist these keys
  function persistSettings() {
    setSettings({
      menuStyle: state.menuStyle,
      themeColor: state.themeColor
    });
  }

  // Central state update
  function setState(partial) {
    let changed = false;
    for (const k in partial) {
      if (state[k] !== partial[k]) {
        state[k] = partial[k];
        changed = true;
      }
    }
    if (changed) {
      persistSettings();
      render();
    }
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
//  CSS FOR VISUAL HIDING OF NAV BAR BUTTONS IN SIDE MENU MODE
// ------------------------------------------------------------------
const style = document.createElement('style');
style.textContent = `
  .nav-bar-hidden {
    opacity: 0 !important;
    pointer-events: none !important;
    position: absolute !important;
    left: -9999px !important;
  }
  .drawer[aria-hidden="true"] {
    display: none !important;
  }
  .drawer[aria-hidden="false"] {
    display: flex !important;
  }
`;
document.head.appendChild(style);

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
  /** Icon Bar for Side Menu **/
  const iconBar = document.createElement('div');
  Object.assign(iconBar.style, {
    position: 'fixed',
    left: '0',
    top: 'calc(10vh + 192px + 36px)', // settings button + margin
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    zIndex: '3100',
    background: 'transparent',
    padding: '8px 0',
    width: '36px',
    pointerEvents: 'auto'
  });
  iconBar.setAttribute('aria-label', 'Quick Tools');
  iconBar.setAttribute('role', 'menu');

  // ------------------------------------------------------------------
  //  STATIC SIDE MENU CONFIGURATION (RELIABLE APPROACH)
  // ------------------------------------------------------------------
  const sideMenuItems = [
    {
      label: 'Download',
      tooltip: 'Download Data',
      icon: `<svg width="22" height="22" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 3v14m0 0l-5-5m5 5l5-5"/><rect x="4" y="19" width="16" height="2" rx="1" fill="#fff" stroke="none"/></svg>`,
      action: () => document.getElementById('downloadDataButton')?.click()
    },
    {
      label: 'Add',
      tooltip: 'Add Item',
      icon: `<svg width="22" height="22" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
      action: () => document.getElementById('addItemButton')?.click()
    },
    {
      label: 'Activate',
      tooltip: 'Activate/Deactivate',
      icon: `<svg width="22" height="22" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="7" rx="2"/><circle cx="12" cy="8" r="3"/></svg>`,
      action: () => document.getElementById('activateButton')?.click()
    },
    {
      label: 'Redrive',
      tooltip: 'Redrive',
      icon: `<svg width="22" height="22" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="6" rx="2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4"/></svg>`,
      action: () => document.getElementById('redriveButton')?.click()
    },
    {
      label: 'Help',
      tooltip: 'General Help Tools',
      icon: `<svg width="22" height="22" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12" y2="17"/></svg>`,
      action: () => document.getElementById('generalHelpToolsButton')?.click()
    }
  ];
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
      settingsMenu.setAttribute('aria-hidden', 'false');
      setTimeout(() => {
        const firstInput = settingsMenu.querySelector('select, input[type="color"]');
        if (firstInput) firstInput.focus();
      }, 100);
    } else {
      settingsMenu.style.transform = 'translateX(-100%)';
      settingsMenu.style.boxShadow = 'none';
      settingsMenu.style.pointerEvents = 'none';
      settingsMenu.setAttribute('aria-hidden', 'true');
    }
  
    // Hamburger/Close Button
    toggleBtn.innerHTML = (state.sideMenuOpen || state.bottomBarVisible) ? closeSVG : hamburgerSVG;
    toggleBtn.title = (state.sideMenuOpen || state.bottomBarVisible) ? 'Hide Menu' : 'Show Menu';
  
    // Icon Bar (side menu mode)
    if (state.menuStyle === 'side') {
      // Always hide bottom bar in side menu mode
      if (state.bottomBarVisible) {
        state.bottomBarVisible = false;
      }
      // Visually hide nav bar buttons using CSS class
      bottomButtonIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('nav-bar-hidden');
      });
      // Render icon bar
      iconBar.innerHTML = '';
      sideMenuItems.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'iconbar-item';
        btn.setAttribute('role', 'menuitem');
        btn.setAttribute('tabindex', '0');
        btn.setAttribute('aria-label', item.tooltip || item.label);
        btn.title = item.tooltip || item.label;
        btn.innerHTML = item.icon;
        Object.assign(btn.style, {
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#004E36',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          margin: '0',
          padding: '0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          transition: 'background .2s'
        });
        btn.onmouseenter = () => btn.style.background = '#218838';
        btn.onmouseleave = () => btn.style.background = '#004E36';
        btn.onclick = item.action;
        iconBar.appendChild(btn);
      });
      iconBar.style.display = '';
    } else {
      // Show nav bar buttons in bottom mode
      bottomButtonIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('nav-bar-hidden');
        if (el) el.style.display = state.bottomBarVisible ? '' : 'none';
      });
      iconBar.style.display = 'none';
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
  
  // Keyboard accessibility: ESC closes menus, trap focus
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (state.settingsMenuOpen) setState({ settingsMenuOpen: false });
      if (state.sideMenuOpen) setState({ sideMenuOpen: false });
      if (state.bottomBarVisible) setState({ bottomBarVisible: false });
    }
    // Trap focus in open menus
    if (state.settingsMenuOpen || state.sideMenuOpen) {
      const focusable = Array.from(document.querySelectorAll('button, [tabindex="0"], select, input'));
      const visible = focusable.filter(el => el.offsetParent !== null);
      if (!visible.length) return;
      const first = visible[0], last = visible[visible.length - 1];
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    }
  });

  // Listen for settings changes from other tabs/windows
  window.addEventListener('camToolsSettingsChanged', () => {
    // Only update persisted keys to avoid triggering render loops
    const newSettings = getSettings();
    let changed = false;
    ['menuStyle', 'themeColor'].forEach(k => {
      if (state[k] !== newSettings[k]) {
        state[k] = newSettings[k];
        changed = true;
      }
    });
    if (changed) render();
  });

  // ------------------------------------------------------------------
  //  MOUNT EVERYTHING
  // ------------------------------------------------------------------
  document.body.append(
    settingsBtn, settingsMenu,
    toggleBtn, iconBar
  );
  
  // Add smooth transitions for menus/drawer
  const transitionStyle = document.createElement('style');
  transitionStyle.textContent = `
    #settings-btn, #settings-btn:focus { outline: none; }
    .drawer, #settings-btn, #settings-btn, #settingsMenu {
      transition: box-shadow .25s, background .3s, left .25s, transform .25s;
    }
    .drawer[aria-hidden="false"] { transition: left .25s cubic-bezier(.4,0,.2,1); }
    .drawer[aria-hidden="true"] { transition: left .25s cubic-bezier(.4,0,.2,1); }
    #settingsMenu[aria-hidden="false"] { transition: transform .25s cubic-bezier(.4,0,.2,1); }
    #settingsMenu[aria-hidden="true"] { transition: transform .25s cubic-bezier(.4,0,.2,1); }
  `;
  document.head.appendChild(transitionStyle);

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