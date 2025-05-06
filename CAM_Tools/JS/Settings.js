// Settings.js  (updated)
/* eslint-env browser */
(function () {
    'use strict';

    /* ---------- Settings state ---------- */
    const SETTINGS_KEY = 'cam_tools_settings';
    function getSettings() {
        try {
            return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {
                menuStyle: 'side',          // 'side' or 'bottom'
                themeColor: '#004E36'
            };
        } catch {
            return { menuStyle: 'side', themeColor: '#004E36' };
        }
    }
    function setSettings(settings) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        window.dispatchEvent(new CustomEvent('camToolsSettingsChanged', { detail: settings }));
    }

    /* ---------- Settings button ---------- */
    const settingsBtn = document.createElement('button');
    Object.assign(settingsBtn.style, {
        position: 'fixed',
        left: '0',
        top: 'calc(10vh + 192px)',
        zIndex: '2000',
        width: '36px',
        height: '36px',
        background: getSettings().themeColor,
        color: '#fff',
        border: 'none',
        borderRadius: '0 5px 5px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0',
        cursor: 'pointer',
        boxShadow: '2px 2px 8px rgba(0,0,0,.2)',
        fontSize: '16px',
        transition: 'background .3s'
    });
    settingsBtn.id = 'settings-btn';
    settingsBtn.title = 'Settings';
    settingsBtn.innerHTML = `
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
                 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0
                 0 19.4 8c.14.31.22.65.22 1v.09A1.65
                 1.65 0 0 0 21 12c0 .35-.08.69-.22 1z"/>
      </svg>`;

    settingsBtn.onmouseenter = () => { settingsBtn.style.background = '#218838'; };
    settingsBtn.onmouseleave = () => { settingsBtn.style.background = getSettings().themeColor; };
    settingsBtn.onclick = () => setMenuOpen(!menuOpen);

    /* ---------- Settings menu ---------- */
    const settingsMenu = document.createElement('div');
    settingsMenu.id = 'settings-menu';
    Object.assign(settingsMenu.style, {
        position: 'fixed',
        left: '0',
        top: '0',
        width: '260px',
        height: '100vh',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        padding: '22px 18px 18px',
        gap: '18px',
        fontFamily: 'Segoe UI, Arial, sans-serif',
        borderTopRightRadius: '12px',
        borderBottomRightRadius: '12px',
        zIndex: '3001',
        transform: 'translateX(-100%)',                  // hidden by default
        transition: 'transform .25s cubic-bezier(.4,0,.2,1)',
        boxShadow: 'none',
        pointerEvents: 'none'                            // block clicks when hidden
    });

    function renderSettingsMenu() {
        const s = getSettings();
        settingsMenu.innerHTML = `
        <div style="font-size:18px;font-weight:bold;color:#004E36;
                    margin-bottom:8px;display:flex;align-items:center;gap:8px;">
            <span>Settings</span><span style="flex:1"></span>
            <button id="settings-close-btn" style="background:none;border:none;
                    color:#888;font-size:22px;cursor:pointer;">&times;</button>
        </div>

        <div style="margin-bottom:10px;">
          <label style="font-weight:500;display:block;margin-bottom:4px;">Bottom Button Layout</label>
          <select id="menuStyleSelect"
                  style="width:100%;padding:7px 10px;border:1px solid #ccc;
                         border-radius:5px;font-size:15px;">
              <option value="side" ${s.menuStyle === 'side' ? 'selected' : ''}>Side Pop‑out Menu</option>
              <option value="bottom" ${s.menuStyle === 'bottom' ? 'selected' : ''}>Bottom Nav Bar</option>
          </select>
        </div>

        <div>
          <label style="font-weight:500;display:block;margin-bottom:4px;">Theme Color</label>
          <input type="color" id="themeColorPicker" value="${s.themeColor}"
                 style="width:40px;height:32px;border:none;vertical-align:middle;">
          <span style="margin-left:10px;font-size:14px;">${s.themeColor}</span>
        </div>`;
        // hooks
        settingsMenu.querySelector('#settings-close-btn').onclick = () => setMenuOpen(false);
        settingsMenu.querySelector('#menuStyleSelect').onchange = e => {
            const ns = getSettings();
            ns.menuStyle = e.target.value;
            setSettings(ns);
        };
        settingsMenu.querySelector('#themeColorPicker').oninput = e => {
            const ns = getSettings();
            ns.themeColor = e.target.value;
            setSettings(ns);
            settingsBtn.style.background = ns.themeColor;
        };
    }

    let menuOpen = false;
    function setMenuOpen(open) {
        menuOpen = open;
        if (open) {
            renderSettingsMenu();
            settingsMenu.style.transform = 'translateX(0)';
            settingsMenu.style.boxShadow = '2px 0 12px rgba(0,0,0,.18)';
            settingsMenu.style.pointerEvents = 'auto';
            settingsMenu.setAttribute('aria-hidden', 'false');
        } else {
            settingsMenu.style.transform = 'translateX(-100%)';
            settingsMenu.style.boxShadow = 'none';
            settingsMenu.style.pointerEvents = 'none';
            settingsMenu.setAttribute('aria-hidden', 'true');
        }
    }

    /* ---------- React to external changes ---------- */
    window.addEventListener('camToolsSettingsChanged', e => {
        settingsBtn.style.background = e.detail.themeColor;
    });

    /* ---------- Mount ---------- */
    document.body.append(settingsBtn, settingsMenu);
})();
