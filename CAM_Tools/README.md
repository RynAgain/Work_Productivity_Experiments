# Tampermonkey Script Breakdown

This repository contains a set of scripts designed for use with Tampermonkey. The scripts are split into separate files for better maintainability, each handling a specific button's functionality on the webpage.

## Files

1. **MainScript.js**: The main script that includes `@require` directives for the other scripts. This script should be installed in the Tampermonkey extension.

2. **DownloadButton.js**: Handles the creation and functionality of the "Download Data" button.

3. **AddItemButton.js**: Handles the creation and functionality of the "Add New Item(s)" button.

4. **ActivateButton.js**: Handles the creation and functionality of the "Activate/Deactivate Item(s)" button.

5. **RedriveButton.js**: Handles the creation and functionality of the "Redrive" button.

## Usage

- **MainScript.js**: Install this script in Tampermonkey. It will automatically include the other scripts using the `@require` directive.
- **Button Scripts**: Host these scripts on a public GitHub repository. Update the `@require` URLs in `MainScript.js` to point to the raw GitHub URLs of these scripts.

## Installation

1. Clone this repository or download the files.
2. Host the button scripts (`DownloadButton.js`, `AddItemButton.js`, `ActivateButton.js`, `RedriveButton.js`) on your GitHub repository.
3. Update the `@require` URLs in `MainScript.js` to point to the hosted scripts.
4. Install `MainScript.js` in Tampermonkey.

## License

Not for public use.

## TODO

- [ ] Implement the download functionality for the "Download Data" button. (needs testing now)
- [ ] Add functionality for the "Add New Item(s)" button.
- [ ] Implement the activation/deactivation logic for the "Activate/Deactivate Item(s)" button.
- [ ] Add functionality for the "Redrive" button.
