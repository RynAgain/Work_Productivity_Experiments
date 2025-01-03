# Admin Tools v1

## Overview

Admin Tools v1 is a Tampermonkey userscript designed to enhance the user interface of specific Amazon internal web pages by adding buttons that facilitate data interaction with the backend API. This script is particularly useful for users who need to download data, add new items, activate/deactivate items, or perform redrive operations.

## Functions

- **addButtonsAndProgress**: Adds buttons and a progress tracker to the page. It checks if the buttons already exist to avoid duplication.
- **fetchItemsForStore**: Fetches item availability data for a specific store. It processes the data to ensure consistency and accuracy.

## Features

- **Download Data Button**: Allows users to download data from the API. It fetches store information and item availability, compiles the data, and generates a CSV file for download.
- **Add New Item(s) Button**: Placeholder for future functionality to add new items.
- **Activate/Deactivate Item(s) Button**: Placeholder for future functionality to activate or deactivate items.
- **Redrive Button**: Placeholder for future functionality to perform redrive operations.
- **Progress Tracker**: Displays the progress of data compilation and download operations.

## Installation

1. Install Tampermonkey extension in your browser.
2. Create a new script in Tampermonkey and paste the contents of `Admin_tools_v1` into it.
3. Save the script.

## Usage

- Navigate to any page under `https://*.cam.wfm.amazon.dev/*`.
- The script will automatically add the buttons to the bottom of the page.
- Click the "Download Data" button to fetch and download data as a CSV file.
- Other buttons are currently placeholders and will display a "Coming Soon" alert when clicked.

## Technical Details

- The script uses a `MutationObserver` to detect changes in the DOM and ensure buttons are added dynamically.
- It makes use of the Fetch API to interact with the backend services, sending requests to retrieve store and item data.
- Data transformations are applied to ensure consistency and accuracy before generating the CSV file.

## Author

Ryan Satterfield

## License

No use acceptable.
