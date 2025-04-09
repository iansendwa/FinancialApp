import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardOverview from '../components/Dashboard/DashboardOverview';
import ExpenseBreakdownChart from '../components/Dashboard/ExpenseBreakdownChart';
import TrendChart from '../components/Dashboard/TrendChart';

function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get('/dashboard', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setDashboardData(response.data);
          setLoading(false);
        } catch (err) {
          console.error('Error fetching dashboard data:', err.response ? err.response.data : err.message);
          setError(err.response?.data?.message || err.message);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleExportClick = () => {
    const token = localStorage.getItem('token');
    if (token) {
      window.location.href = '/export';
    } else {
      alert('You must be logged in to export data.');
    }
  };

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  if (error) {
    return <div>Error loading dashboard: {error}</div>;
  }

  return (
    <div>
      <h2>Dashboard</h2>
      {dashboardData && (
        <>
          <DashboardOverview
            income={dashboardData.total_income}
            expenses={dashboardData.total_expenses}
            balance={dashboardData.balance}
          />
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
            <div style={{ flex: 1, marginRight: '10px', height: '350px' }}>
              <ExpenseBreakdownChart data={dashboardData.expense_breakdown} />
            </div>
            <div style={{ flex: 1, height: '350px' }}>
              <TrendChart data={dashboardData.trend_data} />
            </div>
          </div>
          <h3>Budget vs Actual Spending (Current Month)</h3>
          <ul>
            {dashboardData.budget_vs_actual && dashboardData.budget_vs_actual.map(item => (
              <li key={item.category}>
                {item.category}: Budgeted ${item.limit.toFixed(2)}, Spent ${item.spent.toFixed(2)}
                {item.spent > item.limit && <span style={{ color: 'red' }}> (Over Budget)</span>}
              </li>
            ))}
            {dashboardData.budget_vs_actual && dashboardData.budget_vs_actual.length === 0 && (
              <li>No budgets set for the current month.</li>
            )}
          </ul>
          <button onClick={handleExportClick}>Export Transactions (CSV)</button>
        </>
      )}
    </div>
  );
}

export default DashboardPage;