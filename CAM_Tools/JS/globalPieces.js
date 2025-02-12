// Reusable CSS styles
const styles = `
    .input-field {
        font-family: inherit;
        font-size: 16px;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        width: 100%;
        box-sizing: border-box;
        transition: border-color 0.3s, box-shadow 0.3s;
    }
    .input-field:focus {
        border-color: #007bff;
        box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
    }
    .button {
        font-family: inherit;
        font-size: 14px;
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        background-color: #004E36;
        color: #fff;
        cursor: pointer;
        transition: background-color 0.3s;
    }
    .button:hover {
        background-color: #218838;
    }
    .overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1001;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .form-container {
        position: relative;
        background-color: #fff;
        padding: 20px;
        border-radius: 5px;
        width: 300px;
    }
    .close-button {
        position: absolute;
        top: 10px;
        right: 10px;
        font-size: 24px;
        cursor: pointer;
        color: #fff;
        background-color: #000;
        padding: 5px;
        border-radius: 0;
    }
`;

// Function to inject styles into the document
function injectStyles() {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);
}

// Reusable HTML templates
const overlayTemplate = (content) => `
    <div class="overlay">
        <div class="form-container">
            <span class="close-button">&times;</span>
            ${content}
        </div>
    </div>
`;

// Export the functions and templates
export { injectStyles, overlayTemplate };
