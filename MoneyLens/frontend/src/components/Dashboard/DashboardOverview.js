import React from 'react';

function DashboardOverview({ income, expenses, balance }) {
  return (
    <div className="dashboard-overview">
      <h3>Financial Overview</h3>
      <div className="overview-item">
        <span>Total Income:</span>
        <span>${income ? income.toFixed(2) : '0.00'}</span>
      </div>
      <div className="overview-item">
        <span>Total Expenses:</span>
        <span>${expenses ? expenses.toFixed(2) : '0.00'}</span>
      </div>
      <div className="overview-item">
        <span>Balance:</span>
        <span>${balance ? balance.toFixed(2) : '0.00'}</span>
      </div>
    </div>
  );
}

export default DashboardOverview;