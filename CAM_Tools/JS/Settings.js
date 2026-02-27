/* eslint-env browser */
(function () {
  'use strict';
  //001
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
  
  // ------------------------------------------------------------------
  //  UPDATE SYSTEM CONFIGURATION
  // ------------------------------------------------------------------
  const CAM_TOOLS_VERSION = '3.0.0'; // Extracted from MainScript.user.js @version
  const GITHUB_API_URL = 'https://api.github.com/repos/RynAgain/Work_Productivity_Experiments/releases/latest';
  const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/RynAgain/Work_Productivity_Experiments/main/CAM_Tools/MainScript.user.js';
  const UPDATE_CHECK_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
  const UPDATE_STORAGE_PREFIX = 'cam_tools_update_';
  
  const defaultSettings = {
    menuStyle: 'side',
    accentTheme: 'blue',
    autoCheckUpdates: true,
    updateCheckInterval: UPDATE_CHECK_INTERVAL,
    __version: SETTINGS_VERSION
  };
  let state = {
    settingsMenuOpen: false,
    sideMenuOpen: false,
    bottomBarVisible: false,
    // Update system state
    updateModalOpen: false,
    updateCheckInProgress: false,
    lastUpdateCheck: 0,
    availableUpdate: null,
    skippedVersion: null,
    ...defaultSettings,
    ...getSettings()
  };

  // ------------------------------------------------------------------
  //  THEME HELPERS (reads from tm-theme.js CSS vars at runtime)
  // ------------------------------------------------------------------
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  function accent()    { return cssVar('--tm-accent-primary') || '#3ea6ff'; }
  function accentHov() { return cssVar('--tm-accent-hover')   || '#65b8ff'; }

  // Only persist these keys
  function persistSettings() {
    setSettings({
      menuStyle: state.menuStyle,
      accentTheme: state.accentTheme,
      autoCheckUpdates: state.autoCheckUpdates,
      updateCheckInterval: state.updateCheckInterval
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
  //  UPDATE SYSTEM STORAGE
  // ------------------------------------------------------------------
  function getUpdateData(key, defaultValue = null) {
    try {
      const stored = localStorage.getItem(UPDATE_STORAGE_PREFIX + key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  function setUpdateData(key, value) {
    try {
      localStorage.setItem(UPDATE_STORAGE_PREFIX + key, JSON.stringify(value));
    } catch (error) {
      console.warn('[Settings] Failed to store update data:', error);
    }
  }

  // ------------------------------------------------------------------
  //  UPDATE SYSTEM CORE FUNCTIONALITY
  // ------------------------------------------------------------------
  let updateCheckInterval = null;

  function isNewerVersion(latest, current) {
    const latestParts = latest.split('.').map(part => parseInt(part, 10));
    const currentParts = current.split('.').map(part => parseInt(part, 10));
    
    const maxLength = Math.max(latestParts.length, currentParts.length);
    while (latestParts.length < maxLength) latestParts.push(0);
    while (currentParts.length < maxLength) currentParts.push(0);
    
    for (let i = 0; i < maxLength; i++) {
      if (latestParts[i] > currentParts[i]) return true;
      if (latestParts[i] < currentParts[i]) return false;
    }
    
    return false;
  }

  function extractVersionFromScript(scriptContent) {
    const versionMatch = scriptContent.match(/@version\s+([^\s]+)/);
    return versionMatch ? versionMatch[1].trim() : null;
  }

  async function checkForUpdates(showNoUpdateMessage = false) {
    if (state.updateCheckInProgress) return;
    
    setState({ updateCheckInProgress: true });
    
    try {
      const lastCheck = getUpdateData('lastVersionCheck', 0);
      const now = Date.now();
      
      if (!showNoUpdateMessage && (now - lastCheck) < state.updateCheckInterval) {
        setState({ updateCheckInProgress: false });
        return;
      }
      
      let latestVersion = null;
      try {
        const response = await fetch(GITHUB_API_URL, {
          cache: 'no-cache',
          headers: { 'User-Agent': 'CAM-Tools-Update-Checker' }
        });
        
        if (response.ok) {
          const releaseData = await response.json();
          latestVersion = releaseData.tag_name?.replace(/^v/, '') || null;
        }
      } catch (apiError) {
        console.warn('[Settings] GitHub API failed, trying raw file:', apiError);
      }
      
      if (!latestVersion) {
        const response = await fetch(GITHUB_RAW_URL, {
          cache: 'no-cache',
          headers: { 'User-Agent': 'CAM-Tools-Update-Checker' }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const scriptContent = await response.text();
        latestVersion = extractVersionFromScript(scriptContent);
        
        if (!latestVersion) {
          throw new Error('Could not extract version from script');
        }
      }
      
      setUpdateData('lastVersionCheck', now);
      setState({ lastUpdateCheck: now });
      
      const skippedVersion = getUpdateData('skippedVersion');
      const hasUpdate = isNewerVersion(latestVersion, CAM_TOOLS_VERSION);
      const shouldNotify = hasUpdate && latestVersion !== skippedVersion;
      
      if (shouldNotify) {
        setState({
          availableUpdate: latestVersion,
          updateModalOpen: true
        });
      } else if (showNoUpdateMessage) {
        showUpdateStatusMessage(hasUpdate ? 'skipped' : 'current', latestVersion);
      }
      
    } catch (error) {
      console.error('[Settings] Update check failed:', error);
      if (showNoUpdateMessage) {
        showUpdateStatusMessage('error', null, error.message);
      }
    } finally {
      setState({ updateCheckInProgress: false });
    }
  }

  // Show update status via toast (replaces alert())
  function showUpdateStatusMessage(status, version, errorMsg) {
    const toast = window.TmTheme ? window.TmTheme.showToast : null;
    
    switch (status) {
      case 'current':
        if (toast) {
          toast(`Running latest version (v${CAM_TOOLS_VERSION})`, 'success', 4000);
        }
        break;
      case 'skipped':
        if (toast) {
          toast(`Update v${version} available but skipped`, 'info', 4000);
        }
        break;
      case 'error':
        if (toast) {
          toast(`Update check failed: ${errorMsg}`, 'error', 5000);
        }
        break;
    }
  }

  function initializeUpdateSystem() {
    setState({
      lastUpdateCheck: getUpdateData('lastVersionCheck', 0),
      skippedVersion: getUpdateData('skippedVersion')
    });
    
    if (!state.autoCheckUpdates) return;
    
    setTimeout(() => {
      checkForUpdates(false);
    }, 5000);
    
    if (updateCheckInterval) clearInterval(updateCheckInterval);
    updateCheckInterval = setInterval(() => {
      if (state.autoCheckUpdates) {
        checkForUpdates(false);
      }
    }, state.updateCheckInterval);
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
  //  CSS FOR VISUAL HIDING + DARK MODE OVERRIDES
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
  //  UI ELEMENTS  (dark mode)
  // ------------------------------------------------------------------
  const settingsBtn = createButton({
    id: 'settings-btn',
    title: 'Settings',
    html: `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
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
      width: '36px', height: '36px', zIndex: '9999',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#1a1a1a', color: '#f1f1f1',
      border: '1px solid #303030', borderLeft: 'none',
      borderRadius: '0 8px 8px 0',
      boxShadow: '2px 2px 8px rgba(0,0,0,.4)',
      cursor: 'pointer', fontSize: '16px', padding: '0',
      transition: 'background 150ms ease'
    }
  });

  const hamburgerSVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <line x1="4" y1="7"  x2="20" y2="7"/>
    <line x1="4" y1="12" x2="20" y2="12"/>
    <line x1="4" y1="17" x2="20" y2="17"/></svg>`;
  const closeSVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <line x1="5"  y1="5"  x2="19" y2="19"/>
    <line x1="19" y1="5"  x2="5"  y2="19"/></svg>`;

  const toggleBtn = createButton({
    title: 'Show Menu',
    html: hamburgerSVG,
    style: {
      position: 'fixed', left: '0', top: 'calc(10vh + 150px)',
      width: '36px', height: '36px', zIndex: '9999',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#1a1a1a', color: '#f1f1f1',
      border: '1px solid #303030', borderLeft: 'none',
      borderRadius: '0 8px 8px 0',
      boxShadow: '2px 2px 8px rgba(0,0,0,.4)',
      cursor: 'pointer', fontSize: '16px', padding: '0',
      transition: 'background 150ms ease'
    }
  });

  // Settings Menu Panel (dark)
  const settingsMenu = document.createElement('div');
  Object.assign(settingsMenu.style, {
    position: 'fixed',
    left: '36px',
    top: 'calc(10vh + 192px)',
    width: '280px',
    maxWidth: '90vw',
    height: 'calc(100vh - (10vh + 192px))',
    background: '#1a1a1a',
    color: '#f1f1f1',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    padding: '22px 18px 18px',
    fontFamily: "'Roboto', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
    borderTopRightRadius: '12px',
    borderBottomRightRadius: '12px',
    border: '1px solid #303030',
    borderLeft: 'none',
    transform: 'translateX(-10000px)',
    transition: 'transform .25s cubic-bezier(.4,0,.2,1)',
    boxShadow: 'none',
    pointerEvents: 'none',
    zIndex: '9999',
    overflowY: 'auto'
  });

  // Drawer Overlay
  const drawerOverlay = document.createElement('div');
  Object.assign(drawerOverlay.style, {
    position: 'fixed',
    left: '36px',
    top: 'calc(10vh + 192px)',
    width: 'calc(100vw - 36px)',
    height: 'calc(100vh - (10vh + 192px))',
    background: 'rgba(0,0,0,.4)',
    zIndex: '9990',
    display: 'none'
  });

  /** Icon Bar for Side Menu (dark) **/
  const iconBar = document.createElement('div');
  Object.assign(iconBar.style, {
    position: 'fixed',
    left: '0',
    top: 'calc(10vh + 192px + 36px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    zIndex: '9999',
    background: 'transparent',
    padding: '8px 0',
    width: '36px',
    pointerEvents: 'auto'
  });
  iconBar.setAttribute('aria-label', 'Quick Tools');
  iconBar.setAttribute('role', 'menu');

  // ------------------------------------------------------------------
  //  UPDATE NOTIFICATION MODAL (dark)
  // ------------------------------------------------------------------
  function createUpdateModal(latestVersion) {
    const modal = document.createElement('div');
    Object.assign(modal.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '9995',
      fontFamily: "'Roboto', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif"
    });

    const modalContent = document.createElement('div');
    Object.assign(modalContent.style, {
      background: '#1a1a1a',
      border: '1px solid #303030',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '480px',
      width: '90%',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
      position: 'relative',
      animation: 'tm-fade-in 150ms ease-out'
    });

    const a = accent();
    modalContent.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 20px;">
        <div style="width: 48px; height: 48px; background: ${a}; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center; margin-right: 16px; flex-shrink: 0;">
          <svg width="24" height="24" fill="#0f0f0f" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <div>
          <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #f1f1f1;">
            CAM Tools Update Available
          </h2>
          <p style="margin: 4px 0 0; color: #aaaaaa; font-size: 14px;">
            A new version is ready to install
          </p>
        </div>
      </div>
      
      <div style="background: #242424; border: 1px solid #303030; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-weight: 500; color: #f1f1f1;">Current Version:</span>
          <span style="font-family: monospace; color: #aaaaaa;">${CAM_TOOLS_VERSION}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="font-weight: 500; color: #f1f1f1;">Latest Version:</span>
          <span style="font-family: monospace; color: ${a}; font-weight: 600;">${latestVersion}</span>
        </div>
      </div>
      
      <p style="color: #aaaaaa; line-height: 1.5; margin-bottom: 24px; font-size: 14px;">
        Click "Update Now" to open the latest version in a new tab. Install it through Tampermonkey.
      </p>
      
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="update-skip-btn" style="padding: 8px 16px; border: 1px solid #3f3f3f; background: transparent;
                color: #aaaaaa; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 500;
                transition: background 150ms ease;">
          Skip Version
        </button>
        <button id="update-remind-btn" style="padding: 8px 16px; border: 1px solid ${a};
                background: transparent; color: ${a}; border-radius: 4px; cursor: pointer;
                font-size: 14px; font-weight: 500; transition: all 150ms ease;">
          Remind Later
        </button>
        <button id="update-now-btn" style="padding: 8px 20px; border: none; background: ${a};
                color: #0f0f0f; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 600;
                transition: background 150ms ease;">
          Update Now
        </button>
      </div>
    `;

    // Event handlers
    const updateBtn = modalContent.querySelector('#update-now-btn');
    const remindBtn = modalContent.querySelector('#update-remind-btn');
    const skipBtn = modalContent.querySelector('#update-skip-btn');

    updateBtn.onclick = () => {
      window.open(GITHUB_RAW_URL, '_blank');
      closeUpdateModal();
    };

    remindBtn.onclick = () => {
      setUpdateData('lastVersionCheck', 0);
      setState({ lastUpdateCheck: 0 });
      closeUpdateModal();
    };

    skipBtn.onclick = () => {
      setUpdateData('skippedVersion', latestVersion);
      setState({ skippedVersion: latestVersion });
      closeUpdateModal();
    };

    function closeUpdateModal() {
      setState({ updateModalOpen: false, availableUpdate: null });
      if (document.body.contains(modal)) {
        document.body.removeChild(modal);
      }
    }

    modal.onclick = (e) => {
      if (e.target === modal) closeUpdateModal();
    };

    modal.onkeydown = (e) => {
      if (e.key === 'Escape') closeUpdateModal();
    };

    modal.appendChild(modalContent);
    return modal;
  }

  // ------------------------------------------------------------------
  //  STATIC SIDE MENU CONFIGURATION
  // ------------------------------------------------------------------
  const sideMenuItems = [
    {
      label: 'Download',
      tooltip: 'Download Data',
      icon: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 3v14m0 0l-5-5m5 5l5-5"/><rect x="4" y="19" width="16" height="2" rx="1" fill="currentColor" stroke="none"/></svg>`,
      action: () => document.getElementById('downloadDataButton')?.click()
    },
    {
      label: 'Add',
      tooltip: 'Add Item',
      icon: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
      action: () => document.getElementById('addItemButton')?.click()
    },
    {
      label: 'Activate',
      tooltip: 'Activate/Deactivate',
      icon: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="7" rx="2"/><circle cx="12" cy="8" r="3"/></svg>`,
      action: () => document.getElementById('activateButton')?.click()
    },
    {
      label: 'Redrive',
      tooltip: 'Redrive',
      icon: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="6" rx="2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4"/></svg>`,
      action: () => document.getElementById('redriveButton')?.click()
    },
    {
      label: 'Help',
      tooltip: 'General Help Tools',
      icon: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12" y2="17"/></svg>`,
      action: () => document.getElementById('generalHelpToolsButton')?.click()
    },
    {
      label: 'Editor',
      tooltip: 'Edit Existing Items',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>`,
      action: () => document.getElementById('tm-ei-openEditor')?.click()
    }
  ];

  // ------------------------------------------------------------------
  //  EXTRA OBSERVER FOR EDITOR ICON (stub)
  // ------------------------------------------------------------------
  const editorObserver = new MutationObserver(() => {});
  editorObserver.observe(document.body, { childList: true, subtree: true });

  const bottomButtonIds = ['redriveButton', 'addItemButton', 'downloadDataButton', 'activateButton', 'generalHelpToolsButton', 'tm-ei-openEditor'];

  // ------------------------------------------------------------------
  //  RENDER FUNCTION
  // ------------------------------------------------------------------
  function render() {
    // Settings Button -- accent tint on hover handled via events
    settingsBtn.style.background = '#1a1a1a';

    // Settings Menu
    if (state.settingsMenuOpen) {
      renderSettingsMenu();
      settingsMenu.style.transform = 'translateX(0)';
      settingsMenu.style.boxShadow = '4px 0 20px rgba(0,0,0,.5)';
      settingsMenu.style.pointerEvents = 'auto';
      settingsMenu.setAttribute('aria-hidden', 'false');
      setTimeout(() => {
        const firstInput = settingsMenu.querySelector('select, input[type="color"]');
        if (firstInput) firstInput.focus();
      }, 100);
    } else {
      settingsMenu.style.transform = 'translateX(-4000px)';
      settingsMenu.style.boxShadow = 'none';
      settingsMenu.style.pointerEvents = 'none';
      settingsMenu.setAttribute('aria-hidden', 'true');
    }

    // Hamburger/Close Button
    toggleBtn.innerHTML = (state.sideMenuOpen || state.bottomBarVisible) ? closeSVG : hamburgerSVG;
    toggleBtn.title = (state.sideMenuOpen || state.bottomBarVisible) ? 'Hide Menu' : 'Show Menu';

    // Update Modal
    const existingModal = document.getElementById('cam-tools-update-modal');
    if (state.updateModalOpen && state.availableUpdate) {
      if (!existingModal) {
        const modal = createUpdateModal(state.availableUpdate);
        modal.id = 'cam-tools-update-modal';
        document.body.appendChild(modal);
      }
    } else if (existingModal) {
      document.body.removeChild(existingModal);
    }

    // Icon Bar (side menu mode)
    if (state.menuStyle === 'side') {
      if (state.bottomBarVisible) {
        state.bottomBarVisible = false;
      }
      bottomButtonIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('nav-bar-hidden');
      });
      // Render icon bar (dark themed)
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
          background: '#1a1a1a',
          color: '#f1f1f1',
          border: '1px solid #303030',
          borderLeft: 'none',
          borderRadius: '0 8px 8px 0',
          cursor: 'pointer',
          margin: '0',
          padding: '0',
          boxShadow: '2px 2px 8px rgba(0,0,0,0.3)',
          transition: 'background 150ms ease'
        });
        btn.onmouseenter = () => { btn.style.background = '#242424'; };
        btn.onmouseleave = () => { btn.style.background = '#1a1a1a'; };
        btn.onclick = item.action;
        iconBar.appendChild(btn);
      });
      iconBar.style.display = '';
    } else {
      bottomButtonIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('nav-bar-hidden');
        if (el) el.style.display = state.bottomBarVisible ? '' : 'none';
      });
      iconBar.style.display = 'none';
    }
  }

  // ------------------------------------------------------------------
  //  SETTINGS MENU CONTENT (dark)
  // ------------------------------------------------------------------
  function renderSettingsMenu() {
    const a = accent();
    const currentAccent = (window.TmTheme && window.TmTheme.getAccent) ? window.TmTheme.getAccent() : 'blue';

    settingsMenu.innerHTML = `
      <div style="font-size:18px;font-weight:600;color:#f1f1f1;
                  display:flex;align-items:center;gap:8px;margin-bottom:8px;
                  font-family:'Roboto','Segoe UI',sans-serif">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaaaaa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 16 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06-.06A1.65 1.65 0 0 0 19.4 8c.14.31.22.65.22 1z"/>
        </svg>
        <span>Settings</span><span style="flex:1"></span>
        <button id="settings-close" style="background:none;border:none;
                font-size:22px;color:#717171;cursor:pointer;padding:4px;
                transition:color 150ms ease">&times;</button>
      </div>

      <!-- Appearance Section (collapsible) -->
      <details open style="margin-bottom:4px;">
        <summary style="font-size:14px;font-weight:600;color:#f1f1f1;cursor:pointer;padding:8px 0;
                        display:flex;align-items:center;gap:8px;list-style:none;user-select:none;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${a}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 16 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06-.06A1.65 1.65 0 0 0 19.4 8c.14.31.22.65.22 1z"/>
          </svg>
          Appearance
        </summary>
        <div style="padding:4px 0 8px;">
          <span style="font-weight:500;display:block;margin-bottom:6px;color:#aaaaaa;font-size:13px">Accent Color</span>
          <div style="display:flex;gap:8px;margin-bottom:12px">
            <button id="accent-blue" style="flex:1;padding:8px;border-radius:4px;cursor:pointer;font-size:13px;font-weight:500;
                    border:1px solid ${currentAccent === 'blue' ? '#3ea6ff' : '#3f3f3f'};
                    background:${currentAccent === 'blue' ? 'rgba(62,166,255,0.15)' : 'transparent'};
                    color:#3ea6ff;transition:all 150ms ease">
              Blue
            </button>
            <button id="accent-red" style="flex:1;padding:8px;border-radius:4px;cursor:pointer;font-size:13px;font-weight:500;
                    border:1px solid ${currentAccent === 'red' ? '#ff0000' : '#3f3f3f'};
                    background:${currentAccent === 'red' ? 'rgba(255,0,0,0.15)' : 'transparent'};
                    color:#ff0000;transition:all 150ms ease">
              Red
            </button>
            <button id="accent-green" style="flex:1;padding:8px;border-radius:4px;cursor:pointer;font-size:13px;font-weight:500;
                    border:1px solid ${currentAccent === 'green' ? '#00a650' : '#3f3f3f'};
                    background:${currentAccent === 'green' ? 'rgba(0,166,80,0.15)' : 'transparent'};
                    color:#00a650;transition:all 150ms ease">
              WFM
            </button>
          </div>
          <span style="font-weight:500;display:block;margin-bottom:6px;color:#aaaaaa;font-size:13px">Button Layout</span>
          <select id="menuStyle" style="width:100%;padding:8px 10px;border:1px solid #3f3f3f;border-radius:4px;
                  background:#0f0f0f;color:#f1f1f1;font-size:14px;font-family:inherit">
            <option value="side"   ${state.menuStyle === 'side' ? 'selected' : ''}>Side Menu</option>
            <option value="bottom" ${state.menuStyle === 'bottom' ? 'selected' : ''}>Bottom Bar</option>
          </select>
        </div>
      </details>

      <!-- Updates Section (collapsible) -->
      <details style="border-top: 1px solid #303030; padding-top: 8px;">
        <summary style="font-size:14px;font-weight:600;color:#f1f1f1;cursor:pointer;padding:8px 0;
                        display:flex;align-items:center;gap:8px;list-style:none;user-select:none;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${a}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Updates
        </summary>
        <div style="padding:4px 0 8px;">
          <label style="display: flex; align-items: center; margin-bottom: 12px; cursor: pointer;">
            <input type="checkbox" id="autoCheckUpdates" ${state.autoCheckUpdates ? 'checked' : ''}
                   style="margin-right: 8px; accent-color: ${a};">
            <span style="font-size: 13px; color: #aaaaaa;">Auto-check for updates</span>
          </label>
          
          <div style="display: flex; gap: 8px; margin-bottom: 12px;">
            <button id="manual-update-check" style="flex: 1; padding: 8px 12px; border: 1px solid ${a};
                    background: transparent; color: ${a}; border-radius: 4px; cursor: pointer;
                    font-size: 13px; font-weight: 500; transition: all 150ms ease;
                    ${state.updateCheckInProgress ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
              ${state.updateCheckInProgress ? 'Checking...' : 'Check Now'}
            </button>
            <button id="reset-skipped-version" style="padding: 8px 12px; border: 1px solid #3f3f3f;
                    background: transparent; color: #aaaaaa; border-radius: 4px; cursor: pointer;
                    font-size: 13px; font-weight: 500; transition: all 150ms ease;"
                    title="Reset skipped version">
              Reset Skip
            </button>
          </div>
          
          <div style="font-size: 11px; color: #717171; line-height: 1.5;">
            <div>v${CAM_TOOLS_VERSION}</div>
            ${state.lastUpdateCheck ? `<div>Last check: ${new Date(state.lastUpdateCheck).toLocaleString()}</div>` : ''}
            ${state.skippedVersion ? `<div>Skipped: <span style="font-family: monospace;">${state.skippedVersion}</span></div>` : ''}
          </div>
        </div>
      </details>

      <!-- Reset to Defaults -->
      <button id="reset-defaults" style="width:100%;margin-top:12px;padding:8px;border:1px solid #3f3f3f;
              background:transparent;color:#aaaaaa;border-radius:4px;cursor:pointer;
              font-size:13px;font-weight:500;transition:all 150ms ease;">
        Reset to Defaults
      </button>

      <!-- Dev Mark -->
      <div style="text-align: center; padding: 12px 0 4px; font-size: 11px; color: #717171; border-top: 1px solid #303030; margin-top: auto;">
        Developed by <a href="https://github.com/RynAgain" target="_blank" rel="noopener noreferrer"
                        style="color: ${a}; text-decoration: none;">Ryan Satterfield</a>
      </div>
    `;

    // --- Wiring ---
    settingsMenu.querySelector('#settings-close').onclick = () => setState({ settingsMenuOpen: false });

    // Accent theme toggle
    settingsMenu.querySelector('#accent-blue').onclick = () => {
      if (window.TmTheme) window.TmTheme.setAccent('blue');
      setState({ accentTheme: 'blue' });
    };
    settingsMenu.querySelector('#accent-red').onclick = () => {
      if (window.TmTheme) window.TmTheme.setAccent('red');
      setState({ accentTheme: 'red' });
    };
    settingsMenu.querySelector('#accent-green').onclick = () => {
      if (window.TmTheme) window.TmTheme.setAccent('green');
      setState({ accentTheme: 'green' });
    };

    settingsMenu.querySelector('#menuStyle').onchange = e => {
      setState({
        menuStyle: e.target.value,
        sideMenuOpen: false,
        bottomBarVisible: false,
        settingsMenuOpen: false
      });
    };
    
    // Update system event handlers
    settingsMenu.querySelector('#autoCheckUpdates').onchange = e => {
      setState({ autoCheckUpdates: e.target.checked });
      if (e.target.checked) {
        initializeUpdateSystem();
      } else if (updateCheckInterval) {
        clearInterval(updateCheckInterval);
        updateCheckInterval = null;
      }
    };
    
    settingsMenu.querySelector('#manual-update-check').onclick = () => {
      if (!state.updateCheckInProgress) {
        checkForUpdates(true);
      }
    };
    
    settingsMenu.querySelector('#reset-skipped-version').onclick = () => {
      setUpdateData('skippedVersion', null);
      setState({ skippedVersion: null });
      if (window.TmTheme && window.TmTheme.showToast) {
        window.TmTheme.showToast('Skipped version reset', 'success', 3000);
      }
    };

    // Reset to Defaults
    settingsMenu.querySelector('#reset-defaults').onclick = () => {
      if (window.TmTheme) window.TmTheme.setAccent('blue');
      setState({
        menuStyle: defaultSettings.menuStyle,
        accentTheme: 'blue',
        autoCheckUpdates: defaultSettings.autoCheckUpdates,
        updateCheckInterval: defaultSettings.updateCheckInterval,
        settingsMenuOpen: true
      });
      setUpdateData('skippedVersion', null);
      setUpdateData('lastVersionCheck', 0);
      if (window.TmTheme && window.TmTheme.showToast) {
        window.TmTheme.showToast('Settings reset to defaults', 'success', 3000);
      }
    };
  }

  // ------------------------------------------------------------------
  //  EVENT HANDLERS
  // ------------------------------------------------------------------
  settingsBtn.onmouseenter = () => { settingsBtn.style.background = '#242424'; };
  settingsBtn.onmouseleave = () => { settingsBtn.style.background = '#1a1a1a'; };
  settingsBtn.onclick = () => setState({ settingsMenuOpen: !state.settingsMenuOpen });

  toggleBtn.onmouseenter = () => { toggleBtn.style.background = '#242424'; };
  toggleBtn.onmouseleave = () => { toggleBtn.style.background = '#1a1a1a'; };
  toggleBtn.onclick = () => {
    if (state.menuStyle === 'side') {
      setState({ sideMenuOpen: !state.sideMenuOpen, bottomBarVisible: false });
    } else {
      setState({ bottomBarVisible: !state.bottomBarVisible, sideMenuOpen: false });
    }
  };

  // Keyboard accessibility
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (state.updateModalOpen) setState({ updateModalOpen: false, availableUpdate: null });
      if (state.settingsMenuOpen) setState({ settingsMenuOpen: false });
      if (state.sideMenuOpen) setState({ sideMenuOpen: false });
      if (state.bottomBarVisible) setState({ bottomBarVisible: false });
    }
    if (state.settingsMenuOpen || state.sideMenuOpen || state.updateModalOpen) {
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

  // Cross-tab settings sync
  window.addEventListener('camToolsSettingsChanged', () => {
    const newSettings = getSettings();
    let changed = false;
    ['menuStyle', 'accentTheme'].forEach(k => {
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
  if (!document.body.contains(settingsBtn)) document.body.appendChild(settingsBtn);
  if (!document.body.contains(settingsMenu)) document.body.appendChild(settingsMenu);
  if (!document.body.contains(toggleBtn)) document.body.appendChild(toggleBtn);
  if (!document.body.contains(iconBar)) document.body.appendChild(iconBar);

  // Transition styles
  const transitionStyle = document.createElement('style');
  transitionStyle.textContent = `
    #settings-btn, #settings-btn:focus { outline: none; }
    .drawer, #settings-btn, #settingsMenu {
      transition: box-shadow .25s, background 150ms ease, left .25s, transform .25s;
    }
    .drawer[aria-hidden="false"] { transition: left .25s cubic-bezier(.4,0,.2,1); }
    .drawer[aria-hidden="true"] { transition: left .25s cubic-bezier(.4,0,.2,1); }
    #settingsMenu[aria-hidden="false"] { transition: transform .25s cubic-bezier(.4,0,.2,1); }
    #settingsMenu[aria-hidden="true"] { transition: transform .25s cubic-bezier(.4,0,.2,1); }
    #scratchpad-toggle-btn { z-index: 10000 !important; }
    [id^="scratchpad-toggle-btn"] { z-index: 10000 !important; }
    .iconbar-item { outline: none; }
    .iconbar-item:focus-visible { outline: 2px solid var(--tm-accent-primary); outline-offset: 2px; }
  `;
  document.head.appendChild(transitionStyle);

  // ------------------------------------------------------------------
  //  DYNAMIC BUTTON OBSERVER
  // ------------------------------------------------------------------
  (function observeNavButtons() {
    if (!Array.isArray(bottomButtonIds) || bottomButtonIds.length === 0) return;

    function hideBarButtonsIfNeeded() {
      if (state.menuStyle === 'side') {
        bottomButtonIds.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.classList.add('nav-bar-hidden');
        });
      }
    }

    hideBarButtonsIfNeeded();

    const observer = new MutationObserver((mutationsList) => {
      let shouldRender = false;
      for (const mutation of mutationsList) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            bottomButtonIds.forEach(id => {
              if (node.id === id) {
                if (state.menuStyle === 'side') node.classList.add('nav-bar-hidden');
                shouldRender = true;
              }
              const descendant = node.querySelector && node.querySelector(`#${id}`);
              if (descendant && state.menuStyle === 'side') {
                descendant.classList.add('nav-bar-hidden');
                shouldRender = true;
              }
            });
          }
        }
      }
      if (shouldRender) render();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  })();

  // Initial render
  render();

  // ------------------------------------------------------------------
  //  INITIALIZE UPDATE SYSTEM
  // ------------------------------------------------------------------
  initializeUpdateSystem();

  // Cursor emoji feature removed

})();
