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
    settingsBtn.onclick = () => setMenuOpen(!settingsMenuOpen);

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

    // Use settingsMenuOpen for settings menu state
    function setMenuOpen(open) {
        settingsMenuOpen = open;
        if (open) {
            renderSettingsMenu();
            settingsMenu.style.transform = 'translateX(0)';
            settingsMenu.style.boxShadow = '2px 0 12px rgba(0,0,0,.18)';
            settingsMenu.style.pointerEvents = 'auto';
// --- Bottom Button Hamburger/Side Menu Logic ---
const bottomButtonIds = [
    'addItemButton', 'activateButton', 'redriveButton', 'generalHelpToolsButton', 'downloadDataButton',
    'massUploaderButton', 'filechunker', 'pluDedupeListButton', 'scanCodeTo13PLUButton', 'pluToAsinButton',
    'getMerchantIdButton', 'getAllStoreInfoButton', 'meatInventoryToUploadConverterButton',
    'nisFileToCAMUploadButton', 'atcpropButton', 'componentUploadBuilderButton', 'auditHistoryPullButton',
    'desyncFinderButton', 'auditHistoryDashboardButton'
];

// Hamburger toggle button
const toggleMenuBtn = document.createElement('button');
toggleMenuBtn.id = 'toggle-bottom-buttons';
toggleMenuBtn.style.position = 'fixed';
toggleMenuBtn.style.left = '0';
toggleMenuBtn.style.top = 'calc(10vh + 150px)';
toggleMenuBtn.style.zIndex = '2000';
toggleMenuBtn.style.width = '36px';
toggleMenuBtn.style.height = '36px';
toggleMenuBtn.style.background = '#004E36';
toggleMenuBtn.style.color = '#fff';
toggleMenuBtn.style.border = 'none';
toggleMenuBtn.style.borderRadius = '0 5px 5px 0';
toggleMenuBtn.style.display = 'flex';
toggleMenuBtn.style.alignItems = 'center';
toggleMenuBtn.style.justifyContent = 'center';
toggleMenuBtn.style.padding = '0';
toggleMenuBtn.style.cursor = 'pointer';
toggleMenuBtn.style.boxShadow = '2px 2px 8px rgba(0,0,0,0.2)';
toggleMenuBtn.style.fontSize = '16px';
toggleMenuBtn.title = 'Show Menu';
toggleMenuBtn.style.transition = 'background 0.3s';

const hamburgerSVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>`;
const closeSVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>`;

let sideMenuOpen = false;
function updateHamburgerIcon(open) {
    toggleMenuBtn.innerHTML = open ? closeSVG : hamburgerSVG;
    toggleMenuBtn.title = open ? 'Hide Menu' : 'Show Menu';
}
updateHamburgerIcon(false);

toggleMenuBtn.addEventListener('mouseenter', function() {
    toggleMenuBtn.style.background = '#218838';
});
toggleMenuBtn.addEventListener('mouseleave', function() {
    toggleMenuBtn.style.background = '#004E36';
});

// Side menu overlay
const sideMenuOverlay = document.createElement('div');
sideMenuOverlay.id = 'bottom-buttons-side-menu-overlay';
sideMenuOverlay.style.position = 'fixed';
sideMenuOverlay.style.left = '36px';
sideMenuOverlay.style.top = '0';
sideMenuOverlay.style.width = 'calc(100vw - 36px)';
sideMenuOverlay.style.height = '100vh';
sideMenuOverlay.style.background = 'rgba(0,0,0,0.15)';
sideMenuOverlay.style.zIndex = '2999';
sideMenuOverlay.style.display = 'none';
sideMenuOverlay.addEventListener('click', function() {
    setBottomMenuOpen(false);
});

// Side menu
const sideMenu = document.createElement('div');
sideMenu.id = 'bottom-buttons-side-menu';
sideMenu.style.position = 'fixed';
sideMenu.style.left = '-220px';
sideMenu.style.top = '0';
sideMenu.style.width = '220px';
sideMenu.style.height = '100vh';
sideMenu.style.background = '#fff';
sideMenu.style.boxShadow = '2px 0 12px rgba(0,0,0,0.18)';
sideMenu.style.zIndex = '3000';
sideMenu.style.display = 'flex';
sideMenu.style.flexDirection = 'column';
sideMenu.style.alignItems = 'stretch';
sideMenu.style.padding = '18px 10px 10px 10px';
sideMenu.style.transition = 'left 0.25s cubic-bezier(.4,0,.2,1)';
sideMenu.style.borderTopRightRadius = '12px';
sideMenu.style.borderBottomRightRadius = '12px';
sideMenu.style.gap = '10px';

// Close button for side menu
const sideMenuCloseBtn = document.createElement('button');
sideMenuCloseBtn.innerHTML = '&times;';
sideMenuCloseBtn.style.position = 'absolute';
sideMenuCloseBtn.style.top = '8px';
sideMenuCloseBtn.style.right = '10px';
sideMenuCloseBtn.style.background = 'none';
sideMenuCloseBtn.style.border = 'none';
sideMenuCloseBtn.style.color = '#888';
sideMenuCloseBtn.style.fontSize = '22px';
sideMenuCloseBtn.style.cursor = 'pointer';
sideMenuCloseBtn.style.zIndex = '3001';
sideMenuCloseBtn.title = 'Close Menu';
sideMenuCloseBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    setBottomMenuOpen(false);
});
sideMenu.appendChild(sideMenuCloseBtn);

// Helper to move bottom buttons into the menu
function moveBottomButtonsToMenu() {
    // Keep the close button at the top
    sideMenu.innerHTML = '';
    sideMenu.appendChild(sideMenuCloseBtn);
    bottomButtonIds.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            // Clone the button for the menu
            const menuBtn = btn.cloneNode(true);
            menuBtn.style.position = 'static';
            menuBtn.style.width = '100%';
            menuBtn.style.left = '';
            menuBtn.style.bottom = '';
            menuBtn.style.margin = '0';
            menuBtn.style.borderRadius = '6px';
            menuBtn.style.height = '40px';
            menuBtn.style.fontSize = '15px';
            menuBtn.style.zIndex = '1';
            menuBtn.style.background = '#004E36';
            menuBtn.style.color = '#fff';
            menuBtn.style.boxShadow = 'none';
            menuBtn.style.cursor = 'pointer';
            menuBtn.addEventListener('mouseover', function() {
                menuBtn.style.background = '#218838';
            });
            menuBtn.addEventListener('mouseout', function() {
                menuBtn.style.background = '#004E36';
            });
            // Remove any duplicate event listeners by replacing node
            btn.parentNode && btn.parentNode.replaceChild(btn.cloneNode(true), btn);
            // Attach the original click event
            menuBtn.addEventListener('click', function(e) {
                btn.click();
            });
            sideMenu.appendChild(menuBtn);
        }
    });
}

function setBottomMenuOpen(open) {
    sideMenuOpen = open;
    updateHamburgerIcon(open);
    if (open) {
        moveBottomButtonsToMenu();
        sideMenuOverlay.style.display = 'block';
        sideMenu.style.display = 'flex';
        sideMenu.style.left = '0';
        // Hide original bottom buttons
        bottomButtonIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    } else {
        sideMenu.style.left = '-220px';
        sideMenuOverlay.style.display = 'none';
        setTimeout(() => {
            if (!sideMenuOpen) {
                sideMenu.style.display = 'none';
            }
        }, 250);
        // Show original bottom buttons
        bottomButtonIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = '';
        });
    }
}

toggleMenuBtn.addEventListener('click', function() {
    setBottomMenuOpen(!sideMenuOpen);
});

document.body.appendChild(toggleMenuBtn);
document.body.appendChild(sideMenuOverlay);
document.body.appendChild(sideMenu);

// Layout control based on settings
function updateMenuLayout() {
    let menuStyle = 'side';
    try {
        const settings = JSON.parse(localStorage.getItem('cam_tools_settings'));
        if (settings && settings.menuStyle) menuStyle = settings.menuStyle;
    } catch {}
    if (menuStyle === 'side') {
        toggleMenuBtn.style.display = '';
        sideMenu.style.display = sideMenuOpen ? 'flex' : 'none';
        sideMenuOverlay.style.display = sideMenuOpen ? 'block' : 'none';
        // Hide all bottom buttons (they will be shown in side menu)
        bottomButtonIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    } else {
        toggleMenuBtn.style.display = 'none';
        sideMenu.style.display = 'none';
        sideMenuOverlay.style.display = 'none';
        // Show all bottom buttons
        bottomButtonIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = '';
        });
    }
}

// Listen for settings changes
window.addEventListener('camToolsSettingsChanged', function(e) {
    updateMenuLayout();
});

// Initial layout
updateMenuLayout();
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
