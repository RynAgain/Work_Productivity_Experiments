/**
 * @file auditHistoryDashboardButton.js
 * @description React-based overlay dashboard for audit history.
 * @requires React, ReactDOM, and ActivateButton API logic available as window.fetchAuditData
 */

(function() {
  // React component for the audit history dashboard overlay
  function AuditHistoryDashboard() {
    const [visible, setVisible] = React.useState(false);
    const [auditData, setAuditData] = React.useState([]);
    const [filter, setFilter] = React.useState('');

    const openDashboard = function() {
      if (window.fetchAuditData) {
        window.fetchAuditData({ filter })
          .then(function(data) {
            setAuditData(data);
            setVisible(true);
          })
          .catch(function(err) {
            console.error('Error fetching audit data:', err);
          });
      } else {
        console.error('fetchAuditData is not available');
      }
    };

    const closeDashboard = function() {
      setVisible(false);
    };

    return React.createElement(
      'div',
      null,
      React.createElement(
        'button',
        { id: 'auditHistoryDashboardTrigger', onClick: openDashboard },
        'Audit Dashboard'
      ),
      visible &&
        React.createElement(
          'div',
          { className: 'overlay', style: {
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
            } },
          React.createElement(
            'div',
            { className: 'dashboard', style: {
                position: 'relative',
                backgroundColor: '#fff',
                padding: '20px',
                borderRadius: '5px',
                width: '300px'
              } },
            React.createElement(
              'button',
              { onClick: closeDashboard, style: {
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#fff',
                  backgroundColor: '#000',
                  padding: '5px'
                } },
              'Close'
            ),
            React.createElement('h2', null, 'Audit History Dashboard'),
            React.createElement(
              'div',
              { className: 'filter' },
              React.createElement('input', {
                type: 'text',
                placeholder: 'Enter filter criteria',
                value: filter,
                onChange: function(e) { setFilter(e.target.value); },
                style: { width: '100%', marginBottom: '10px' }
              })
            ),
            React.createElement(
              'div',
              { className: 'data' },
              auditData && auditData.length > 0
                ? auditData.map(function(item, index) {
                    return React.createElement(
                      'div',
                      { key: index },
                      JSON.stringify(item)
                    );
                  })
                : React.createElement('p', null, 'No audit data available.')
            )
          )
        )
    );
  }

  function launchAuditDashboard() {
    var containerId = 'auditHistoryDashboardContainer';
    var container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      document.body.appendChild(container);
    }
    ReactDOM.render(React.createElement(AuditHistoryDashboard), container);
  }

  // Attach event listener to the physical button id provided ('generalHelptoolsButton')
  var btn = document.getElementById('generalHelptoolsButton');
  if (btn) {
    btn.addEventListener('click', launchAuditDashboard);
  } else {
    // Fallback: create a trigger button if not already present
    var triggerBtn = document.createElement('button');
    triggerBtn.id = 'auditHistoryDashboardTrigger';
    triggerBtn.innerText = 'Audit Dashboard';
    triggerBtn.addEventListener('click', launchAuditDashboard);
    document.body.appendChild(triggerBtn);
  }
})();
