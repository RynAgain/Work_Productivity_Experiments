(function() {
    'use strict';

    // Function to handle the audit history pull
    function auditHistoryPull(storeId, wfmScanCode) {
        console.log('Audit History Pull initiated for Store:', storeId, 'PLU:', wfmScanCode);

        // Determine the environment (prod or gamma)
        const environment = window.location.hostname.includes('gamma') ? 'gamma' : 'prod';
        const apiUrlBase = `https://${environment}.cam.wfm.amazon.dev/api/`;

        // Define the API endpoint and headers for getting audit history
        const headers = {
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9',
            'content-type': 'application/x-amz-json-1.0',
            'x-amz-target': 'WfmCamBackendService.GetAuditHistory',
            'x-amz-user-agent': 'aws-sdk-js/0.0.1 os/Windows/NT_10.0 lang/js md/browser/Chrome_133.0.0.0',
            'Referer': `https://${environment}.cam.wfm.amazon.dev/store/${storeId}/item/${wfmScanCode}`,
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        };

        const payload = {
            storeId: storeId,
            wfmScanCode: wfmScanCode
        };

        // Make the API call
        fetch(apiUrlBase, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            console.log('Audit History Data:', data);
            // Handle the data received from the API
        })
        .catch(error => {
            console.error('Error fetching audit history:', error);
        });
    }

    // Expose the function to the global scope for testing
    try {
        module.exports = {
            auditHistoryPull
        };
    } catch (e) {
        // Handle the error if needed
    }

    // Add event listener to the audit history pull button
    const auditHistoryPullButton = document.getElementById('auditHistoryPullButton');
    if (auditHistoryPullButton) {
        auditHistoryPullButton.addEventListener('click', function() {
            // Example usage: replace with actual storeId and wfmScanCode
            auditHistoryPull('APS', '107998');
        });
    }
})();
