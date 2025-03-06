// removed, without purpose built data connections the api can never handle the goals of this script.
(function() {
  // Expose the function to the global scope for testing, 
  try {
      module.exports = {
          AuditHistoryDashboard
      };
  } catch (e) {
      // Handle the error if needed
  }

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
        { id: 'auditHistoryDashboardTrigger', onClick: openDashboard, className: 'btn btn-primary' },
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
              { onClick: closeDashboard, className: 'btn btn-danger', style: {
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  fontSize: '24px',
                  cursor: 'pointer',
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
                className: 'form-control',
                style: { marginBottom: '10px' }
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

  // Attach event listener to the button with id 'generalHelpToolsButton'
  var btn = document.getElementById('generalHelpToolsButton');
  if (btn) {
    btn.addEventListener('click', launchAuditDashboard);
    // Add Bootstrap classes to ensure standardized styling
    btn.classList.add('btn', 'btn-primary');
  } else {
    // Fallback: create a trigger button if not present
    var triggerBtn = document.createElement('button');
    triggerBtn.id = 'auditHistoryDashboardTrigger';
    triggerBtn.innerText = 'Audit Dashboard';
    triggerBtn.className = 'btn btn-primary';
    triggerBtn.addEventListener('click', launchAuditDashboard);
    document.body.appendChild(triggerBtn);
  }

  // MutationObserver to reapply Bootstrap styles and event listener if the trigger button is replaced
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.id === 'generalHelpToolsButton') {
          node.classList.add('btn', 'btn-primary');
          node.addEventListener('click', launchAuditDashboard);
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
