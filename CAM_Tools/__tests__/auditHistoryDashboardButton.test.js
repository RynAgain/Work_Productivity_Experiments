import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { AuditHistoryDashboard } from '../JS/auditHistoryDashboardButton.js';

describe('AuditHistoryDashboard component', () => {
  test('should render the audit dashboard button', () => {
    const { getByText } = render(<AuditHistoryDashboard />);
    const button = getByText('Audit Dashboard');
    expect(button).toBeInTheDocument();
  });

  test('should open the dashboard when the button is clicked', () => {
    const { getByText, queryByText } = render(<AuditHistoryDashboard />);
    const button = getByText('Audit Dashboard');
    fireEvent.click(button);
    const dashboard = queryByText('Audit History Dashboard');
    expect(dashboard).toBeInTheDocument();
  });

  test('should close the dashboard when the close button is clicked', () => {
    const { getByText, queryByText } = render(<AuditHistoryDashboard />);
    const button = getByText('Audit Dashboard');
    fireEvent.click(button);
    const closeButton = getByText('Close');
    fireEvent.click(closeButton);
    const dashboard = queryByText('Audit History Dashboard');
    expect(dashboard).not.toBeInTheDocument();
  });
});
