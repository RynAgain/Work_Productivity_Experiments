// Settings.js
(function () {
    'use strict';

    // --- Settings State ---
    const SETTINGS_KEY = 'cam_tools_settings';
    function getSettings() {
        try {
            return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {
                menuStyle: 'side', // 'side' or 'bottom'
                themeColor: '#004E36'
            };
        } catch {
            return { menuStyle: 'side', themeColor: '#004E36' };
        }
    }
    function setSettings(settings) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        // Dispatch event for other scripts to listen for changes
        window.dispatchEvent(new CustomEvent('camToolsSettingsChanged', { detail: settings }));
    }

    // --- Settings Button ---
    const settingsBtn = document.createElement('button');
    settingsBtn.id = 'settings-btn';
    settingsBtn.style.position = 'fixed';
    settingsBtn.style.left = '0';
    settingsBtn.style.top = 'calc(10vh + 192px)';
    settingsBtn.style.zIndex = '2000';
    settingsBtn.style.width = '36px';
    settingsBtn.style.height = '36px';
    settingsBtn.style.background = getSettings().themeColor;
    settingsBtn.style.color = '#fff';
    settingsBtn.style.border = 'none';
    settingsBtn.style.borderRadius = '0 5px 5px 0';
    settingsBtn.style.display = 'flex';
    settingsBtn.style.alignItems = 'center';
    settingsBtn.style.justifyContent = 'center';
    settingsBtn.style.padding = '0';
    settingsBtn.style.cursor = 'pointer';
    settingsBtn.style.boxShadow = '2px 2px 8px rgba(0,0,0,0.2)';
    settingsBtn.style.fontSize = '16px';
    settingsBtn.title = 'Settings';
    settingsBtn.style.transition = 'background 0.3s';

    // Gear SVG
    const gearSVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 16 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 8c.14.31.22.65.22 1v.09A1.65 1.65 0 0 0 21 12c0 .35-.08.69-.22 1z"/></svg>`;
    settingsBtn.innerHTML = gearSVG;

    settingsBtn.addEventListener('mouseenter', function () {
        settingsBtn.style.background = '#218838';
    });
    settingsBtn.addEventListener('mouseleave', function () {
        settingsBtn.style.background = getSettings().themeColor;
    });

    // --- Settings Menu ---
    const settingsMenu = document.createElement('div');
    settingsMenu.id = 'settings-menu';
    settingsMenu.style.position = 'fixed';
    settingsMenu.style.left = '-260px';
    settingsMenu.style.top = '0';
    settingsMenu.style.width = '260px';
    settingsMenu.style.height = '100vh';
    settingsMenu.style.background = '#fff';
    settingsMenu.style.boxShadow = '2px 0 12px rgba(0,0,0,0.18)';
    settingsMenu.style.zIndex = '3001';
    settingsMenu.style.display = 'flex';
    settingsMenu.style.flexDirection = 'column';
    settingsMenu.style.alignItems = 'stretch';
    settingsMenu.style.padding = '22px 18px 18px 18px';
    settingsMenu.style.transition = 'left 0.25s cubic-bezier(.4,0,.2,1)';
    settingsMenu.style.borderTopRightRadius = '12px';
    settingsMenu.style.borderBottomRightRadius = '12px';
    settingsMenu.style.gap = '18px';
    settingsMenu.style.fontFamily = 'Segoe UI, Arial, sans-serif';

    // Settings content
    function renderSettingsMenu() {
        const settings = getSettings();
        settingsMenu.innerHTML = `
            <div style="font-size:18px;font-weight:bold;color:#004E36;margin-bottom:8px;display:flex;align-items:center;gap:8px;">
                <span>Settings</span>
                <span style="flex:1"></span>
                <button id="settings-close-btn" style="background:none;border:none;color:#888;font-size:22px;cursor:pointer;">&times;</button>
            </div>
            <div style="margin-bottom:10px;">
                <label style="font-weight:500;display:block;margin-bottom:4px;">Bottom Button Layout</label>
                <select id="menuStyleSelect" style="width:100%;padding:7px 10px;border:1px solid #ccc;border-radius:5px;font-size:15px;">
                    <option value="side" ${settings.menuStyle === 'side' ? 'selected' : ''}>Side Pop-out Menu</option>
                    <option value="bottom" ${settings.menuStyle === 'bottom' ? 'selected' : ''}>Bottom Nav Bar</option>
                </select>
            </div>
            <div>
                <label style="font-weight:500;display:block;margin-bottom:4px;">Theme Color</label>
                <input type="color" id="themeColorPicker" value="${settings.themeColor}" style="width:40px;height:32px;border:none;vertical-align:middle;">
                <span style="margin-left:10px;font-size:14px;">${settings.themeColor}</span>
            </div>
        `;
        // Close button
        settingsMenu.querySelector('#settings-close-btn').onclick = () => setMenuOpen(false);
        // Menu style select
        settingsMenu.querySelector('#menuStyleSelect').onchange = (e) => {
            const newSettings = getSettings();
            newSettings.menuStyle = e.target.value;
            setSettings(newSettings);
        };
        // Theme color picker
        settingsMenu.querySelector('#themeColorPicker').oninput = (e) => {
            const newSettings = getSettings();
            newSettings.themeColor = e.target.value;
            setSettings(newSettings);
            // Update button color live
            settingsBtn.style.background = newSettings.themeColor;
        };
    }

    let menuOpen = false;
    function setMenuOpen(open) {
        menuOpen = open;
        if (open) {
            renderSettingsMenu();
            settingsMenu.style.left = '0';
        } else {
            settingsMenu.style.left = '-260px';
        }
    }

    settingsBtn.addEventListener('click', function () {
        setMenuOpen(!menuOpen);
    });

    // Listen for settings changes to update UI
    window.addEventListener('camToolsSettingsChanged', (e) => {
        const settings = e.detail;
        settingsBtn.style.background = settings.themeColor;
    });

    // Add to DOM
    document.body.appendChild(settingsBtn);
    document.body.appendChild(settingsMenu);
})();