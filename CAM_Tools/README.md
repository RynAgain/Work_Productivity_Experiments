# Tampermonkey Script Breakdown

This repository contains a set of scripts designed for use with Tampermonkey. The scripts are split into separate files for better maintainability, each handling a specific button's functionality on the webpage.

## Files

1. **MainScript.js**: The main script that includes `@require` directives for the other scripts. This script should be installed in the Tampermonkey extension.

2. **DownloadButton.js**: Handles the creation and functionality of the "Download Data" button. It initiates a download process, tracks progress, and allows cancellation.

3. **AddItemButton.js**: Handles the creation and functionality of the "Add New Item(s)" button. It allows users to input multiple store codes and PLUs, generating a CSV file with the combinations.

4. **ActivateButton.js**: Handles the creation and functionality of the "Activate/Deactivate Item(s)" button. It toggles the activation state of items.

5. **RedriveButton.js**: Handles the creation and functionality of the "Redrive" button. It triggers a redrive process for selected items.

6. **InformationButton.js**: Provides additional information about the items or processes. It displays detailed breakdowns and usage instructions.

## Usage

- **MainScript.js**: Install this script in Tampermonkey. It will automatically include the other scripts using the `@require` directive.
- **Button Scripts**: Host these scripts on a public GitHub repository. Update the `@require` URLs in `MainScript.js` to point to the raw GitHub URLs of these scripts.

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
- [ ] Add functionality for the "Redrive" button.
