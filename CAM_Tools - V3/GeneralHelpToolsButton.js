(function () {
  'use strict';

  // Helper function to create and style an element
  const createElementWithStyles = (tag, styles = {}) => {
    const el = document.createElement(tag);
    Object.assign(el.style, styles);
    return el;
  };

  // Helper to create a button with id, innerHTML and styles
  const createButton = (id, innerHTML, styles = {}) => {
    const btn = createElementWithStyles('button', styles);
    btn.id = id;
    btn.innerHTML = innerHTML;
    return btn;
  };

  const addGeneralHelpToolsButton = () => {
    console.log('Attempting to add General Help Tools button');

    if (document.getElementById('generalHelpToolsButton')) {
      console.log('General Help Tools button already exists');
      return;
    }

    const buttonStyles = {
      position: 'fixed',
      bottom: '0',
      left: '80%',
      width: '20%',
      height: '40px',
      zIndex: '1000',
      fontSize: '14px',
      backgroundColor: '#004E36',
      color: '#fff',
      border: 'none',
      borderRadius: '5px'
    };

    const generalHelpToolsButton = createButton('generalHelpToolsButton', 'General Help Tools', buttonStyles);
    // Apply cursor with !important
    generalHelpToolsButton.style.setProperty('cursor', 'pointer', 'important');

    document.body.appendChild(generalHelpToolsButton);
    console.log('General Help Tools button added to the page');

    generalHelpToolsButton.addEventListener('mouseover', () => {
      generalHelpToolsButton.style.backgroundColor = '#218838';
    });

    generalHelpToolsButton.addEventListener('mouseout', () => {
      generalHelpToolsButton.style.backgroundColor = '#004E36';
    });

    generalHelpToolsButton.addEventListener('click', () => {
      console.log('General Help Tools button clicked');
      const overlay = createElementWithStyles('div', {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: '1001',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      });
      overlay.id = 'generalHelpOverlay';

      const closeButton = createElementWithStyles('span', {
        position: 'absolute',
        top: '10px',
        right: '10px',
        fontSize: '24px',
        cursor: 'pointer',
        color: '#fff',
        backgroundColor: '#000',
        padding: '5px',
        borderRadius: '0'
      });
      closeButton.innerHTML = '&times;';
      closeButton.addEventListener('click', () => {
        document.body.removeChild(overlay);
      });

      const formContainer = createElementWithStyles('div', {
        position: 'relative',
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '5px',
        width: '300px'
      });

      formContainer.innerHTML = `
                <h3>General Help Tools</h3>
                <button id="pluDedupeListButton" style="width: 100%; margin-bottom: 10px;">PLU Dedupe & List</button>
                <button id="nisFileToCAMUploadButton" style="width: 100%; margin-bottom: 10px;">zNon-functional Buttonz</button>
                <button id="scanCodeTo13PLUButton" style="width: 100%; margin-bottom: 10px;">Scan Code to 13-PLU</button>
                <button id="pluToAsinButton" style="width: 100%; margin-bottom: 10px;">Basic PLU to ASIN</button>
                <button id="getMerchantIdButton" style="width: 100%; margin-bottom: 10px;">Get eMerchant IDs from Store Code</button>
                <button id="getAllStoreInfoButton" style="width: 100%; margin-bottom: 10px;">Get All Store Info</button>
                <button id="meatInventoryToUploadConverterButton" style="width: 100%; margin-bottom: 10px;">Meat Inventory to Upload Converter</button>
                <button id="atcpropButton" style="width: 100%; margin-bottom: 10px;">zATC Propagation Toolz</button>
                <button id="filechunker" style="width: 100%; margin-bottom: 10px;">File Chunker</button>
                <button id="massUploaderButton" style="width: 100%; margin-bottom: 10px;">Mass File Upload</button>
                <button id="auditHistoryDashboardButton" style="width: 100%; margin-bottom: 10px;">zAudit History Dashboardz</button>
                <button id="dailyInventoryTool" style="width: 100%; margin-bottom: 10px;">zDaily Inventory Toolz</button>
                <a href="#" id="creditsLink" style="display: block; text-align: center; margin-top: 10px;">Credits</a>
            `;

      formContainer.appendChild(closeButton);
      overlay.appendChild(formContainer);
      document.body.appendChild(overlay);

      // Optional chaining to ensure elements exist
      document.getElementById('highlightToggle')?.addEventListener('change', (event) => {
        if (event.target.checked) {
          document.body.style.backgroundColor = "#222";
          document.body.style.color = "#fff";
        } else {
          document.body.style.backgroundColor = "#f5f5f5";
          document.body.style.color = "#000";
        }
      });

      document.getElementById('creditsLink')?.addEventListener('click', (event) => {
        event.preventDefault();
        alert(
          'Software Version: 2.5\nLast Update Date: 2025-2-10\nAuthor: Ryan Satterfield\nThis is an unofficial tool, if it stops working and I no longer work here (currently on contract ending March 31) I dont know how it will get fixed.'
        );
      });
    });
  };

  const observer = new MutationObserver(addGeneralHelpToolsButton);
  observer.observe(document.body, { childList: true, subtree: true });

  addGeneralHelpToolsButton();
})();
