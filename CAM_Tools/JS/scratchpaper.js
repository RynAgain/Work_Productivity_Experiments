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
        // --- Settings Helpers ---
        function getMenuStyleSetting() {
            try {
                const settings = JSON.parse(localStorage.getItem('cam_tools_settings'));
                return settings && settings.menuStyle ? settings.menuStyle : 'side';
            } catch {
                return 'side';
            }
        }

        // --- UI Elements ---
        // Button
        const scratchpadButton = document.createElement('button');
        scratchpadButton.id = 'scratchpad-toggle-btn';
        scratchpadButton.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:0 auto 4px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>Pad';
        scratchpadButton.style.position = 'fixed';
        scratchpadButton.style.left = '0';
        scratchpadButton.style.top = '10vh';
        scratchpadButton.style.zIndex = '2000';
        scratchpadButton.style.background = '#1a1a1a';
        scratchpadButton.style.color = '#f1f1f1';
        scratchpadButton.style.border = '1px solid #303030';
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
        scratchpadContainer.style.width = '340px';
        scratchpadContainer.style.maxWidth = '95vw';
        scratchpadContainer.style.background = '#1a1a1a';
        scratchpadContainer.style.border = '1px solid #303030';
        scratchpadContainer.style.color = '#f1f1f1';
        scratchpadContainer.style.borderRadius = '8px';
        scratchpadContainer.style.boxShadow = '0 2px 12px rgba(0,0,0,0.25)';
        scratchpadContainer.style.display = 'none';
        scratchpadContainer.style.zIndex = '2000';

        // Helper: center the scratchpad on screen
        function centerScratchpad() {
            scratchpadContainer.style.top = '50%';
            scratchpadContainer.style.left = '50%';
            scratchpadContainer.style.transform = 'translate(-50%, -50%)';
            scratchpadContainer.style.right = 'auto';
            scratchpadContainer.style.bottom = 'auto';
        }
        centerScratchpad();

        // Header
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.background = '#242424';
        header.style.color = '#f1f1f1';
        header.style.borderBottom = '1px solid #303030';
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
// Info/disclaimer box (hidden by default, shown when info icon is clicked)
const infoBox = document.createElement('div');
infoBox.id = 'scratchpadInfoBox';
infoBox.style.display = 'none';
infoBox.style.position = 'absolute';
infoBox.style.top = '44px';
infoBox.style.left = '12px';
infoBox.style.background = '#242424';
infoBox.style.color = '#f1f1f1';
infoBox.style.borderLeft = '4px solid var(--tm-accent-primary, #3ea6ff)';
infoBox.style.border = '1px solid #303030';
infoBox.style.padding = '14px 18px 14px 16px';
infoBox.style.borderRadius = '7px';
infoBox.style.fontSize = '15px';
infoBox.style.lineHeight = '1.7';
infoBox.style.boxShadow = '0 2px 12px rgba(0,0,0,0.10)';
infoBox.style.zIndex = '2002';
infoBox.style.minWidth = '220px';
infoBox.style.maxWidth = '320px';
infoBox.style.maxHeight = '60vh';
infoBox.style.overflowY = 'auto';
infoBox.style.transition = 'opacity 0.2s';
infoBox.setAttribute('role', 'dialog');
infoBox.setAttribute('aria-modal', 'false');
infoBox.tabIndex = -1;
infoBox.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:12px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--tm-accent-primary, #3ea6ff)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:2px;">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <div style="flex:1;">
            <div style="font-weight:600;margin-bottom:2px;">Scratchpad</div>
            The Scratchpad is a persistent, multi-tab notepad for quick notes, lists, or code snippets.<br>
            <div style="margin:7px 0 0 0;font-weight:600;">How to use:</div>
            <ol style="margin:7px 0 0 18px;padding:0 0 0 0;">
                <li>Click the <b>Scratchpad</b> button on the left to open or close the pad.</li>
                <li>Use multiple tabs to organize your notes. Double-click a tab to rename it, or click "+" to add a new tab.</li>
                <li>All content is saved automatically and persists across sessions.</li>
                <li>Drag the header to reposition the pad anywhere on the screen.</li>
                <li>Use <b>Ctrl+Shift+S</b> to quickly toggle the pad.</li>
            </ol>
            <div style="margin:7px 0 0 0;font-weight:600;">Tips:</div>
            <ul style="margin:4px 0 0 18px;padding:0 0 0 0;">
                <li>Tab content is saved as you type.</li>
                <li>Close tabs with the "×" on each tab (at least one tab must remain).</li>
                <li>All data is stored locally in your browser and is not synced to the cloud.</li>
            </ul>
        </div>
        <button id="closeScratchpadInfoBoxBtn" aria-label="Close information" style="background:transparent;border:none;color:#aaaaaa;font-size:20px;font-weight:bold;cursor:pointer;line-height:1;padding:0 4px;margin-left:8px;border-radius:4px;transition:color 150ms ease;">&times;</button>
    </div>
`;
scratchpadContainer.style.position = 'relative';
scratchpadContainer.appendChild(infoBox);

// Add info icon to header
const infoIcon = document.createElement('span');
infoIcon.id = 'scratchpadInfoIcon';
infoIcon.tabIndex = 0;
infoIcon.setAttribute('aria-label', 'Show information');
infoIcon.style.display = 'inline-flex';
infoIcon.style.alignItems = 'center';
infoIcon.style.justifyContent = 'center';
infoIcon.style.width = '20px';
infoIcon.style.height = '20px';
infoIcon.style.borderRadius = '50%';
infoIcon.style.background = '#3f3f3f';
infoIcon.style.color = '#f1f1f1';
infoIcon.style.fontWeight = 'bold';
infoIcon.style.fontSize = '15px';
infoIcon.style.cursor = 'pointer';
infoIcon.style.marginLeft = '8px';
infoIcon.style.transition = 'background 0.2s';
infoIcon.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style="display:block;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
`;
header.appendChild(infoIcon);

// Info icon click logic
setTimeout(function() {
    var infoIcon = document.getElementById('scratchpadInfoIcon');
    var infoBox = document.getElementById('scratchpadInfoBox');
    if (infoIcon && infoBox) {
        function showInfoBox() {
            infoBox.style.display = 'block';
            // Clamp position to viewport
            setTimeout(function() {
                var rect = infoBox.getBoundingClientRect();
                var pad = 8;
                var vpW = window.innerWidth, vpH = window.innerHeight;
                // Clamp left/right
                if (rect.right > vpW - pad) {
                    infoBox.style.left = Math.max(12, vpW - rect.width - pad) + 'px';
                }
                if (rect.left < pad) {
                    infoBox.style.left = pad + 'px';
                }
                // Clamp top/bottom
                if (rect.bottom > vpH - pad) {
                    var newTop = Math.max(8, vpH - rect.height - pad);
                    infoBox.style.top = newTop + 'px';
                }
                if (rect.top < pad) {
                    infoBox.style.top = pad + 'px';
                }
            }, 0);
            infoBox.focus();
        }
        function hideInfoBox() {
            infoBox.style.display = 'none';
            infoIcon.focus();
        }
        infoIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            showInfoBox();
        });
        infoIcon.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                showInfoBox();
            }
        });
        // Close button inside infoBox
        var closeBtn = document.getElementById('closeScratchpadInfoBoxBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                hideInfoBox();
            });
        }
        // Dismiss infoBox on Escape key
        infoBox.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                hideInfoBox();
            }
        });
        // Optional: clicking outside infoBox closes it
        document.addEventListener('mousedown', function handler(e) {
            if (infoBox.style.display === 'block' && !infoBox.contains(e.target) && !infoIcon.contains(e.target)) {
                hideInfoBox();
            }
        });
    }
}, 0);
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
                    closeTabBtn.style.color = '#717171';
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
        let hasBeenDragged = false;

        function showScratchpad() {
            if (!hasBeenDragged) centerScratchpad();
            scratchpadContainer.style.display = 'block';
            textarea.focus();
        }
        function hideScratchpad() {
            saveCurrentTabContent();
            scratchpadContainer.style.display = 'none';
        }

        scratchpadButton.addEventListener('click', function() {
            if (scratchpadContainer.style.display === 'none') {
                showScratchpad();
            } else {
                hideScratchpad();
            }
        });
        closeBtn.addEventListener('click', hideScratchpad);

        // Keyboard shortcut: Ctrl+Shift+S to toggle
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
                if (scratchpadContainer.style.display === 'none') {
                    showScratchpad();
                } else {
                    hideScratchpad();
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
            // Clear centering transform on drag start
            scratchpadContainer.style.transform = 'none';
            scratchpadContainer.style.zIndex = '3000';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', function(e) {
            if (isDragging) {
                hasBeenDragged = true;
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
        document.body.appendChild(scratchpadButton);
        document.body.appendChild(scratchpadContainer);

        // Initial render
        renderTabs();
        textarea.value = tabs[activeTab] ? tabs[activeTab].content : '';

    } catch (err) {
        // Log error but do not break the rest of the page
        console.error('[Scratchpad] Error initializing scratchpad:', err);
    }
})();