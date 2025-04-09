import React, { useState, useEffect } from 'react';
import axios from 'axios';

function EditTransaction({ transactionId, onClose, onTransactionUpdated }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('Expense');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransaction = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get(`/transactions/${transactionId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const transactionData = response.data;
          setTitle(transactionData.title);
          setAmount(transactionData.amount);
          setType(transactionData.type);
          setDate(transactionData.date.split('T')[0]); // Format date
          setCategory(transactionData.category);
          setDescription(transactionData.description);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching transaction:', error.response ? error.response.data : error.message);
          alert(`Error fetching transaction: ${error.response?.data?.message || error.message}`);
          onClose();
        }
      }
    };

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

    fetchTransaction();
    fetchCategories();
  }, [transactionId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await axios.put(
          `/transactions/${transactionId}`,
          { title, amount: parseFloat(amount), type, date, category, description },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Transaction updated successfully!');
        onTransactionUpdated();
        onClose();
      } catch (error) {
        console.error('Error updating transaction:', error.response ? error.response.data : error.message);
        alert(`Error updating transaction: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  if (loading) {
    return <div>Loading transaction details...</div>;
  }

  return (
    <div className="edit-transaction-form">
      <h4>Edit Transaction</h4>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Title:</label>
          <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="amount">Amount:</label>
          <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="type">Type:</label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="Expense">Expense</option>
            <option value="Income">Income</option>
          </select>
        </div>
        <div>
          <label htmlFor="date">Date:</label>
          <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="category">Category:</label>
          <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} required>
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="description">Description:</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <button type="submit">Update Transaction</button>
        <button type="button" onClick={onClose}>Cancel</button>
      </form>
    </div>
  );
}

export default EditTransaction;