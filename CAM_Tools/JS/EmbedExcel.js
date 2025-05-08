(function () {
    'use strict';

    const BUTTON_ID = 'embed-excel-btn';
    const OVERLAY_ID = 'embed-excel-overlay';

    // Inject styles for button and overlay
    const style = document.createElement('style');
    style.textContent = `
        #${BUTTON_ID} {
            position: fixed;
            left: 0;
            top: 0;
            z-index: 3201;
            background: #004E36;
            color: #fff;
            border: none;
            border-radius: 0 5px 5px 0;
            padding: 0;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 2px 2px 8px rgba(0,0,0,0.2);
            cursor: pointer;
            font-size: 18px;
            transition: background 0.2s;
        }
        #${BUTTON_ID}:hover {
            background: #218838;
        }
        #${OVERLAY_ID} {
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        #embed-excel-modal {
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 1.5px 6px rgba(0,78,54,0.10);
            padding: 24px 28px 20px 28px;
            min-width: 520px;
            min-height: 420px;
            max-width: 95vw;
            max-height: 95vh;
            display: flex;
            flex-direction: column;
            position: relative;
        }
        #embed-excel-modal h3 {
            margin-top: 0;
            margin-bottom: 12px;
            color: #004E36;
        }
        #embed-excel-close {
            position: absolute;
            top: 10px; right: 10px;
            font-size: 24px;
            color: #888;
            background: none;
            border: none;
            cursor: pointer;
        }
        #embed-excel-controls {
            margin-bottom: 12px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        #embed-excel-iframe {
            width: 800px;
            height: 500px;
            max-width: 80vw;
            max-height: 60vh;
            border: 1px solid #ccc;
            border-radius: 6px;
            margin-top: 8px;
            background: #f8f8f8;
        }
        #embed-excel-link-input {
            width: 100%;
            padding: 6px 8px;
            border: 1px solid #ccc;
            border-radius: 5px;
            font-size: 15px;
        }
        #embed-excel-open-btn, #embed-excel-blank-btn {
            background: #004E36;
            color: #fff;
            border: none;
            border-radius: 5px;
            padding: 8px 0;
            font-size: 15px;
            cursor: pointer;
            transition: background 0.2s;
            width: 100%;
        }
        #embed-excel-open-btn:hover, #embed-excel-blank-btn:hover {
            background: #218838;
        }
        #embed-excel-instructions {
            font-size: 14px;
            color: #333;
            margin-bottom: 4px;
        }
    `;
    document.head.appendChild(style);

    function addEmbedExcelButton() {
        if (document.getElementById(BUTTON_ID)) return;
        const btn = document.createElement('button');
        btn.id = BUTTON_ID;
        btn.title = 'Embed Microsoft Excel Online';
        btn.innerHTML = `
            <svg width="22" height="22" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="16" rx="2" fill="#fff" stroke="none"/>
                <rect x="3" y="4" width="18" height="16" rx="2"/>
                <path d="M7 8h10M7 12h10M7 16h6"/>
                <rect x="5.5" y="6.5" width="3" height="11" rx="0.5" fill="#004E36" stroke="#004E36"/>
                <path d="M7 8v8" stroke="#fff" stroke-width="1.2"/>
                <path d="M5.5 10.5h3" stroke="#fff" stroke-width="1.2"/>
            </svg>
        `;
        btn.onclick = showEmbedExcelOverlay;
        document.body.appendChild(btn);
    }

    function showEmbedExcelOverlay() {
        if (document.getElementById(OVERLAY_ID)) return;
        const overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;

        overlay.innerHTML = `
            <div id="embed-excel-modal">
                <button id="embed-excel-close" title="Close">&times;</button>
                <h3>Microsoft Excel Online Editor</h3>
                <div id="embed-excel-controls">
                    <button id="embed-excel-blank-btn">Open Blank Excel Online</button>
                    <div id="embed-excel-instructions">
                        <b>To edit your own file:</b><br>
                        1. Upload your Excel file to <a href="https://onedrive.live.com/" target="_blank" rel="noopener">OneDrive</a> or <a href="https://sharepoint.com/" target="_blank" rel="noopener">SharePoint</a>.<br>
                        2. Get the sharing link for the file (must be a direct link to the .xlsx file).<br>
                        3. Paste the link below and click "Open from Link".
                    </div>
                    <input type="text" id="embed-excel-link-input" placeholder="Paste OneDrive/SharePoint Excel file link here..." />
                    <button id="embed-excel-open-btn">Open from Link</button>
                </div>
                <iframe id="embed-excel-iframe" style="display:none"></iframe>
            </div>
        `;
        document.body.appendChild(overlay);

        // Close logic
        document.getElementById('embed-excel-close').onclick = () => {
            document.body.removeChild(overlay);
        };
        overlay.onclick = (e) => {
            if (e.target === overlay) document.body.removeChild(overlay);
        };

        const iframe = document.getElementById('embed-excel-iframe');
        const openBtn = document.getElementById('embed-excel-open-btn');
        const blankBtn = document.getElementById('embed-excel-blank-btn');
        const linkInput = document.getElementById('embed-excel-link-input');

        // Open blank Excel Online (new workbook)
        blankBtn.onclick = function () {
            // This opens a blank workbook in Excel Online (in the user's SSO context)
            iframe.style.display = '';
            iframe.src = "https://excel.office.com/?auth=2";
        };

        // Open from OneDrive/SharePoint link
        openBtn.onclick = function () {
            const url = linkInput.value.trim();
            if (!url) {
                alert("Please paste a OneDrive or SharePoint Excel file link.");
                return;
            }
            // The embed URL for Excel Online is:
            // https://excel.office.com/embed?resurl={encoded file url}
            // The file must be accessible to the user (SSO will prompt if not signed in)
            iframe.style.display = '';
            iframe.src = "https://excel.office.com/embed?resurl=" + encodeURIComponent(url);
        };
    }

    // Use MutationObserver to ensure button stays present
    const observer = new MutationObserver(addEmbedExcelButton);
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial attempt to add the button
    addEmbedExcelButton();

    // Expose for testing
    try {
        module.exports = { addEmbedExcelButton };
    } catch (e) {}
})();