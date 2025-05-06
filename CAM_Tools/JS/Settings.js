/* eslint-env browser */
(function () {
    'use strict';
  
    /* ------------------------------------------------------------------ *
     *  PERSISTENT SETTINGS
     * ------------------------------------------------------------------ */
    const SETTINGS_KEY = 'cam_tools_settings';
    function getSettings() {
      try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; }
      catch { return {}; }
    }
    function setSettings(s) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
      window.dispatchEvent(new CustomEvent('camToolsSettingsChanged', { detail: s }));
    }
  
    /* ------------------------------------------------------------------ *
     *  SETTINGS GEAR (opens side panel)
     * ------------------------------------------------------------------ */
    let settingsMenuOpen = false;
    const settingsBtn = document.createElement('button');
    Object.assign(settingsBtn.style, {
      position: 'fixed', left: '0', top: 'calc(10vh + 192px)',
      width: '36px', height: '36px', zIndex: '3100',               // ↑ keep above drawer
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: getSettings().themeColor, color: '#fff',
      border: 'none', borderRadius: '0 5px 5px 0',
      boxShadow: '2px 2px 8px rgba(0,0,0,.2)',
      cursor: 'pointer', fontSize: '16px', padding: '0',
      transition: 'background .3s'
    });
    settingsBtn.id = 'settings-btn';
    settingsBtn.title = 'Settings';
    settingsBtn.innerHTML = /* gear svg */ `
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
      </svg>`;
    settingsBtn.onmouseenter = () => settingsBtn.style.background = '#218838';
    settingsBtn.onmouseleave = () => settingsBtn.style.background = getSettings().themeColor;
    settingsBtn.onclick = () => setSettingsPanelOpen(!settingsMenuOpen);
  
    /* ------------------------------------------------------------------ *
     *  SETTINGS SIDE PANEL
     * ------------------------------------------------------------------ */
    const settingsMenu = document.createElement('div');
    Object.assign(settingsMenu.style, {
      position: 'fixed', left: '0', top: '0', width: '260px', height: '100vh',
      background: '#fff', display: 'flex', flexDirection: 'column', gap: '18px',
      padding: '22px 18px 18px', fontFamily: 'Segoe UI, Arial, sans-serif',
      borderTopRightRadius: '12px', borderBottomRightRadius: '12px',
      transform: 'translateX(-100%)', transition: 'transform .25s cubic-bezier(.4,0,.2,1)',
      boxShadow: 'none', pointerEvents: 'none', zIndex: '3001'
    });
  
    function renderSettingsMenu() {
      const s = { menuStyle: 'side', themeColor: '#004E36', ...getSettings() };
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
            <option value="side"   ${s.menuStyle === 'side' ? 'selected' : ''}>Side Pop‑out Menu</option>
            <option value="bottom" ${s.menuStyle === 'bottom' ? 'selected' : ''}>Bottom Nav Bar</option>
          </select>
        </label>
  
        <label style="display:block">
          <span style="font-weight:500;display:block;margin-bottom:4px">Theme Color</span>
          <input type="color" id="themeColor" value="${s.themeColor}"
                 style="width:40px;height:32px;border:none;vertical-align:middle">
          <span style="margin-left:10px;font-size:14px">${s.themeColor}</span>
        </label>`;
      /* wiring */
      settingsMenu.querySelector('#settings-close').onclick = () => setSettingsPanelOpen(false);
      settingsMenu.querySelector('#menuStyle').onchange = e => {
        const ns = { ...getSettings(), menuStyle: e.target.value };
        setSettings(ns);
      };
      settingsMenu.querySelector('#themeColor').oninput = e => {
        const ns = { ...getSettings(), themeColor: e.target.value };
        setSettings(ns);
        settingsBtn.style.background = ns.themeColor;
        settingsMenu.querySelector('span:last-of-type').textContent = ns.themeColor;
      };
    }
  
    function setSettingsPanelOpen(open) {
      settingsMenuOpen = open;
      if (open) {
        renderSettingsMenu();
        settingsMenu.style.transform = 'translateX(0)';
        settingsMenu.style.boxShadow = '2px 0 12px rgba(0,0,0,.18)';
        settingsMenu.style.pointerEvents = 'auto';
      } else {
        settingsMenu.style.transform = 'translateX(-100%)';
        settingsMenu.style.boxShadow = 'none';
        settingsMenu.style.pointerEvents = 'none';
      }
    }
  
    /* ------------------------------------------------------------------ *
     *  UNIVERSAL HAMBURGER (toggles nav)
     * ------------------------------------------------------------------ */
    const bottomButtonIds = [ /* 'homeBtn', 'searchBtn', ... */ ];
  
    const toggleBtn = document.createElement('button');
    Object.assign(toggleBtn.style, {
      position: 'fixed', left: '0', top: 'calc(10vh + 150px)',
      width: '36px', height: '36px', zIndex: '3100',              // ↑ keep above drawer
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#004E36', color: '#fff', border: 'none',
      borderRadius: '0 5px 5px 0', boxShadow: '2px 2px 8px rgba(0,0,0,.2)',
      cursor: 'pointer', fontSize: '16px', padding: '0', transition: 'background .3s'
    });
    toggleBtn.title = 'Show Menu';
    const hamburgerSVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                             stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="4" y1="7"  x2="20" y2="7"/>
                            <line x1="4" y1="12" x2="20" y2="12"/>
                            <line x1="4" y1="17" x2="20" y2="17"/></svg>`;
    const closeSVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                             stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="5"  y1="5"  x2="19" y2="19"/>
                            <line x1="19" y1="5"  x2="5"  y2="19"/></svg>`;
  
    toggleBtn.onmouseenter = () => toggleBtn.style.background = '#218838';
    toggleBtn.onmouseleave = () => toggleBtn.style.background = '#004E36';
  
    let sideMenuOpen = false;
    let bottomBarVisible = true;
    function updateHamburger(open) {
      toggleBtn.innerHTML = open ? closeSVG : hamburgerSVG;
      toggleBtn.title = open ? 'Hide Menu' : 'Show Menu';
    }
    updateHamburger(false);
  
    /* -------------------- side‑drawer (for menuStyle = "side") -------------------- */
    const drawerOverlay = document.createElement('div');
    const drawer = document.createElement('div');
    Object.assign(drawerOverlay.style, {
      position: 'fixed', left: '36px', top: '0', width: 'calc(100vw - 36px)', height: '100vh',
      background: 'rgba(0,0,0,.15)', zIndex: '2999', display: 'none'
    });
    Object.assign(drawer.style, {
      position: 'fixed', left: '-220px', top: '0',
      width: '220px', height: '100vh', background: '#fff',
      boxShadow: '2px 0 12px rgba(0,0,0,.18)', borderTopRightRadius: '12px',
      borderBottomRightRadius: '12px', padding: '18px 10px 10px',
      display: 'flex', flexDirection: 'column', gap: '10px',
      transition: 'left .25s cubic-bezier(.4,0,.2,1)', zIndex: '3000'
    });
    const drawerClose = document.createElement('button');
    Object.assign(drawerClose.style, {
      position: 'absolute', top: '8px', right: '10px',
      background: 'none', border: 'none', fontSize: '22px', color: '#888', cursor: 'pointer'
    });
    drawerClose.innerHTML = '&times;';
    drawer.appendChild(drawerClose);
  
    function populateDrawer() {
      drawer.querySelectorAll('.drawer-item').forEach(n => n.remove());
      bottomButtonIds.forEach(id => {
        const src = document.getElementById(id);
        if (!src) return;
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
  
    function setSideDrawerOpen(open) {
      sideMenuOpen = open;
      updateHamburger(open);
      if (open) {
        populateDrawer();
        drawerOverlay.style.display = 'block';
        drawer.style.left = '0';
        bottomButtonIds.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.style.display = 'none';
        });
      } else {
        drawer.style.left = '-220px';
        drawerOverlay.style.display = 'none';
        bottomButtonIds.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.style.display = 'none';  // stay hidden in side mode
        });
      }
    }
    drawerOverlay.onclick = () => setSideDrawerOpen(false);
    drawerClose.onclick = e => { e.stopPropagation(); setSideDrawerOpen(false); };
  
    /* -------------------- bottom bar toggle (for menuStyle = "bottom") ----------- */
    function setBottomBarVisible(visible) {
      bottomBarVisible = visible;
      updateHamburger(visible);
      bottomButtonIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = visible ? '' : 'none';
      });
    }
  
    /* -------------------- hamburger click dispatcher ----------------------------- */
    toggleBtn.onclick = () => {
      const { menuStyle = 'side' } = getSettings();
      if (menuStyle === 'side') setSideDrawerOpen(!sideMenuOpen);
      else setBottomBarVisible(!bottomBarVisible);
    };
  
    /* ------------------------------------------------------------------ *
     *  LAYOUT REFRESH WHEN SETTINGS CHANGE
     * ------------------------------------------------------------------ */
    function refreshLayout() {
      const { menuStyle = 'side' } = getSettings();

      // always show hamburger
      toggleBtn.style.display = '';

      // Always reset both states to false on menuStyle change for consistency
      sideMenuOpen = false;
      bottomBarVisible = false;

      if (menuStyle === 'side') {
        setBottomBarVisible(false);
        setSideDrawerOpen(false); // ensure drawer is closed initially
        drawerOverlay.style.display = 'none';
        drawer.style.display = 'flex';
      } else {  // bottom layout
        setSideDrawerOpen(false);
        setBottomBarVisible(false); // ensure bottom bar is hidden initially
        drawerOverlay.style.display = 'none';
        drawer.style.display = 'none';
      }
    }
    window.addEventListener('camToolsSettingsChanged', refreshLayout);
  
    /* ------------------------------------------------------------------ *
     *  MOUNT EVERYTHING
     * ------------------------------------------------------------------ */
    document.body.append(
      settingsBtn, settingsMenu,
      toggleBtn, drawerOverlay, drawer
    );
  
    // first layout pass *after* the nodes exist
    refreshLayout();
  
  })();
  