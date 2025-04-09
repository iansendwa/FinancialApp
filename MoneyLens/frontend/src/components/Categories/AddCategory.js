import React, { useState } from 'react';
import axios from 'axios';

function AddCategory({ onCategoryAdded }) {
  const [name, setName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await axios.post('/categories', { name }, { headers: { Authorization: `Bearer ${token}` } });
        alert('Category added successfully!');
        setName('');
        if (onCategoryAdded) {
          onCategoryAdded(); // Callback to refresh category list
        }
      } catch (error) {
        console.error('Error adding category:', error.response ? error.response.data : error.message);
        alert(`Error adding category: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  return (
    <div>
      <h4>Add New Category</h4>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name:</label>
          <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <button type="submit">Add Category</button>
      </form>
    </div>
  );
}

export default AddCategory;