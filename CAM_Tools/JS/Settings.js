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
  const CAM_TOOLS_VERSION = '2.6.230'; // Extracted from MainScript.js @version
  const GITHUB_API_URL = 'https://api.github.com/repos/RynAgain/Work_Productivity_Experiments/releases/latest';
  const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/RynAgain/Work_Productivity_Experiments/main/CAM_Tools/MainScript.js';
  const UPDATE_CHECK_INTERVAL = 4 * 60 * 60 * 1000; // 8 hours in milliseconds
  const UPDATE_STORAGE_PREFIX = 'cam_tools_update_';
  
  const defaultSettings = {
    menuStyle: 'side',
    themeColor: '#004E36',
    cursorEmoji: 'normal',
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
  // DO NOT use Proxy for state: all state changes must go through setState to avoid infinite render loops.

  // Only persist these keys
  function persistSettings() {
    setSettings({
      menuStyle: state.menuStyle,
      themeColor: state.themeColor,
      cursorEmoji: state.cursorEmoji,
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
      console.warn('Failed to store update data:', error);
    }
  }

  // ------------------------------------------------------------------
  //  UPDATE SYSTEM CORE FUNCTIONALITY
  // ------------------------------------------------------------------
  let updateCheckInterval = null;

  // Version comparison function - handles semantic versioning
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

  // Extract version from MainScript.js content
  function extractVersionFromScript(scriptContent) {
    const versionMatch = scriptContent.match(/@version\s+([^\s]+)/);
    return versionMatch ? versionMatch[1].trim() : null;
  }

  // Check for updates using GitHub API
  async function checkForUpdates(showNoUpdateMessage = false) {
    if (state.updateCheckInProgress) return;
    
    setState({ updateCheckInProgress: true });
    
    try {
      const lastCheck = getUpdateData('lastVersionCheck', 0);
      const now = Date.now();
      
      // Rate limiting - don't check too frequently unless manual
      if (!showNoUpdateMessage && (now - lastCheck) < state.updateCheckInterval) {
        setState({ updateCheckInProgress: false });
        return;
      }
      
      // Try GitHub API first for release info
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
        console.warn('GitHub API failed, trying raw file:', apiError);
      }
      
      // Fallback to raw file if API fails
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
      
      // Update check timestamp
      setUpdateData('lastVersionCheck', now);
      setState({ lastUpdateCheck: now });
      
      // Check if update is available
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
      console.error('Update check failed:', error);
      if (showNoUpdateMessage) {
        showUpdateStatusMessage('error', null, error.message);
      }
    } finally {
      setState({ updateCheckInProgress: false });
    }
  }

  // Show update status messages
  function showUpdateStatusMessage(status, version, errorMsg) {
    let message = '';
    let icon = '';
    
    switch (status) {
      case 'current':
        icon = '✅';
        message = `You're running the latest version!\n\nCurrent: ${CAM_TOOLS_VERSION}\nLatest: ${version}`;
        break;
      case 'skipped':
        icon = '⏭️';
        message = `Update available but skipped.\n\nCurrent: ${CAM_TOOLS_VERSION}\nLatest: ${version}\n\nYou can check again or change settings to see this update.`;
        break;
      case 'error':
        icon = '❌';
        message = `Failed to check for updates:\n${errorMsg}`;
        break;
    }
    
    alert(`${icon} CAM Tools Update Check\n\n${message}`);
  }

  // Initialize update checking
  function initializeUpdateSystem() {
    // Load stored data into state
    setState({
      lastUpdateCheck: getUpdateData('lastVersionCheck', 0),
      skippedVersion: getUpdateData('skippedVersion')
    });
    
    if (!state.autoCheckUpdates) return;
    
    // Initial check after startup delay
    setTimeout(() => {
      checkForUpdates(false);
    }, 5000);
    
    // Set up periodic checking
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
    left: '36px', // settings button width
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
    transform: 'translateX(-10000px)', // 260px menu + 36px button + 8px margin
    transition: 'transform .25s cubic-bezier(.4,0,.2,1)',
    boxShadow: 'none',
    pointerEvents: 'none',
    zIndex: '3001'
  });

  // Drawer Overlay
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
  //  UPDATE NOTIFICATION MODAL
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
      zIndex: '9999',
      fontFamily: 'Segoe UI, Arial, sans-serif'
    });

    const modalContent = document.createElement('div');
    Object.assign(modalContent.style, {
      background: '#fff',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '480px',
      width: '90%',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      position: 'relative',
      animation: 'fadeInScale 0.3s ease-out'
    });

    // Add animation keyframes
    if (!document.getElementById('update-modal-animations')) {
      const animationStyle = document.createElement('style');
      animationStyle.id = 'update-modal-animations';
      animationStyle.textContent = `
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `;
      document.head.appendChild(animationStyle);
    }

    modalContent.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 20px;">
        <div style="width: 48px; height: 48px; background: ${state.themeColor}; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center; margin-right: 16px;">
          <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <div>
          <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: #333;">
            CAM Tools Update Available
          </h2>
          <p style="margin: 4px 0 0; color: #666; font-size: 14px;">
            A new version is ready to install
          </p>
        </div>
      </div>
      
      <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-weight: 500; color: #333;">Current Version:</span>
          <span style="font-family: monospace; color: #666;">${CAM_TOOLS_VERSION}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="font-weight: 500; color: #333;">Latest Version:</span>
          <span style="font-family: monospace; color: ${state.themeColor}; font-weight: 600;">${latestVersion}</span>
        </div>
      </div>
      
      <p style="color: #555; line-height: 1.5; margin-bottom: 24px;">
        Click "Update Now" to open the latest version in a new tab. You'll need to install it manually through Tampermonkey.
      </p>
      
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="update-skip-btn" style="padding: 10px 20px; border: 1px solid #ddd; background: #fff;
                color: #666; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
          Skip This Version
        </button>
        <button id="update-remind-btn" style="padding: 10px 20px; border: 1px solid ${state.themeColor};
                background: #fff; color: ${state.themeColor}; border-radius: 6px; cursor: pointer;
                font-size: 14px; font-weight: 500;">
          Remind Me Later
        </button>
        <button id="update-now-btn" style="padding: 10px 24px; border: none; background: ${state.themeColor};
                color: #fff; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
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
      setUpdateData('lastVersionCheck', 0); // Reset check timer
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

    // Close on overlay click
    modal.onclick = (e) => {
      if (e.target === modal) closeUpdateModal();
    };

    // Keyboard support
    modal.onkeydown = (e) => {
      if (e.key === 'Escape') {
        closeUpdateModal();
      }
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
    },
    {
      label: 'Existing Item Editor',
      tooltip: 'Edit Existing Items',
      icon: `<svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
        <rect x="1.5" y="1.5" width="13" height="13" rx="2" fill="none" stroke="#fff"/>
        <path d="M12.146 3.354a.5.5 0 0 1 0 .708l-7.793 7.793a.5.5 0 0 1-.168.11l-2.5.833a.25.25 0 0 1-.316-.316l.833-2.5a.5.5 0 0 1 .11-.168l7.793-7.793a.5.5 0 0 1 .708 0l1.333 1.333zm-1.293-.647l1.333 1.333" stroke="#fff" fill="none"/>
        <path d="M11.207 2.293l2.5 2.5" stroke="#fff" fill="none"/>
      </svg>`,
      action: () => document.getElementById('ei-openEditor')?.click()
    }
  ]; // ← array ends here (stray token removed)

  // ------------------------------------------------------------------
  //  EXTRA OBSERVER FOR EDITOR ICON (stub so script doesn't break)
  // ------------------------------------------------------------------
  const editorObserver = new MutationObserver(() => {});
  editorObserver.observe(document.body, { childList: true, subtree: true });

  // IDs for bottom bar buttons
  const bottomButtonIds = ['redriveButton', 'addItemButton', 'downloadDataButton', 'activateButton', 'generalHelpToolsButton', 'ei-openEditor'];

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
      settingsMenu.style.transform = 'translateX(-4000px)'; // 260px menu + 36px button = 296px
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
    ` +
    `<label style="display:block;margin-top:10px">
       <span style="font-weight:500;display:block;margin-bottom:4px">Cursor Emoji</span>
       <div id="cursorEmojiPicker" style="position:relative;">
         <input id="cursorEmojiSearch" type="text" placeholder="Search emoji..." style="width:100%;padding:7px 10px 7px 32px;border:1px solid #ccc;border-radius:5px 5px 0 0;font-size:15px;box-sizing:border-box;margin-bottom:0;">
         <span style="position:absolute;left:8px;top:10px;font-size:16px;pointer-events:none;opacity:0.6;">🔍</span>
         <div id="cursorEmojiList" style="max-height:120px;overflow-y:auto;border:1px solid #ccc;border-top:none;border-radius:0 0 5px 5px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
         </div>
       </div>
     </label>
     
     <div style="border-top: 1px solid #eee; margin: 20px 0; padding-top: 20px;">
       <div style="font-size: 16px; font-weight: 600; color: #333; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
         <svg width="18" height="18" fill="${state.themeColor}" viewBox="0 0 24 24">
           <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
         </svg>
         Update Settings
       </div>
       
       <label style="display: flex; align-items: center; margin-bottom: 12px; cursor: pointer;">
         <input type="checkbox" id="autoCheckUpdates" ${state.autoCheckUpdates ? 'checked' : ''}
                style="margin-right: 8px; transform: scale(1.1);">
         <span style="font-size: 14px; color: #555;">Automatically check for updates</span>
       </label>
       
       <div style="display: flex; gap: 8px; margin-bottom: 12px;">
         <button id="manual-update-check" style="flex: 1; padding: 8px 12px; border: 1px solid ${state.themeColor};
                 background: #fff; color: ${state.themeColor}; border-radius: 5px; cursor: pointer;
                 font-size: 13px; font-weight: 500; ${state.updateCheckInProgress ? 'opacity: 0.6; cursor: not-allowed;' : ''}">
           ${state.updateCheckInProgress ? 'Checking...' : 'Check for Updates'}
         </button>
         <button id="reset-skipped-version" style="padding: 8px 12px; border: 1px solid #ddd;
                 background: #fff; color: #666; border-radius: 5px; cursor: pointer;
                 font-size: 13px; font-weight: 500;" title="Reset skipped version to see all updates">
           Reset Skipped
         </button>
       </div>
       
       <div style="font-size: 12px; color: #888; line-height: 1.4;">
         <div>Current Version: <span style="font-family: monospace; color: #333;">${CAM_TOOLS_VERSION}</span></div>
         ${state.lastUpdateCheck ? `<div>Last Check: ${new Date(state.lastUpdateCheck).toLocaleString()}</div>` : ''}
         ${state.skippedVersion ? `<div>Skipped Version: <span style="font-family: monospace;">${state.skippedVersion}</span></div>` : ''}
       </div>
     </div>
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
      alert('✅ Skipped version reset! You\'ll now see all available updates.');
    };

    // Emoji options (food and fun)
    const emojiOptions = [
      { value: 'normal', label: 'Normal' },
      { value: '🖊️', label: '🖊️ Pen' },
      { value: '🦄', label: '🦄 Unicorn' },
      { value: '🔥', label: '🔥 Fire' },
      { value: '👾', label: '👾 Alien' },
      { value: '💡', label: '💡 Lightbulb' },
      { value: '⭐', label: '⭐ Star' },
      { value: '🍕', label: '🍕 Pizza' },
      { value: '🍔', label: '🍔 Burger' },
      { value: '🍟', label: '🍟 Fries' },
      { value: '🌭', label: '🌭 Hot Dog' },
      { value: '🍿', label: '🍿 Popcorn' },
      { value: '🥓', label: '🥓 Bacon' },
      { value: '🍳', label: '🍳 Fried Egg' },
      { value: '🥞', label: '🥞 Pancakes' },
      { value: '🧇', label: '🧇 Waffle' },
      { value: '🥨', label: '🥨 Pretzel' },
      { value: '🥐', label: '🥐 Croissant' },
      { value: '🥯', label: '🥯 Bagel' },
      { value: '🍞', label: '🍞 Bread' },
      { value: '🧀', label: '🧀 Cheese' },
      { value: '🍖', label: '🍖 Meat' },
      { value: '🍗', label: '🍗 Drumstick' },
      { value: '🥩', label: '🥩 Steak' },
      { value: '🍤', label: '🍤 Shrimp' },
      { value: '🍣', label: '🍣 Sushi' },
      { value: '🍱', label: '🍱 Bento' },
      { value: '🍛', label: '🍛 Curry' },
      { value: '🍜', label: '🍜 Ramen' },
      { value: '🍝', label: '🍝 Spaghetti' },
      { value: '🍠', label: '🍠 Sweet Potato' },
      { value: '🍢', label: '🍢 Oden' },
      { value: '🍡', label: '🍡 Dango' },
      { value: '🍧', label: '🍧 Shaved Ice' },
      { value: '🍨', label: '🍨 Ice Cream' },
      { value: '🍦', label: '🍦 Soft Serve' },
      { value: '🍰', label: '🍰 Cake' },
      { value: '🎂', label: '🎂 Birthday Cake' },
      { value: '🧁', label: '🧁 Cupcake' },
      { value: '🍮', label: '🍮 Flan' },
      { value: '🍭', label: '🍭 Lollipop' },
      { value: '🍬', label: '🍬 Candy' },
      { value: '🍫', label: '🍫 Chocolate' },
      { value: '🍩', label: '🍩 Donut' },
      { value: '🍪', label: '🍪 Cookie' },
      { value: '🥧', label: '🥧 Pie' },
      { value: '🥤', label: '🥤 Soda' },
      { value: '🧃', label: '🧃 Juice' },
      { value: '🧉', label: '🧉 Mate' },
      { value: '🍺', label: '🍺 Beer' },
      { value: '🍻', label: '🍻 Cheers' },
      { value: '🥂', label: '🥂 Champagne' },
      { value: '🍷', label: '🍷 Wine' },
      { value: '🥛', label: '🥛 Milk' },
      { value: '☕', label: '☕ Coffee' },
      { value: '🧊', label: '🧊 Ice' }
    ];

    // Render emoji list
    function renderEmojiList(filter) {
      const list = settingsMenu.querySelector('#cursorEmojiList');
      list.innerHTML = '';
      const filtered = emojiOptions.filter(opt =>
        opt.label.toLowerCase().includes(filter.toLowerCase()) ||
        opt.value.toLowerCase().includes(filter.toLowerCase())
      );
      filtered.forEach(opt => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.width = '100%';
        btn.style.padding = '6px 10px';
        btn.style.fontSize = '18px';
        btn.style.background = opt.value === state.cursorEmoji ? '#e0e0e0' : '#fff';
        btn.style.border = 'none';
        btn.style.cursor = 'pointer';
        btn.style.borderBottom = '1px solid #f0f0f0';
        btn.style.justifyContent = 'flex-start';
        btn.style.gap = '10px';
        btn.innerHTML = `<span style="font-size:20px">${opt.value !== 'normal' ? opt.value : '🖱️'}</span> <span style="font-size:15px">${opt.label}</span>`;
        btn.onclick = () => {
          setState({ cursorEmoji: opt.value });
          // Close dropdown (blur input)
          settingsMenu.querySelector('#cursorEmojiSearch').blur();
        };
        list.appendChild(btn);
      });
      if (filtered.length === 0) {
        const noRes = document.createElement('div');
        noRes.style.padding = '10px';
        noRes.style.color = '#888';
        noRes.style.textAlign = 'center';
        noRes.textContent = 'No results';
        list.appendChild(noRes);
      }
    }

    // Initial render
    renderEmojiList('');

    // Search filter logic
    const searchInput = settingsMenu.querySelector('#cursorEmojiSearch');
    searchInput.value = '';
    searchInput.oninput = e => renderEmojiList(e.target.value);

    // Keyboard navigation for emoji list
    searchInput.onkeydown = function(e) {
      const list = settingsMenu.querySelector('#cursorEmojiList');
      const btns = Array.from(list.querySelectorAll('button'));
      if (!btns.length) return;
      let idx = btns.findIndex(b => b === document.activeElement);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (idx === -1 || idx === btns.length - 1) btns[0].focus();
        else btns[idx + 1].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (idx <= 0) btns[btns.length - 1].focus();
        else btns[idx - 1].focus();
      }
    };
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

  // Keyboard accessibility: ESC closes menus, trap focus
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (state.updateModalOpen) setState({ updateModalOpen: false, availableUpdate: null });
      if (state.settingsMenuOpen) setState({ settingsMenuOpen: false });
      if (state.sideMenuOpen) setState({ sideMenuOpen: false });
      if (state.bottomBarVisible) setState({ bottomBarVisible: false });
    }
    // Trap focus in open menus and modals
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
  if (!document.body.contains(settingsBtn)) document.body.appendChild(settingsBtn);
  if (!document.body.contains(settingsMenu)) document.body.appendChild(settingsMenu);
  if (!document.body.contains(toggleBtn)) document.body.appendChild(toggleBtn);
  if (!document.body.contains(iconBar)) document.body.appendChild(iconBar);

  // Add smooth transitions for menus/drawer
  const transitionStyle = document.createElement('style');
  transitionStyle.textContent = `
    #settings-btn, #settings-btn:focus { outline: none; }
    .drawer, #settings-btn, #settingsMenu {
      transition: box-shadow .25s, background .3s, left .25s, transform .25s;
    }
    .drawer[aria-hidden="false"] { transition: left .25s cubic-bezier(.4,0,.2,1); }
    .drawer[aria-hidden="true"] { transition: left .25s cubic-bezier(.4,0,.2,1); }
    #settingsMenu[aria-hidden="false"] { transition: transform .25s cubic-bezier(.4,0,.2,1); }
    #settingsMenu[aria-hidden="true"] { transition: transform .25s cubic-bezier(.4,0,.2,1); }
    #scratchpad-toggle-btn { z-index: 3200 !important; }
    [id^="scratchpad-toggle-btn"] { z-index: 3200 !important; }
    .iconbar-item { outline: none; }
  `;
  document.head.appendChild(transitionStyle);

  // ------------------------------------------------------------------
  //  DYNAMIC BUTTON OBSERVER FOR DRAWER POPULATION
  // ------------------------------------------------------------------
  (function observeNavButtons() {
    if (!Array.isArray(bottomButtonIds) || bottomButtonIds.length === 0) return;

    // Helper to hide any bar-type button if in side menu mode
    function hideBarButtonsIfNeeded() {
      if (state.menuStyle === 'side') {
        bottomButtonIds.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.classList.add('nav-bar-hidden');
        });
      }
    }

    // Initial hide if needed
    hideBarButtonsIfNeeded();

    // Observe for new buttons and hide as needed
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
              // Also check descendants
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
  // Initialize the update system after everything is mounted
  initializeUpdateSystem();

  // Apply cursor emoji on load and when settings change
  function applyCursorEmoji(emoji) {
    // Remove any previous custom cursor style
    let styleTag = document.getElementById('cam-tools-cursor-emoji');
    if (styleTag) styleTag.remove();

    if (!emoji || emoji === 'normal') {
      document.body.style.cursor = '';
      return;
    }

    // Create a canvas to draw the emoji and use as a cursor
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = '48px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.clearRect(0, 0, 64, 64);
    ctx.fillText(emoji, 32, 36);

    // Draw a marker at the hotspot (16,16)
    ctx.save();
    ctx.beginPath();
    ctx.arc(16, 16, 4, 0, 2 * Math.PI, false);
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(16, 16, 1.5, 0, 2 * Math.PI, false);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.restore();

    const dataUrl = canvas.toDataURL('image/png');

    styleTag = document.createElement('style');
    styleTag.id = 'cam-tools-cursor-emoji';
    styleTag.textContent = `
      body, *:not(input):not(textarea):not([contenteditable="true"]) {
        cursor: url('${dataUrl}') 16 16, auto !important;
      }
    `;
    document.head.appendChild(styleTag);
  }

  // Initial application
  applyCursorEmoji(state.cursorEmoji);

  // Listen for settings changes to update cursor
  window.addEventListener('camToolsSettingsChanged', () => {
    const newSettings = getSettings();
    if (typeof newSettings.cursorEmoji !== 'undefined') {
      applyCursorEmoji(newSettings.cursorEmoji);
    }
  });

  // Also update cursor when setState is called
  const origSetState = setState;
  setState = function(partial) {
    origSetState(partial);
    if (typeof partial.cursorEmoji !== 'undefined') {
      applyCursorEmoji(partial.cursorEmoji);
    }
  };

  })();
