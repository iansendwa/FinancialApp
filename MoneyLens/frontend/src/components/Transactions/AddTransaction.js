import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AddTransaction({ onTransactionAdded }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('Expense');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
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
        } catch (error) {
          console.error('Error fetching categories:', error.response ? error.response.data : error.message);
        }
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await axios.post(
          '/transactions',
          { title, amount: parseFloat(amount), type, date, category, description },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Transaction added successfully!');
        if (onTransactionAdded) {
          onTransactionAdded(); // Callback to refresh transaction list
        }
        setTitle('');
        setAmount('');
        setDate('');
        setDescription('');
      } catch (error) {
        console.error('Error adding transaction:', error.response ? error.response.data : error.message);
        alert(`Error adding transaction: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  return (
    <div>
      <h3>Add New Transaction</h3>
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
        <button type="submit">Add Transaction</button>
      </form>
    </div>
  );
}

export default AddTransaction;