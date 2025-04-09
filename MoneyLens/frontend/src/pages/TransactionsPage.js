import React, { useState, useEffect } from 'react';
import AddTransaction from '../components/Transactions/AddTransaction';
// import TransactionList from '../components/Transactions/TransactionList'; // This should still be commented out
import axios from 'axios'; // Add this line
import EditTransaction from '../components/Transactions/EditTransaction'; // Add this line

function TransactionsPage() {
  const [transactionAdded, setTransactionAdded] = useState(false);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get('/categories', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setCategories(response.data);
        } catch (err) {
          console.error('Error fetching categories:', err.response ? err.response.data : err.message);
        }
      }
    };
    fetchCategories();
  }, []);

  const fetchTransactions = async (month = filterMonth, year = filterYear, category = filterCategory, search = searchQuery) => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const params = new URLSearchParams();
        if (month) params.append('month', month);
        if (year) params.append('year', year);
        if (category) params.append('category', category);
        if (search) params.append('search', search);

        const response = await axios.get(`/transactions/filter?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFilteredTransactions(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching transactions:', err.response ? err.response.data : err.message);
        setError(err.response?.data?.message || err.message);
        setLoading(false);
        setFilteredTransactions([]);
      }
    } else {
      setLoading(false);
      setFilteredTransactions([]);
    }
  };

  useEffect(() => {
    fetchTransactions(); // Fetch initial or filtered transactions
  }, [filterMonth, filterYear, filterCategory, searchQuery, transactionAdded]); // Re-fetch on filter or add

  const handleTransactionAdded = () => {
    setTransactionAdded(!transactionAdded);
  };

  return (
    <div>
      <h2>Transactions</h2>
      <AddTransaction onTransactionAdded={handleTransactionAdded} />

      <div>
        <h3>Filter Transactions</h3>
        <label htmlFor="month">Month:</label>
        <select id="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
          <option value="">All</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })}</option>
          ))}
        </select>

        <label htmlFor="year">Year:</label>
        <select id="year" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
          <option value="">All</option>
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <label htmlFor="category">Category:</label>
        <select id="category" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>{cat.name}</option>
          ))}
        </select>

        <label htmlFor="search">Search:</label>
        <input type="text" id="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search title or description" />
      </div>

      {loading ? (
        <div>Loading transactions...</div>
      ) : error ? (
        <div>Error loading transactions: {error}</div>
      ) : (
        <TransactionList transactions={filteredTransactions} onTransactionUpdated={handleTransactionAdded} />
      )}
    </div>
  );
}

// Moved TransactionList component here
function TransactionList({ transactions, onTransactionUpdated }) {
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [refreshTransactions, setRefreshTransactions] = useState(false);

  const handleDeleteTransaction = async (id) => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await axios.delete(`/transactions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        alert('Transaction deleted successfully!');
        onTransactionUpdated(); // Notify parent to refresh
      } catch (error) {
        console.error('Error deleting transaction:', error.response ? error.response.data : error.message);
        alert(`Error deleting transaction: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleEditTransaction = (id) => {
    setEditingTransactionId(id);
  };

  const handleCloseEditForm = () => {
    setEditingTransactionId(null);
  };

  return (
    <div>
      <h3>Transaction List</h3>
      <ul>
        {transactions.map((transaction) => (
          <li key={transaction.id}>
            {transaction.title} - {transaction.amount} ({transaction.type}) - {new Date(transaction.date).toLocaleDateString()} - {transaction.category}
            <button onClick={() => handleEditTransaction(transaction.id)}>Edit</button>
            <button onClick={() => handleDeleteTransaction(transaction.id)}>Delete</button>
            {editingTransactionId === transaction.id && (
              <EditTransaction transactionId={transaction.id} onClose={handleCloseEditForm} onTransactionUpdated={onTransactionUpdated} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TransactionsPage;