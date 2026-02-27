(function() {
    'use strict';

    // Style configurations
    // Dark-mode style configurations using --tm-* design tokens
    const STYLES = {
        button: {
            position: 'fixed',
            bottom: '0',
            left: '80%',
            width: '20%',
            height: '40px',
            zIndex: '1000',
            fontSize: '14px',
            backgroundColor: '#1a1a1a',
            color: '#f1f1f1',
            border: '1px solid #303030',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'background 150ms ease',
            fontFamily: "'Roboto', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif"
        },
        overlay: {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.6)',
            zIndex: '9995',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        },
        formContainer: {
            position: 'relative',
            background: '#1a1a1a',
            padding: '0',
            borderRadius: '12px',
            width: '650px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            border: '1px solid #303030',
            fontFamily: "'Roboto', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
            overflow: 'hidden',
            color: '#f1f1f1'
        },
        headerBar: {
            background: '#242424',
            color: '#f1f1f1',
            padding: '12px 16px',
            fontSize: '16px',
            fontWeight: '600',
            letterSpacing: '0.3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #303030'
        },
        closeButton: {
            fontSize: '22px',
            cursor: 'pointer',
            color: '#aaaaaa',
            background: 'transparent',
            border: 'none',
            padding: '0 4px',
            borderRadius: '4px',
            transition: 'color 150ms ease'
        },
        contentArea: {
            padding: '16px',
            maxHeight: '80vh',
            overflowY: 'auto'
        },
        buttonGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
            marginBottom: '16px'
        },
        toolButton: {
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #3f3f3f',
            borderRadius: '4px',
            backgroundColor: '#242424',
            color: '#f1f1f1',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            textAlign: 'center',
            fontFamily: 'inherit'
        },
        restrictedButton: {
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #d32f2f',
            borderRadius: '4px',
            backgroundColor: 'rgba(211, 47, 47, 0.1)',
            color: '#ff6659',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            textAlign: 'center',
            fontFamily: 'inherit'
        },
        sectionHeader: {
            margin: '0 0 12px 0',
            fontSize: '14px',
            color: 'var(--tm-accent-primary, #3ea6ff)',
            fontWeight: '600'
        },
        restrictedHeader: {
            margin: '16px 0 8px 0',
            fontSize: '13px',
            color: '#d32f2f',
            fontWeight: '600'
        },
        linkSection: {
            textAlign: 'center',
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid #303030'
        },
        link: {
            display: 'block',
            marginTop: '8px',
            color: 'var(--tm-accent-primary, #3ea6ff)',
            textDecoration: 'none',
            fontSize: '13px'
        }
    };

    // Apply styles to element
    function applyStyles(element, styles) {
        Object.assign(element.style, styles);
    }

    // Create main button
    function createMainButton() {
        const button = document.createElement('button');
        button.id = 'generalHelpToolsButton';
        button.innerHTML = 'General Help Tools';
        button.className = 'button';
        
        applyStyles(button, STYLES.button);
        
        // Hover effects
        button.addEventListener('mouseover', () => {
            button.style.backgroundColor = '#242424';
        });
        button.addEventListener('mouseout', () => {
            button.style.backgroundColor = '#1a1a1a';
        });
        
        return button;
    }

    // Create overlay structure
    function createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'generalHelpOverlay';
        applyStyles(overlay, STYLES.overlay);
        
        // Close overlay when clicking outside
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                overlay.style.display = 'none';
            }
        });
        
        return overlay;
    }

    // Create header with close button
    function createHeader() {
        const headerBar = document.createElement('div');
        applyStyles(headerBar, STYLES.headerBar);
        
        const title = document.createElement('span');
        title.textContent = 'General Help Tools';
        
        const closeButton = document.createElement('span');
        closeButton.innerHTML = '&times;';
        applyStyles(closeButton, STYLES.closeButton);
        
        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.color = '#f1f1f1';
        });
        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.color = '#aaaaaa';
        });
        closeButton.addEventListener('click', () => {
            document.getElementById('generalHelpOverlay').style.display = 'none';
        });
        
        headerBar.appendChild(title);
        headerBar.appendChild(closeButton);
        
        return headerBar;
    }

    // Create main tool buttons
    function createToolButtons() {
        const toolButtons = [
            { id: 'pluDedupeListButton', text: 'PLU Dedupe & List' },
            { id: 'scanCodeTo13PLUButton', text: 'Scan Code to 13-PLU' },
            { id: 'pluToAsinButton', text: 'PLU to ASIN' },
            { id: 'getMerchantIdButton', text: 'Get eMerchant IDs' },
            { id: 'getAllStoreInfoButton', text: 'Get All Store Info' },
            { id: 'meatInventoryToUploadConverterButton', text: 'Meat Inventory Converter' },
            { id: 'filechunker', text: 'File Chunker' },
            { id: 'massUploaderButton', text: 'Mass File Upload' },
            { id: 'auditHistoryPullButton', text: 'Audit History Pull' },
            { id: 'desyncFinderButton', text: 'Desync Finder' },
            { id: 'componentUploadBuilderButton', text: 'Component Upload Builder' },
            { id: 'prepFoodsInventoryButton', text: 'PFDS Inventory Converter' }
        ];

        const buttonGrid = document.createElement('div');
        applyStyles(buttonGrid, STYLES.buttonGrid);

        toolButtons.forEach(({ id, text }) => {
            const button = document.createElement('button');
            button.id = id;
            button.textContent = text;
            applyStyles(button, STYLES.toolButton);
            
            // Hover effects
            button.addEventListener('mouseenter', () => {
                button.style.backgroundColor = '#2d2d2d';
                button.style.borderColor = 'var(--tm-accent-primary, #3ea6ff)';
            });
            button.addEventListener('mouseleave', () => {
                button.style.backgroundColor = '#242424';
                button.style.borderColor = '#3f3f3f';
            });
            
            buttonGrid.appendChild(button);
        });

        return buttonGrid;
    }

    // Create restricted section for password-protected buttons
    function createRestrictedSection() {
        const restrictedSection = document.createElement('div');
        
        const restrictedHeader = document.createElement('h4');
        restrictedHeader.textContent = 'Restricted';
        applyStyles(restrictedHeader, STYLES.restrictedHeader);
        
        const restrictedButtons = [
            { id: 'auditHistoryDashboardButton', text: 'Audit History Dashboard' }
        ];

        const restrictedGrid = document.createElement('div');
        applyStyles(restrictedGrid, STYLES.buttonGrid);

        restrictedButtons.forEach(({ id, text }) => {
            const button = document.createElement('button');
            button.id = id;
            button.textContent = text;
            applyStyles(button, STYLES.restrictedButton);
            
            // Hover effects for restricted buttons
            button.addEventListener('mouseenter', () => {
                button.style.backgroundColor = 'rgba(211, 47, 47, 0.2)';
                button.style.borderColor = '#ff6659';
            });
            button.addEventListener('mouseleave', () => {
                button.style.backgroundColor = 'rgba(211, 47, 47, 0.1)';
                button.style.borderColor = '#d32f2f';
            });
            
            restrictedGrid.appendChild(button);
        });

        restrictedSection.appendChild(restrictedHeader);
        restrictedSection.appendChild(restrictedGrid);
        
        return restrictedSection;
    }

    // Create links section
    function createLinksSection() {
        const linksSection = document.createElement('div');
        applyStyles(linksSection, STYLES.linkSection);
        
        const creditsLink = document.createElement('a');
        creditsLink.href = '#';
        creditsLink.id = 'creditsLink';
        creditsLink.textContent = 'Credits';
        applyStyles(creditsLink, STYLES.link);
        
        creditsLink.addEventListener('click', (event) => {
            event.preventDefault();
            if (window.TmTheme && window.TmTheme.showToast) {
                window.TmTheme.showToast('v3.0.0 -- Ryan Satterfield -- Unofficial tool', 'info', 4000);
            }
        });
        
        const dailyLink = document.createElement('a');
        dailyLink.href = 'https://share.amazon.com/sites/WFM_eComm_ABI/_layouts/15/download.aspx?SourceUrl=%2Fsites%2FWFM%5FeComm%5FABI%2FShared%20Documents%2FWFMOAC%2FDailyInventory%2FWFMOAC%20Inventory%20Data%2Exlsx&FldUrl=&Source=https%3A%2F%2Fshare%2Eamazon%2Ecom%2Fsites%2FWFM%5FeComm%5FABI%2FShared%2520Documents%2FForms%2FAllItems%2Easpx%3FRootFolder%3D%252Fsites%252FWFM%255FeComm%255FABI%252FShared%2520Documents%252FWFMOAC%252FDailyInventory%26FolderCTID%3D0x0120007B3CF5C516656843AD728338D9C2AFA4';
        dailyLink.target = '_blank';
        dailyLink.id = 'dailyLink';
        dailyLink.textContent = 'Daily Seller Inventory';
        applyStyles(dailyLink, STYLES.link);
        
        linksSection.appendChild(creditsLink);
        linksSection.appendChild(dailyLink);
        
        return linksSection;
    }

    // Create complete modal content
    function createModalContent() {
        const formContainer = document.createElement('div');
        applyStyles(formContainer, STYLES.formContainer);
        
        const contentArea = document.createElement('div');
        applyStyles(contentArea, STYLES.contentArea);
        
        const mainHeader = document.createElement('h3');
        mainHeader.textContent = 'Tools';
        applyStyles(mainHeader, STYLES.sectionHeader);
        
        // Assemble the modal
        formContainer.appendChild(createHeader());
        contentArea.appendChild(mainHeader);
        contentArea.appendChild(createToolButtons());
        // Restricted section removed -- audit history dashboard was never implemented
        contentArea.appendChild(createLinksSection());
        formContainer.appendChild(contentArea);
        
        return formContainer;
    }

    // Show overlay
    function showOverlay() {
        const existingOverlay = document.getElementById('generalHelpOverlay');
        if (existingOverlay) {
            existingOverlay.style.display = 'flex';
            return;
        }
        
        const overlay = createOverlay();
        const modalContent = createModalContent();
        
        overlay.appendChild(modalContent);
        document.body.appendChild(overlay);
    }

    // Main function to add the General Help Tools button
    function addGeneralHelpToolsButton() {
        console.log('[HelpTools] Attempting to add General Help Tools button');

        // Check if the button already exists
        if (document.getElementById('generalHelpToolsButton')) {
            console.log('General Help Tools button already exists');
            return;
        }

        const button = createMainButton();
        button.addEventListener('click', () => {
            console.log('General Help Tools button clicked');
            showOverlay();
        });

        document.body.appendChild(button);
        console.log('General Help Tools button added to the page');
    }

    // Export for testing
    try {
        module.exports = {
            addGeneralHelpToolsButton
        };
    } catch (e) {
        // Handle the error if needed
    }

    // Use MutationObserver to detect changes in the DOM
    const observer = new MutationObserver(() => {
        if (!document.getElementById('generalHelpToolsButton')) {
            addGeneralHelpToolsButton();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial attempt to add the General Help Tools button
    addGeneralHelpToolsButton();
})();
