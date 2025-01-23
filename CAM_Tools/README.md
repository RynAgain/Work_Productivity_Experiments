# Tampermonkey Script Breakdown

This repository contains a set of scripts designed for use with Tampermonkey. The scripts are split into separate files for better maintainability, each handling a specific button's functionality on the webpage.

## Files

1. **MainScript.js**: The main script that includes `@require` directives for the other scripts. This script should be installed in the Tampermonkey extension.

2. **DownloadButton.js**: Handles the creation and functionality of the "Download Data" button. It initiates a download process, tracks progress, and allows cancellation. Includes a delay function to prevent API overloading.

3. **AddItemButton.js**: Handles the creation and functionality of the "Add New Item(s)" button. It allows users to input multiple store codes and PLUs, generating a CSV file with the combinations.

4. **ActivateButton.js**: Handles the creation and functionality of the "Activate/Deactivate Item(s)" button. It toggles the activation state of items.

5. **RedriveButton.js**: Handles the creation and functionality of the "Redrive" button. It triggers a redrive process for selected items.

6. **PLUDedupeListButton.js**: Provides functionality for deduplicating and listing PLU numbers. It allows users to input numbers, deduplicate them, and copy the result.

7. **NISFileToCAMUploadButton.js**: Handles the upload of NIS files to CAM. It prompts for a file upload and additional user inputs like "Andon Cord" and "Store/Region".

8. **PLUToASINButton.js**: Converts PLU codes to ASINs. It allows users to input store codes and PLU(s), fetches item availability data, and displays results in a table. Includes CSV export functionality.

9. **GeneralHelpToolsButton.js**: Adds a "General Help Tools" button that opens an overlay with a list of other tool buttons.

10. **GetAllStoreInfo.js**: Fetches all store information and merchant IDs.

11. **GetMerchantIDFromStoreCode.js**: Retrieves the merchant ID from a given store code.

12. **EasterEgg.js**: Contains preload, create, and update functions for an Easter egg feature.

13. **ScanCodeTo13PLUButton.js**: Converts scan codes to 13-digit PLU codes.

## Usage

- **MainScript.js**: Install this script in Tampermonkey. It will automatically include the other scripts using the `@require` directive.
- **Button Scripts**: Host these scripts on a public GitHub repository. Update the `@require` URLs in `MainScript.js` to point to the raw GitHub URLs of these scripts.

## How to Use

### DownloadButton.js
- **Inputs**: None required directly from the user.
- **Functionality**: Initiates a download process for item data, tracks progress, and allows cancellation.
- **Warning**: Might trigger API overloading, and bug the queso team.  Use only when needed.  It basically rapidly spams the API for all the data.

### AddItemButton.js
- **Inputs**: Store codes, PLU(s), current inventory, availability, Andon Cord status, tracking dates.
- **Functionality**: Generates a CSV file with combinations of store codes and PLU(s).

### ActivateButton.js
- **Inputs**: PLU(s), store/region codes, Andon Cord status.
- **Functionality**: Toggles the activation state of items and generates an upload file.

### RedriveButton.js
- **Inputs**: None required directly from the user.
- **Functionality**: Triggers a redrive process for selected items.

### PLUDedupeListButton.js
- **Inputs**: PLU numbers.
- **Functionality**: Deduplicates and lists PLU numbers, copying the result to the clipboard.

### NISFileToCAMUploadButton.js
- **Inputs**: NIS file, Andon Cord status, store/region codes.
- **Functionality**: Uploads NIS files to CAM with additional user inputs.

### PLUToASINButton.js
- **Inputs**: Store code, PLU(s).
- **Functionality**: Converts PLU codes to ASINs, displays results in a table, and allows CSV export.

### GeneralHelpToolsButton.js
- **Inputs**: None required directly from the user.
- **Functionality**: Opens an overlay with a list of other tool buttons.

### GetMerchantIDFromStoreCode.js
- **Inputs**: Store code.
- **Functionality**: Retrieves the merchant ID from a given store code.
## Installation

1. Install `MainScript.js` in Tampermonkey.
2. Check for updates periodically in the Tampermonkey dashboard.

## Random Issues
1. Sometimes the download button just won't appear. Refresh the page.

## License

Not for public use.

## TODO

- [x] Implement the download functionality for the "Download Data" button. (needs testing now)
- [x] Add functionality for the "Add New Item(s)" button.
- [x] Implement the activation/deactivation logic for the "Activate/Deactivate Item(s)" button.
- [x] Add functionality for the "Redrive" button.
- [x] Add new buttons!
- [ ] Test and verify the "NIS File to CAM Upload" button functionality.

- [ ] I feel like adding a color changer that will let the user pick a primary color for cam... not important tho

- [ ] Easter egg?

- [ ]
