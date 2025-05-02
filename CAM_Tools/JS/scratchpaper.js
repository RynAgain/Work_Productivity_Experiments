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

        // Create the eye icon toggle button with scratchpad-matching style
        const toggleBottomButtonsBtn = document.createElement('button');
        toggleBottomButtonsBtn.id = 'toggle-bottom-buttons';
        toggleBottomButtonsBtn.style.position = 'fixed';
        toggleBottomButtonsBtn.style.left = '0';
        toggleBottomButtonsBtn.style.top = 'calc(10vh + 150px)';
        toggleBottomButtonsBtn.style.zIndex = '2000';
        toggleBottomButtonsBtn.style.width = '36px';
        toggleBottomButtonsBtn.style.height = '36px';
        toggleBottomButtonsBtn.style.background = '#004E36';
        toggleBottomButtonsBtn.style.color = '#fff';
        toggleBottomButtonsBtn.style.border = 'none';
        toggleBottomButtonsBtn.style.borderRadius = '0 5px 5px 0';
        toggleBottomButtonsBtn.style.display = 'flex';
        toggleBottomButtonsBtn.style.alignItems = 'center';
        toggleBottomButtonsBtn.style.justifyContent = 'center';
        toggleBottomButtonsBtn.style.padding = '0';
        toggleBottomButtonsBtn.style.cursor = 'pointer';
        toggleBottomButtonsBtn.style.boxShadow = '2px 2px 8px rgba(0,0,0,0.2)';
        toggleBottomButtonsBtn.style.fontSize = '16px';
        toggleBottomButtonsBtn.title = 'Hide Bottom Buttons';
        toggleBottomButtonsBtn.style.transition = 'background 0.3s';

        // Hover effect to match scratchpad button
        toggleBottomButtonsBtn.addEventListener('mouseenter', function() {
            toggleBottomButtonsBtn.style.background = '#218838';
        });
        toggleBottomButtonsBtn.addEventListener('mouseleave', function() {
            toggleBottomButtonsBtn.style.background = '#004E36';
        });

        // SVGs for open/closed eye (white stroke)
        const eyeOpenSVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="12" rx="9" ry="5"/><circle cx="12" cy="12" r="2.5"/></svg>`;
        const eyeClosedSVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l22 22"/><path d="M17.94 17.94C16.12 19.25 14.13 20 12 20c-5 0-9-4-9-8 0-1.61.5-3.13 1.38-4.42"/><path d="M6.06 6.06C7.88 4.75 9.87 4 12 4c5 0 9 4 9 8 0 1.61-.5 3.13-1.38 4.42"/><path d="M9.5 9.5a3 3 0 0 1 4.5 4.5"/></svg>`;

        function updateEyeIcon(visible) {
            toggleBottomButtonsBtn.innerHTML = visible ? eyeOpenSVG : eyeClosedSVG;
            toggleBottomButtonsBtn.title = visible ? 'Hide Bottom Buttons' : 'Show Bottom Buttons';
        }

        // Initial state from localStorage (default: visible)
        let bottomButtonsVisible = localStorage.getItem('bottomButtonsVisible');
        if (bottomButtonsVisible === null) bottomButtonsVisible = '1';
        setBottomButtonsVisible(bottomButtonsVisible === '1');

        toggleBottomButtonsBtn.addEventListener('click', function() {
            const currentlyVisible = localStorage.getItem('bottomButtonsVisible') === '1';
            setBottomButtonsVisible(!currentlyVisible);
        });

        document.body.appendChild(scratchpadButton);
        document.body.appendChild(toggleBottomButtonsBtn);
        document.body.appendChild(scratchpadContainer);

        // Initial render
        renderTabs();
        textarea.value = tabs[activeTab] ? tabs[activeTab].content : '';

    } catch (err) {
        // Log error but do not break the rest of the page
        console.error('[Scratchpad] Error initializing scratchpad:', err);
    }
})();