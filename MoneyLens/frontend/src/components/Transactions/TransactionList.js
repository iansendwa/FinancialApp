import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EditTransaction from './EditTransaction';

function TransactionList() {
  const [transactions, setTransactions] = useState([]);
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [refreshTransactions, setRefreshTransactions] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get('/transactions', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setTransactions(response.data);
        } catch (error) {
          console.error('Error fetching transactions:', error.response ? error.response.data : error.message);
        }
      }
    };

    fetchTransactions();
    setRefreshTransactions(false); // Reset refresh state
  }, [refreshTransactions]);

  const handleDeleteTransaction = async (id) => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await axios.delete(`/transactions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        alert('Transaction deleted successfully!');
        setRefreshTransactions(true); // Trigger refresh
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
      <h3>Transactions</h3>
      <ul>
        {transactions.map((transaction) => (
          <li key={transaction.id}>
            {transaction.title} - {transaction.amount} ({transaction.type}) - {new Date(transaction.date).toLocaleDateString()} - {transaction.category}
            <button onClick={() => handleEditTransaction(transaction.id)}>Edit</button>
            <button onClick={() => handleDeleteTransaction(transaction.id)}>Delete</button>
            {editingTransactionId === transaction.id && (
              <EditTransaction transactionId={transaction.id} onClose={handleCloseEditForm} onTransactionUpdated={() => setRefreshTransactions(true)} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TransactionList;