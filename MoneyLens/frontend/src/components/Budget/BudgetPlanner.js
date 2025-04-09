import React, { useState, useEffect } from 'react';
import axios from 'axios';

function BudgetPlanner() {
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetCategory, setBudgetCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [budgets, setBudgets] = useState([]);
  const [refreshBudgets, setRefreshBudgets] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get('/categories', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setCategories(response.data);
        } catch (error) {
          console.error('Error fetching categories:', error.response ? error.response.data : error.message);
        }
      }
    };

    const fetchBudgets = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get('/budgets', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setBudgets(response.data);
        } catch (error) {
          console.error('Error fetching budgets:', error.response ? error.response.data : error.message);
        }
      }
    };

    fetchCategories();
    fetchBudgets();
    setRefreshBudgets(false);
  }, [refreshBudgets]);

  const handleSetBudget = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await axios.post(
          '/budgets',
          { category: budgetCategory, monthly_limit: parseFloat(budgetAmount), month, year },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Budget set successfully!');
        setBudgetAmount('');
        setBudgetCategory('');
        setRefreshBudgets(true);
      } catch (error) {
        console.error('Error setting budget:', error.response ? error.response.data : error.message);
        alert(`Error setting budget: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  return (
    <div>
      <h3>Budget Planner</h3>
      <div>
        <label htmlFor="budgetAmount">Budget Amount:</label>
        <input
          type="number"
          id="budgetAmount"
          value={budgetAmount}
          onChange={(e) => setBudgetAmount(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="budgetCategory">Category:</label>
        <select
          id="budgetCategory"
          value={budgetCategory}
          onChange={(e) => setBudgetCategory(e.target.value)}
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>{cat.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="month">Month:</label>
        <select id="month" value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="year">Year:</label>
        <select id="year" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      <button onClick={handleSetBudget}>Set Budget</button>

      <h4>Current Budgets</h4>
      <ul>
        {budgets.map(budget => (
          <li key={budget.id}>
            {budget.category_name} ({new Date(budget.year, budget.month - 1, 1).toLocaleDateString('default', { month: 'long', year: 'numeric' })}): ${budget.monthly_limit}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default BudgetPlanner;