(function() {
    try {
        'use strict';

        // --- Persistent State Helpers ---
        function getTabs() {
            try {
                return JSON.parse(localStorage.getItem('scratchpad-tabs')) || [
                    { name: 'Tab 1', content: '' }
                ];
            } catch {
                return [{ name: 'Tab 1', content: '' }];
            }
        }
        function setTabs(tabs) {
            localStorage.setItem('scratchpad-tabs', JSON.stringify(tabs));
        }
        function getActiveTab() {
            return parseInt(localStorage.getItem('scratchpad-active-tab') || '0', 10);
        }
        function setActiveTab(idx) {
            localStorage.setItem('scratchpad-active-tab', idx);
        }

        // --- UI Elements ---
        // Button
        const scratchpadButton = document.createElement('button');
        scratchpadButton.id = 'scratchpad-toggle-btn';
        scratchpadButton.innerText = 'Scratchpad';
        scratchpadButton.style.position = 'fixed';
        scratchpadButton.style.left = '0';
        scratchpadButton.style.top = '10vh';
        scratchpadButton.style.zIndex = '2000';
        scratchpadButton.style.background = '#004E36';
        scratchpadButton.style.color = '#fff';
        scratchpadButton.style.border = 'none';
        scratchpadButton.style.borderRadius = '0 5px 5px 0';
        scratchpadButton.style.padding = '10px 0';
        scratchpadButton.style.cursor = 'pointer';
        scratchpadButton.style.fontSize = '16px';
        scratchpadButton.style.boxShadow = '2px 2px 8px rgba(0,0,0,0.2)';
        scratchpadButton.style.height = '140px';
        scratchpadButton.style.width = '36px';
        scratchpadButton.style.writingMode = 'vertical-rl';
        scratchpadButton.style.textOrientation = 'mixed';
        scratchpadButton.style.letterSpacing = '2px';
        scratchpadButton.style.textAlign = 'center';
        scratchpadButton.style.userSelect = 'none';

        // Container
        const scratchpadContainer = document.createElement('div');
        scratchpadContainer.id = 'scratchpad-container';
        scratchpadContainer.style.position = 'fixed';
        scratchpadContainer.style.bottom = '60px';
        scratchpadContainer.style.right = '20px';
        scratchpadContainer.style.width = '340px';
        scratchpadContainer.style.maxWidth = '95vw';
        scratchpadContainer.style.background = '#fff';
        scratchpadContainer.style.border = '1px solid #888';
        scratchpadContainer.style.borderRadius = '8px';
        scratchpadContainer.style.boxShadow = '0 2px 12px rgba(0,0,0,0.25)';
        scratchpadContainer.style.display = 'none';
        scratchpadContainer.style.zIndex = '2000';

        // Header
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.background = '#004E36';
        header.style.color = '#fff';
        header.style.padding = '8px 12px';
        header.style.borderRadius = '8px 8px 0 0';
        header.style.cursor = 'move';
        header.style.userSelect = 'none';

        const title = document.createElement('span');
        title.innerText = 'Scratchpad';

        const closeBtn = document.createElement('span');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontSize = '20px';
        closeBtn.style.marginLeft = '10px';

        header.appendChild(title);
        header.appendChild(closeBtn);

        // Tab Bar
        const tabBar = document.createElement('div');
        tabBar.id = 'scratchpad-tab-bar';
        tabBar.style.display = 'flex';
        tabBar.style.alignItems = 'center';
        tabBar.style.background = '#f2f2f2';
        tabBar.style.borderBottom = '1px solid #ccc';
        tabBar.style.padding = '0 4px';
        tabBar.style.overflowX = 'auto';

        // Textarea
        const textarea = document.createElement('textarea');
        textarea.id = 'scratchpad-textarea';
        textarea.style.width = '96%';
        textarea.style.height = '180px';
        textarea.style.margin = '10px 2% 10px 2%';
        textarea.style.resize = 'vertical';
        textarea.style.fontSize = '15px';
        textarea.style.fontFamily = 'monospace';
        textarea.style.border = '1px solid #ccc';
        textarea.style.borderRadius = '4px';
        textarea.style.padding = '8px';
        textarea.style.boxSizing = 'border-box';
        textarea.placeholder = 'Type or paste anything here...';

        // --- Tab Logic ---
        let tabs = getTabs();
        let activeTab = Math.min(getActiveTab(), tabs.length - 1);

        function renderTabs() {
            // Remove all children
            while (tabBar.firstChild) tabBar.removeChild(tabBar.firstChild);

            tabs.forEach((tab, idx) => {
                const tabBtn = document.createElement('div');
                tabBtn.innerText = tab.name;
                tabBtn.style.padding = '4px 10px';
                tabBtn.style.margin = '4px 2px 4px 0';
                tabBtn.style.borderRadius = '5px 5px 0 0';
                tabBtn.style.background = idx === activeTab ? '#e0e0e0' : 'transparent';
                tabBtn.style.cursor = 'pointer';
                tabBtn.style.position = 'relative';
                tabBtn.style.fontWeight = idx === activeTab ? 'bold' : 'normal';
                tabBtn.style.userSelect = 'none';
                tabBtn.title = 'Double-click to rename';

                // Switch tab
                tabBtn.addEventListener('click', function() {
                    saveCurrentTabContent();
                    activeTab = idx;
                    setActiveTab(activeTab);
                    renderTabs();
                    textarea.value = tabs[activeTab].content;
                    textarea.focus();
                });

                // Rename tab on double-click
                tabBtn.addEventListener('dblclick', function(e) {
                    e.stopPropagation();
                    const newName = prompt('Rename tab:', tab.name);
                    if (newName && newName.trim()) {
                        tabs[idx].name = newName.trim();
                        setTabs(tabs);
                        renderTabs();
                    }
                });

                // Close tab button (if more than 1 tab)
                if (tabs.length > 1) {
                    const closeTabBtn = document.createElement('span');
                    closeTabBtn.innerHTML = '&times;';
                    closeTabBtn.style.position = 'absolute';
                    closeTabBtn.style.right = '2px';
                    closeTabBtn.style.top = '2px';
                    closeTabBtn.style.fontSize = '13px';
                    closeTabBtn.style.color = '#888';
                    closeTabBtn.style.cursor = 'pointer';
                    closeTabBtn.title = 'Close tab';
                    closeTabBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        tabs.splice(idx, 1);
                        if (activeTab >= tabs.length) activeTab = tabs.length - 1;
                        setTabs(tabs);
                        setActiveTab(activeTab);
                        renderTabs();
                        textarea.value = tabs[activeTab].content;
                    });
                    tabBtn.appendChild(closeTabBtn);
                }

                tabBar.appendChild(tabBtn);
            });

            // Add tab button
            const addTabBtn = document.createElement('div');
            addTabBtn.innerText = '+';
            addTabBtn.style.padding = '4px 10px';
            addTabBtn.style.margin = '4px 2px 4px 0';
            addTabBtn.style.borderRadius = '5px 5px 0 0';
            addTabBtn.style.background = 'transparent';
            addTabBtn.style.cursor = 'pointer';
            addTabBtn.style.fontWeight = 'bold';
            addTabBtn.title = 'Add new tab';
            addTabBtn.addEventListener('click', function() {
                saveCurrentTabContent();
                const newTabName = `Tab ${tabs.length + 1}`;
                tabs.push({ name: newTabName, content: '' });
                activeTab = tabs.length - 1;
                setTabs(tabs);
                setActiveTab(activeTab);
                renderTabs();
                textarea.value = '';
                textarea.focus();
            });
            tabBar.appendChild(addTabBtn);
        }

        function saveCurrentTabContent() {
            if (tabs[activeTab]) {
                tabs[activeTab].content = textarea.value;
                setTabs(tabs);
            }
        }

        // --- Textarea Persistence ---
        textarea.value = tabs[activeTab] ? tabs[activeTab].content : '';
        textarea.addEventListener('input', function() {
            if (tabs[activeTab]) {
                tabs[activeTab].content = textarea.value;
                setTabs(tabs);
            }
        });

        // --- UI Logic ---
        scratchpadButton.addEventListener('click', function() {
            scratchpadContainer.style.display = scratchpadContainer.style.display === 'none' ? 'block' : 'none';
        });
        closeBtn.addEventListener('click', function() {
            saveCurrentTabContent();
            scratchpadContainer.style.display = 'none';
        });

        // Keyboard shortcut: Ctrl+Shift+S to toggle
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
                scratchpadContainer.style.display = scratchpadContainer.style.display === 'none' ? 'block' : 'none';
                if (scratchpadContainer.style.display === 'block') {
                    textarea.focus();
                }
                e.preventDefault();
            }
        });

        // Drag-and-drop logic for the scratchpad container
        let isDragging = false;
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        header.addEventListener('mousedown', function(e) {
            isDragging = true;
            const rect = scratchpadContainer.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
            scratchpadContainer.style.zIndex = '3000';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', function(e) {
            if (isDragging) {
                let left = e.clientX - dragOffsetX;
                let top = e.clientY - dragOffsetY;
                left = Math.max(0, Math.min(window.innerWidth - scratchpadContainer.offsetWidth, left));
                top = Math.max(0, Math.min(window.innerHeight - scratchpadContainer.offsetHeight, top));
                scratchpadContainer.style.left = left + 'px';
                scratchpadContainer.style.top = top + 'px';
                scratchpadContainer.style.right = 'auto';
                scratchpadContainer.style.bottom = 'auto';
                scratchpadContainer.style.position = 'fixed';
            }
        });

        document.addEventListener('mouseup', function() {
            if (isDragging) {
                isDragging = false;
                scratchpadContainer.style.zIndex = '2000';
                document.body.style.userSelect = '';
            }
        });

        // --- Assemble and add to DOM ---
        scratchpadContainer.appendChild(header);
        scratchpadContainer.appendChild(tabBar);
        scratchpadContainer.appendChild(textarea);
        // List of bottom button IDs to toggle
        const bottomButtonIds = [
            'addItemButton', 'activateButton', 'redriveButton', 'generalHelpToolsButton', 'downloadDataButton',
            'massUploaderButton', 'filechunker', 'pluDedupeListButton', 'scanCodeTo13PLUButton', 'pluToAsinButton',
            'getMerchantIdButton', 'getAllStoreInfoButton', 'meatInventoryToUploadConverterButton',
            'nisFileToCAMUploadButton', 'atcpropButton', 'componentUploadBuilderButton', 'auditHistoryPullButton',
            'desyncFinderButton', 'auditHistoryDashboardButton'
        ];

        // Helper to set visibility of all bottom buttons
        function setBottomButtonsVisible(visible) {
            bottomButtonIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.style.display = visible ? '' : 'none';
                }
            });
            localStorage.setItem('bottomButtonsVisible', visible ? '1' : '0');
            updateEyeIcon(visible);
        }

        // Create the hamburger toggle button with scratchpad-matching style
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

        // Hamburger SVG
        const hamburgerSVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>`;
        const closeSVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>`;

        let menuOpen = false;
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

        // Side menu
        // Overlay for closing menu by clicking outside
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
            setMenuOpen(false);
        });

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
            setMenuOpen(false);
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
                        // Optionally close menu after click
                        // setMenuOpen(false);
                    });
                    sideMenu.appendChild(menuBtn);
                }
            });
        }

        function setMenuOpen(open) {
            menuOpen = open;
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
                setTimeout(() => {
                    if (!menuOpen) {
                        sideMenu.style.display = 'none';
                        sideMenuOverlay.style.display = 'none';
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
            setMenuOpen(!menuOpen);
        });

        document.body.appendChild(scratchpadButton);
        document.body.appendChild(toggleMenuBtn);
        document.body.appendChild(sideMenuOverlay);
        document.body.appendChild(sideMenu);
        document.body.appendChild(scratchpadContainer);

        // Initial render
        renderTabs();
        textarea.value = tabs[activeTab] ? tabs[activeTab].content : '';

    } catch (err) {
        // Log error but do not break the rest of the page
        console.error('[Scratchpad] Error initializing scratchpad:', err);
    }
})();